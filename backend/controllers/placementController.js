
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import Application from "../models/Application.js";
import PlacementOffer from "../models/PlacementOffer.js";
import { createNotification } from "../utils/notificationService.js";
import { writeAuditLog } from "../utils/auditService.js";

const resultSchema = z.object({
  applicationId: z.string().regex(/^[a-f\d]{24}$/i),
  result: z.enum(["SELECTED", "NOT_SELECTED"]),
  offeredCompensation: z.coerce.number().finite().min(0).optional(),
  currency: z.string().trim().length(3).default("INR"),
  offerDetails: z.string().trim().max(3000).optional(),
}).strict();

const offerResponseSchema = z.object({
  response: z.enum(["ACCEPTED", "DECLINED"]),
  note: z.string().trim().max(1000).optional(),
}).strict();

function formatOffer(offer) {
  const student = offer.student;
  const job = offer.job;
  const recruiter = offer.recruiter;
  const application = offer.application;

  return {
    id: offer._id.toString(),
    applicationId:
      application?._id?.toString() ?? application?.toString(),
    student: student?._id?.toString() ?? student?.toString(),
    studentName: student?.name,
    studentEmail: student?.email,
    job: job?._id?.toString() ?? job?.toString(),
    jobTitle: job?.title,
    companyName: job?.companyName,
    jobType: job?.jobType,
    recruiter:
      recruiter?._id?.toString() ?? recruiter?.toString(),
    recruiterName: recruiter?.name,
    result: offer.result,
    offeredCompensation: offer.offeredCompensation,
    currency: offer.currency,
    offerDetails: offer.offerDetails,
    offerStatus: offer.offerStatus,
    announcedAt: offer.announcedAt,
    history: offer.history,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };
}

function isActiveUser(req, role) {
  return (
    req.user?.role === role &&
    req.user?.accountStatus === "ACTIVE"
  );
}

// Recruiter submits a final result for an application belonging to their job.
export async function submitFinalResult(req, res, next) {
  let session;

  try {
    if (!isActiveUser(req, "RECRUITER")) {
      return res.status(403).json({
        message: "Only active, approved recruiters can submit final results.",
      });
    }

    const parsed = resultSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid final result.",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    if (
      data.result === "SELECTED" &&
      data.offeredCompensation === undefined
    ) {
      return res.status(400).json({
        message: "Compensation is required for a selected applicant.",
      });
    }

    if (
      data.result === "NOT_SELECTED" &&
      data.offeredCompensation !== undefined
    ) {
      return res.status(400).json({
        message:
          "Compensation should only be provided for selected applicants.",
      });
    }

    session = await mongoose.startSession();

    let createdOffer;
    let studentId;
    let jobId;
    let jobTitle;

    await session.withTransaction(async () => {
      const application = await Application.findById(data.applicationId)
        .session(session)
        .populate("job", "title companyName recruiter status jobType");

      if (!application) {
        const error = new Error("Application not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        !application.job ||
        !application.job.recruiter ||
        application.job.recruiter.toString() !== req.user.id
      ) {
        const error = new Error(
          "You cannot submit a result for this application."
        );
        error.statusCode = 403;
        throw error;
      }

      if (!["PUBLISHED", "CLOSED"].includes(application.job.status)) {
        const error = new Error(
          "Results can only be submitted for an approved job."
        );
        error.statusCode = 409;
        throw error;
      }

      if (
        [
          "WITHDRAWN",
          "REJECTED",
          "NOT_SELECTED",
          "SELECTED",
        ].includes(application.status)
      ) {
        const error = new Error(
          "This application cannot receive a final result in its current state."
        );
        error.statusCode = 409;
        throw error;
      }

      const existingOffer = await PlacementOffer.findOne({
        application: application._id,
      }).session(session);

      if (existingOffer) {
        const error = new Error(
          "A final result has already been submitted for this application."
        );
        error.statusCode = 409;
        throw error;
      }

      const offers = await PlacementOffer.create(
        [
          {
            application: application._id,
            student: application.student,
            job: application.job._id,
            recruiter: req.user.id,
            result: data.result,
            offeredCompensation:
              data.result === "SELECTED"
                ? data.offeredCompensation
                : undefined,
            currency: data.currency.toUpperCase(),
            offerDetails: data.offerDetails,
            offerStatus:
              data.result === "SELECTED"
                ? "PENDING_RESPONSE"
                : "NOT_APPLICABLE",
            history: [
              {
                action: "RESULT_ANNOUNCED",
                changedBy: req.user.id,
                note: `Final result: ${data.result}`,
                changedAt: new Date(),
              },
            ],
          },
        ],
        { session }
      );

      const offer = offers[0];

      application.status = data.result;
      application.statusHistory.push({
        status: data.result,
        changedBy: req.user.id,
        note: "Final result submitted by recruiter.",
        changedAt: new Date(),
      });

      await application.save({ session });

      // A SELECTED result locks the student's ability to apply for new jobs.
      // The offer, application status, and placement lock commit together.
      if (data.result === "SELECTED") {
        const lockResult = await User.updateOne(
          {
            _id: application.student,
            role: "STUDENT",
          },
          {
            $set: {
              placementLocked: true,
              placementLockedAt: new Date(),
            },
          },
          { session }
        );

        if (lockResult.matchedCount !== 1) {
          const error = new Error(
            "Unable to lock the selected student's placement eligibility."
          );
          error.statusCode = 409;
          throw error;
        }
      }

      createdOffer = offer;
      studentId = application.student;
      jobId = application.job._id;
      jobTitle = application.job.title;
    });

    // Notifications and audit logs are intentionally written after the
    // transaction so a failed transaction does not announce an uncommitted result.
    await createNotification({
      recipient: studentId,
      type: "PLACEMENT_RESULT",
      title:
        data.result === "SELECTED"
          ? "Congratulations! You have been selected"
          : "Placement result updated",
      message:
        data.result === "SELECTED"
          ? `You have been selected for ${jobTitle}. Your ability to apply for additional jobs is now locked. Please review your offer details.`
          : `Your final result for ${jobTitle} has been recorded.`,
      relatedEntityType: "OFFER",
      relatedEntityId: createdOffer._id,
    });

    await createNotification({
      recipient: req.user.id,
      type: "PLACEMENT_RESULT",
      title: "Final result submitted",
      message: `The final result for ${jobTitle} has been recorded successfully.`,
      relatedEntityType: "OFFER",
      relatedEntityId: createdOffer._id,
    });

    await writeAuditLog({
      actor: req.user.id,
      action: "FINAL_RESULT_SUBMITTED",
      entityType: "PLACEMENT_OFFER",
      entityId: createdOffer._id,
      details: {
        result: data.result,
        jobId: jobId.toString(),
        applicationId: data.applicationId,
        placementLocked: data.result === "SELECTED",
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: "Final result submitted successfully.",
      offer: formatOffer(createdOffer),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A final result already exists for this application.",
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// Student views their own final results.
export async function getMyPlacementResults(req, res, next) {
  try {
    if (!isActiveUser(req, "STUDENT")) {
      return res.status(403).json({
        message: "Only active students can view their placement results.",
      });
    }

    const offers = await PlacementOffer.find({
      student: req.user.id,
    })
      .populate("student", "name email")
      .populate("job", "title companyName jobType")
      .populate("recruiter", "name email companyName")
      .sort({ announcedAt: -1 })
      .limit(500);

    return res.json({
      results: offers.map(formatOffer),
    });
  } catch (error) {
    return next(error);
  }
}

// TPO views results and can filter by result or offer status.
export async function listPlacementResults(req, res, next) {
  try {
    if (!isActiveUser(req, "TPO")) {
      return res.status(403).json({
        message: "Only active TPO accounts can view placement results.",
      });
    }

    const filter = {};

    if (req.query.result !== undefined) {
      if (!["SELECTED", "NOT_SELECTED"].includes(req.query.result)) {
        return res.status(400).json({
          message: "Invalid result filter.",
        });
      }

      filter.result = req.query.result;
    }

    if (req.query.offerStatus !== undefined) {
      const allowedStatuses = [
        "NOT_APPLICABLE",
        "PENDING_RESPONSE",
        "ACCEPTED",
        "DECLINED",
        "WITHDRAWN",
      ];

      if (!allowedStatuses.includes(req.query.offerStatus)) {
        return res.status(400).json({
          message: "Invalid offer status filter.",
        });
      }

      filter.offerStatus = req.query.offerStatus;
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25)
    );

    const [offers, total] = await Promise.all([
      PlacementOffer.find(filter)
        .populate(
          "student",
          "name email rollNumber branch studentYear graduationYear placementLocked placementLockedAt"
        )
        .populate("job", "title companyName jobType")
        .populate("recruiter", "name email companyName")
        .sort({ announcedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PlacementOffer.countDocuments(filter),
    ]);

    return res.json({
      results: offers.map(formatOffer),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Student accepts or declines their own offer.
// Declining an offer does not automatically unlock placement eligibility.
export async function respondToOffer(req, res, next) {
  let session;

  try {
    if (!isActiveUser(req, "STUDENT")) {
      return res.status(403).json({
        message: "Only active students can respond to offers.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.offerId)) {
      return res.status(400).json({
        message: "Invalid offer ID.",
      });
    }

    const parsed = offerResponseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid offer response.",
        errors: parsed.error.flatten(),
      });
    }

    session = await mongoose.startSession();

    let updatedOffer;
    let recruiterId;
    let responseAction;

    await session.withTransaction(async () => {
      const offer = await PlacementOffer.findOne({
        _id: req.params.offerId,
        student: req.user.id,
      }).session(session);

      if (!offer) {
        const error = new Error("Offer not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        offer.result !== "SELECTED" ||
        offer.offerStatus !== "PENDING_RESPONSE"
      ) {
        const error = new Error(
          "This offer is not awaiting a response."
        );
        error.statusCode = 409;
        throw error;
      }

      offer.offerStatus = parsed.data.response;

      responseAction =
        parsed.data.response === "ACCEPTED"
          ? "OFFER_ACCEPTED"
          : "OFFER_DECLINED";

      offer.history.push({
        action: responseAction,
        changedBy: req.user.id,
        note: parsed.data.note,
        changedAt: new Date(),
      });

      await offer.save({ session });

      updatedOffer = offer;
      recruiterId = offer.recruiter;
    });

    const job = await mongoose
      .model("Job")
      .findById(updatedOffer.job)
      .select("title companyName")
      .lean();

    const jobTitle = job?.title ?? "your position";

    await createNotification({
      recipient: recruiterId,
      type: "OFFER_UPDATE",
      title:
        parsed.data.response === "ACCEPTED"
          ? "Student accepted the offer"
          : "Student declined the offer",
      message: `The student has ${parsed.data.response.toLowerCase()} the offer for ${jobTitle}.`,
      relatedEntityType: "OFFER",
      relatedEntityId: updatedOffer._id,
    });

    await createNotification({
      recipient: req.user.id,
      type: "OFFER_UPDATE",
      title:
        parsed.data.response === "ACCEPTED"
          ? "Offer accepted"
          : "Offer declined",
      message: `You have ${parsed.data.response.toLowerCase()} the offer for ${jobTitle}.`,
      relatedEntityType: "OFFER",
      relatedEntityId: updatedOffer._id,
    });

    await writeAuditLog({
      actor: req.user.id,
      action: responseAction,
      entityType: "PLACEMENT_OFFER",
      entityId: updatedOffer._id,
      details: {
        response: parsed.data.response,
        note: parsed.data.note,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: `Offer ${parsed.data.response.toLowerCase()}.`,
      offer: formatOffer(updatedOffer),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This offer has already been processed.",
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
