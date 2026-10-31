
import mongoose from "mongoose";
import { z } from "zod";
import InterviewSchedule from "../models/InterviewSchedule.js";
import Application from "../models/Application.js";
import { createNotification } from "../utils/notificationService.js";
import { writeAuditLog } from "../utils/auditService.js";

const createScheduleSchema = z.object({
  applicationId: z.string().regex(/^[a-f\d]{24}$/i),
  roundType: z.enum([
    "ONLINE_ASSESSMENT",
    "TECHNICAL_INTERVIEW",
    "HR_INTERVIEW",
    "OTHER",
  ]),
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  mode: z.enum(["ONLINE", "IN_PERSON"]),
  locationOrLink: z.string().trim().max(1000).optional(),
});

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(1000).optional(),
});

function formatSchedule(schedule) {
  const application = schedule.application;
  const student = application?.student;

  return {
    id: schedule._id.toString(),
    job: schedule.job?._id?.toString() ?? schedule.job?.toString(),
    jobTitle: schedule.job?.title,
    companyName: schedule.job?.companyName,
    application:
      application?._id?.toString() ?? application?.toString(),
    applicationStatus: application?.status,
    student:
      student?._id?.toString() ?? student?.toString(),
    studentName: student?.name,
    studentEmail: student?.email,
    recruiter:
      schedule.recruiter?._id?.toString() ??
      schedule.recruiter?.toString(),
    roundType: schedule.roundType,
    title: schedule.title,
    description: schedule.description,
    scheduledAt: schedule.scheduledAt,
    durationMinutes: schedule.durationMinutes,
    mode: schedule.mode,
    locationOrLink: schedule.locationOrLink,
    status: schedule.status,
    tpoDecision: schedule.tpoDecision,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}

// Recruiter proposes an OA/interview for an applicant belonging to their job.
export async function createSchedule(req, res, next) {
  try {
    const parsed = createScheduleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid schedule details.",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const scheduledAt = new Date(data.scheduledAt);

    if (scheduledAt <= new Date()) {
      return res.status(400).json({
        message: "Schedule must be in the future.",
      });
    }

    if (data.mode === "ONLINE" && !data.locationOrLink?.trim()) {
      return res.status(400).json({
        message: "Provide the online meeting link or access instructions.",
      });
    }

    if (data.mode === "IN_PERSON" && !data.locationOrLink?.trim()) {
      return res.status(400).json({
        message: "Provide the in-person venue.",
      });
    }

    const application = await Application.findById(data.applicationId)
      .populate("job", "title companyName recruiter status")
      .populate("student", "name email");

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    if (
      !application.job ||
      application.job.recruiter.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot schedule a round for this application.",
      });
    }

    if (
      !["SHORTLISTED", "OA_SCHEDULED", "INTERVIEW_SCHEDULED"].includes(
        application.status
      )
    ) {
      return res.status(409).json({
        message: "Only shortlisted applicants can be scheduled.",
      });
    }

    if (application.job.status !== "PUBLISHED") {
      return res.status(409).json({
        message: "This job is not currently published.",
      });
    }

    const schedule = await InterviewSchedule.create({
      job: application.job._id,
      application: application._id,
      recruiter: req.user.id,
      roundType: data.roundType,
      title: data.title,
      description: data.description,
      scheduledAt,
      durationMinutes: data.durationMinutes,
      mode: data.mode,
      locationOrLink: data.locationOrLink,
      status: "PENDING_APPROVAL",
    });

    await writeAuditLog({
      actor: req.user.id,
      action: "SCHEDULE_PROPOSED",
      entityType: "SCHEDULE",
      entityId: schedule._id,
      details: {
        applicationId: application._id.toString(),
        jobId: application.job._id.toString(),
        roundType: schedule.roundType,
        scheduledAt: schedule.scheduledAt,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: "Schedule proposal submitted for TPO approval.",
      schedule: formatSchedule(schedule),
    });
  } catch (error) {
    next(error);
  }
}

// Recruiter views schedules they proposed.
export async function getRecruiterSchedules(req, res, next) {
  try {
    const schedules = await InterviewSchedule.find({
      recruiter: req.user.id,
    })
      .populate("job", "title companyName")
      .populate({
        path: "application",
        select: "status student",
        populate: {
          path: "student",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .limit(500);

    return res.json({
      schedules: schedules.map(formatSchedule),
    });
  } catch (error) {
    next(error);
  }
}

// TPO views schedules waiting for a decision.
export async function listPendingSchedules(req, res, next) {
  try {
    const schedules = await InterviewSchedule.find({
      status: "PENDING_APPROVAL",
    })
      .populate("job", "title companyName")
      .populate({
        path: "application",
        select: "status student",
        populate: {
          path: "student",
          select: "name email rollNumber branch",
        },
      })
      .populate("recruiter", "name email companyName")
      .sort({ scheduledAt: 1 })
      .limit(500);

    return res.json({
      schedules: schedules.map(formatSchedule),
    });
  } catch (error) {
    next(error);
  }
}

// TPO approves or rejects a proposed schedule.
export async function decideSchedule(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.scheduleId)) {
      return res.status(400).json({
        message: "Invalid schedule ID.",
      });
    }

    const parsed = decisionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid decision.",
        errors: parsed.error.flatten(),
      });
    }

    const schedule = await InterviewSchedule.findById(
      req.params.scheduleId
    );

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found.",
      });
    }

    if (schedule.status !== "PENDING_APPROVAL") {
      return res.status(409).json({
        message: "This schedule has already been decided.",
      });
    }

    const application = await Application.findById(schedule.application)
      .populate("job", "title companyName recruiter status")
      .populate("student", "name email");

    if (!application || !application.job) {
      return res.status(409).json({
        message: "The associated application or job no longer exists.",
      });
    }

    if (
      application.job.recruiter.toString() !== schedule.recruiter.toString()
    ) {
      return res.status(409).json({
        message: "Schedule ownership could not be verified.",
      });
    }

    if (parsed.data.decision === "APPROVE") {
      if (application.job.status !== "PUBLISHED") {
        return res.status(409).json({
          message: "Cannot approve a schedule for a job that is not published.",
        });
      }

      if (
        !["SHORTLISTED", "OA_SCHEDULED", "INTERVIEW_SCHEDULED"].includes(
          application.status
        )
      ) {
        return res.status(409).json({
          message: "The application is no longer eligible for scheduling.",
        });
      }

      if (new Date(schedule.scheduledAt) <= new Date()) {
        return res.status(409).json({
          message: "This proposed schedule is now in the past. Ask the recruiter to propose a new schedule.",
        });
      }
    }

    const approved = parsed.data.decision === "APPROVE";
    const previousStatus = application.status;

    schedule.status = approved ? "APPROVED" : "REJECTED";
    schedule.tpoDecision = {
      decidedBy: req.user.id,
      decidedAt: new Date(),
      note: parsed.data.note,
    };

    await schedule.save();

    if (approved) {
      const nextStatus =
        schedule.roundType === "ONLINE_ASSESSMENT"
          ? "OA_SCHEDULED"
          : "INTERVIEW_SCHEDULED";

      // Avoid duplicate history entries if the application already has
      // this status due to another approved round.
      if (application.status !== nextStatus) {
        application.status = nextStatus;
        application.statusHistory.push({
          status: nextStatus,
          changedBy: req.user.id,
          note: `TPO approved schedule: ${schedule.title}`,
          changedAt: new Date(),
        });

        await application.save();
      } else {
        // The schedule is still approved even if the application status
        // already matches this round type.
        application.status = nextStatus;
      }
    }

    await createNotification({
      recipient: application.student._id,
      type: "SCHEDULE_UPDATE",
      title: approved
        ? "Assessment/interview schedule approved"
        : "Assessment/interview schedule rejected",
      message: approved
        ? `"${schedule.title}" is approved for ${schedule.scheduledAt.toISOString()}.`
        : `The proposed schedule "${schedule.title}" was rejected by the placement office.`,
      relatedEntityType: "SCHEDULE",
      relatedEntityId: schedule._id,
    });

    await createNotification({
      recipient: schedule.recruiter,
      type: "SCHEDULE_UPDATE",
      title: approved
        ? "Schedule proposal approved"
        : "Schedule proposal rejected",
      message: approved
        ? `Your proposed schedule "${schedule.title}" has been approved.`
        : `Your proposed schedule "${schedule.title}" was rejected.`,
      relatedEntityType: "SCHEDULE",
      relatedEntityId: schedule._id,
    });

    await writeAuditLog({
      actor: req.user.id,
      action: approved ? "SCHEDULE_APPROVED" : "SCHEDULE_REJECTED",
      entityType: "SCHEDULE",
      entityId: schedule._id,
      details: {
        applicationId: application._id.toString(),
        jobId: application.job._id.toString(),
        previousApplicationStatus: previousStatus,
        applicationStatus: application.status,
        scheduleStatus: schedule.status,
        note: parsed.data.note,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: `Schedule ${schedule.status.toLowerCase()}.`,
      schedule: formatSchedule({
        ...schedule.toObject(),
        job: application.job,
        application,
      }),
    });
  } catch (error) {
    next(error);
  }
}

// Student sees only approved schedules linked to their own applications.
export async function getStudentSchedules(req, res, next) {
  try {
    const ownApplications = await Application.find({
      student: req.user.id,
    }).select("_id");

    const applicationIds = ownApplications.map((item) => item._id);

    const schedules = await InterviewSchedule.find({
      status: "APPROVED",
      application: { $in: applicationIds },
    })
      .populate("job", "title companyName")
      .populate({
        path: "application",
        select: "status student",
        populate: {
          path: "student",
          select: "name email",
        },
      })
      .sort({ scheduledAt: 1 })
      .limit(500);

    return res.json({
      schedules: schedules.map(formatSchedule),
    });
  } catch (error) {
    next(error);
  }
}
