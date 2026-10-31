
import mongoose from "mongoose";
import { z } from "zod";

import User from "../models/User.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import Application from "../models/Application.js";

const applySchema = z
  .object({
    resumeId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  })
  .strict();

const applicationDecisionSchema = z
  .object({
    status: z.enum(["SHORTLISTED", "REJECTED"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

function isStudentEligible(student, job) {
  // Third-year students can apply only for internships.
  if (
    student.studentYear === "THIRD_YEAR" &&
    job.jobType !== "INTERNSHIP"
  ) {
    return false;
  }

  // If branch restrictions exist, the student's branch must match.
  const eligibleBranches = Array.isArray(job.eligibleBranches)
    ? job.eligibleBranches
    : [];

  if (eligibleBranches.length > 0) {
    if (
      !student.branch ||
      !eligibleBranches.includes(student.branch)
    ) {
      return false;
    }
  }

  // If graduation-year restrictions exist, the student's year must match.
  const eligibleGraduationYears = Array.isArray(
    job.eligibleGraduationYears
  )
    ? job.eligibleGraduationYears
    : [];

  if (eligibleGraduationYears.length > 0) {
    if (
      !Number.isInteger(student.graduationYear) ||
      !eligibleGraduationYears.includes(student.graduationYear)
    ) {
      return false;
    }
  }

  // Missing minimum CGPA means no CGPA restriction.
  if (
    job.minimumCgpa !== undefined &&
    job.minimumCgpa !== null
  ) {
    if (
      typeof student.cgpa !== "number" ||
      student.cgpa < job.minimumCgpa
    ) {
      return false;
    }
  }

  return true;
}

function formatApplication(application) {
  const job = application.job;
  const student = application.student;

  return {
    id: application._id.toString(),
    status: application.status,
    appliedAt: application.appliedAt,
    recruiterNote: application.recruiterNote,
    statusHistory: application.statusHistory,

    resume: application.resume
      ? {
          id: application.resume._id.toString(),
          originalName: application.resume.originalName,
          mimeType: application.resume.mimeType,
          size: application.resume.size,
        }
      : null,

    job:
      job && job.title
        ? {
            id: job._id.toString(),
            title: job.title,
            companyName: job.companyName,
            jobType: job.jobType,
            location: job.location,
            workMode: job.workMode,
            compensation: job.compensation,
            applicationDeadline: job.applicationDeadline,
            status: job.status,
          }
        : job
          ? { id: job.toString() }
          : null,

    student:
      student && student.name
        ? {
            id: student._id.toString(),
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
            studentYear: student.studentYear,
            branch: student.branch,
            cgpa: student.cgpa,
            graduationYear: student.graduationYear,
          }
        : undefined,
  };
}

function validationError(res, parsed, message) {
  return res.status(400).json({
    success: false,
    message,
    errors: parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}


export async function applyToJob(req, res) {
  if (!mongoose.isValidObjectId(req.params.jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID.",
    });
  }

  const parsed = applySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return validationError(res, parsed, "Invalid application information.");
  }

  let session;
  try {
    session = await mongoose.startSession();
    let responseData;

    await session.withTransaction(async () => {
      const student = await User.findOne({
        _id: req.user.id,
        role: "STUDENT",
        accountStatus: "ACTIVE",
        emailVerified: true,
      }).session(session);

      if (!student) {
        const error = new Error(
          "An active, verified student account is required."
        );
        error.statusCode = 403;
        throw error;
      }

      // Write to the same student document that placement selection updates.
      // This makes application submission conflict with a concurrent selection
      // transaction rather than relying on a read-only placement-lock check.
      const claim = await User.updateOne(
        {
          _id: student._id,
          role: "STUDENT",
          accountStatus: "ACTIVE",
          emailVerified: true,
          placementLocked: { $ne: true },
        },
        { $set: { placementLocked: false } },
        { session, timestamps: true }
      );

      if (claim.matchedCount !== 1) {
        const error = new Error(
          "You have already been placed and cannot apply for additional jobs. Contact the TPO office if you believe this is a mistake."
        );
        error.statusCode = 403;
        error.code = "PLACEMENT_LOCKED";
        throw error;
      }

      const job = await Job.findOne({
        _id: req.params.jobId,
        status: "PUBLISHED",
        applicationDeadline: { $gt: new Date() },
      }).session(session);

      if (!job) {
        const error = new Error("Job not found or applications are closed.");
        error.statusCode = 404;
        throw error;
      }

      if (!isStudentEligible(student, job)) {
        const error = new Error(
          "You do not meet the eligibility requirements for this job."
        );
        error.statusCode = 403;
        throw error;
      }

      let resume = null;
      if (parsed.data.resumeId) {
        resume = await Resume.findOne({
          _id: parsed.data.resumeId,
          student: student._id,
        }).session(session);

        if (!resume) {
          const error = new Error(
            "The selected resume was not found in your account."
          );
          error.statusCode = 400;
          throw error;
        }
      }

      const [application] = await Application.create(
        [
          {
            student: student._id,
            job: job._id,
            resume: resume?._id ?? null,
            status: "APPLIED",
            statusHistory: [
              {
                status: "APPLIED",
                changedBy: student._id,
                note: "Application submitted.",
              },
            ],
          },
        ],
        { session }
      );

      responseData = {
        id: application._id.toString(),
        jobId: job._id.toString(),
        status: application.status,
        appliedAt: application.appliedAt,
        resumeId: resume?._id.toString() ?? null,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: responseData,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job.",
      });
    }

    if (error?.code === "PLACEMENT_LOCKED") {
      return res.status(403).json({
        success: false,
        code: "PLACEMENT_LOCKED",
        message: error.message,
      });
    }

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Apply to job error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit application.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

export async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({
      student: req.user.id,
    })
      .populate("job")
      .populate("resume", "originalName mimeType size")
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      data: applications.map(formatApplication),
    });
  } catch (error) {
    console.error("Get student applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your applications.",
    });
  }
}

export async function getRecruiterApplicants(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const recruiter = await User.findOne({
      _id: req.user.id,
      role: "RECRUITER",
      accountStatus: "ACTIVE",
      emailVerified: true,
    });

    if (!recruiter) {
      return res.status(403).json({
        success: false,
        message: "An active, verified recruiter account is required.",
      });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: recruiter._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found in your recruiter account.",
      });
    }

    const applications = await Application.find({
      job: job._id,
    })
      .populate(
        "student",
        "name email rollNumber studentYear branch cgpa graduationYear"
      )
      .populate("resume", "originalName mimeType size")
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      data: applications.map(formatApplication),
    });
  } catch (error) {
    console.error("Get recruiter applicants error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve applicants.",
    });
  }
}

export async function updateApplicationDecision(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const parsed = applicationDecisionSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(
        res,
        parsed,
        "Invalid application decision."
      );
    }

    const recruiter = await User.findOne({
      _id: req.user.id,
      role: "RECRUITER",
      accountStatus: "ACTIVE",
      emailVerified: true,
    });

    if (!recruiter) {
      return res.status(403).json({
        success: false,
        message: "An active, verified recruiter account is required.",
      });
    }

    const application = await Application.findById(
      req.params.applicationId
    ).populate("job");

    if (!application || !application.job) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    // Recruiters can only manage applications for their own jobs.
    if (application.job.recruiter.toString() !== recruiter._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot update applications for another recruiter's job.",
      });
    }

    // Only applications in the initial review stage can be decided here.
    if (
      application.status !== "APPLIED" &&
      application.status !== "SHORTLISTED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This application has already progressed beyond the initial review stage.",
      });
    }

    const { status, note = "" } = parsed.data;

    application.status = status;
    application.recruiterNote = note;

    application.statusHistory.push({
      status,
      changedBy: recruiter._id,
      note,
    });

    await application.save();

    return res.status(200).json({
      success: true,
      message:
        status === "SHORTLISTED"
          ? "Applicant shortlisted successfully."
          : "Application rejected successfully.",
      data: {
        id: application._id.toString(),
        status: application.status,
        recruiterNote: application.recruiterNote,
        statusHistory: application.statusHistory,
      },
    });
  } catch (error) {
    console.error("Update application decision error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update application status.",
    });
  }
}
