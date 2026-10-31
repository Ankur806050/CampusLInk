
import mongoose from "mongoose";
import { z } from "zod";

import Job from "../models/Job.js";
import User from "../models/User.js";
import Company from "../models/Company.js";

const createJobSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(30).max(10000),
    jobType: z.enum(["INTERNSHIP", "FULL_TIME"]),
    location: z.string().trim().max(200).optional(),
    workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
    compensation: z.string().trim().min(1).max(200),
    eligibleBranches: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .optional(),
    minimumCgpa: z.number().min(0).max(10).optional(),
    eligibleGraduationYears: z
      .array(z.number().int().min(2020).max(2100))
      .max(20)
      .optional(),
    requiredSkills: z
      .array(z.string().trim().min(1).max(80))
      .max(100)
      .optional(),
    applicationDeadline: z.coerce.date(),
  })
  .strict();

const decisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

function formatJob(job) {
  return {
    id: job._id.toString(),
    recruiter: job.recruiter?._id
      ? job.recruiter._id.toString()
      : job.recruiter?.toString(),
    companyName: job.companyName,
    title: job.title,
    description: job.description,
    jobType: job.jobType,
    location: job.location,
    workMode: job.workMode,
    compensation: job.compensation,
    eligibleBranches: job.eligibleBranches,
    minimumCgpa: job.minimumCgpa,
    eligibleGraduationYears: job.eligibleGraduationYears,
    requiredSkills: job.requiredSkills,
    applicationDeadline: job.applicationDeadline,
    status: job.status,
    tpoDecision: job.tpoDecision,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

/**
 * Match job eligibility against a student's academic information.
 *
 * Unrestricted job criteria remain eligible when the corresponding
 * student field is missing. Restricted criteria require the student
 * to have the relevant academic information.
 */
function buildEligibilityFilter(student) {
  const branchConditions = [
    { eligibleBranches: { $exists: false } },
    { eligibleBranches: { $size: 0 } },
  ];

  if (typeof student.branch === "string" && student.branch.trim()) {
    branchConditions.push({
      eligibleBranches: student.branch,
    });
  }

  const graduationYearConditions = [
    { eligibleGraduationYears: { $exists: false } },
    { eligibleGraduationYears: { $size: 0 } },
  ];

  if (
    Number.isInteger(student.graduationYear) &&
    student.graduationYear >= 2020
  ) {
    graduationYearConditions.push({
      eligibleGraduationYears: student.graduationYear,
    });
  }

  const cgpaConditions = [
    { minimumCgpa: { $exists: false } },
    { minimumCgpa: null },
  ];

  if (typeof student.cgpa === "number" && Number.isFinite(student.cgpa)) {
    cgpaConditions.push({
      minimumCgpa: { $lte: student.cgpa },
    });
  }

  return {
    $and: [
      { $or: branchConditions },
      { $or: graduationYearConditions },
      { $or: cgpaConditions },
    ],
  };
}

function sendValidationError(res, parsed, message) {
  return res.status(400).json({
    success: false,
    message,
    errors: parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

// Recruiter creates a job, which must be approved by the TPO.
export async function createRecruiterJob(req, res) {
  try {
    const parsed = createJobSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendValidationError(
        res,
        parsed,
        "Invalid job information."
      );
    }

    const data = parsed.data;

    if (
      Number.isNaN(data.applicationDeadline.getTime()) ||
      data.applicationDeadline <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Application deadline must be a valid future date.",
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

    // A company must be approved before its recruiter can post jobs.
    const approvedCompany = await Company.findOne({
      requestedBy: recruiter._id,
      status: "APPROVED",
    }).sort({ createdAt: -1 });

    if (!approvedCompany) {
      return res.status(403).json({
        success: false,
        message:
          "Your company must be approved by the TPO before you can post jobs.",
      });
    }

    const job = await Job.create({
      ...data,
      recruiter: recruiter._id,
      companyName: approvedCompany.name,
      status: "PENDING_APPROVAL",
    });

    return res.status(201).json({
      success: true,
      message: "Job submitted to the TPO for approval.",
      data: formatJob(job),
    });
  } catch (error) {
    console.error("Create job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create job.",
    });
  }
}

// Recruiter views jobs submitted through their own account.
export async function getRecruiterJobs(req, res) {
  try {
    const jobs = await Job.find({
      recruiter: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: jobs.map(formatJob),
    });
  } catch (error) {
    console.error("Get recruiter jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve recruiter jobs.",
    });
  }
}

// Students see only published jobs that match their eligibility.
export async function listPublishedJobs(req, res) {
  try {
    const student = await User.findOne({
      _id: req.user.id,
      role: "STUDENT",
      accountStatus: "ACTIVE",
      emailVerified: true,
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "An active, verified student account is required.",
      });
    }

    const filter = {
      status: "PUBLISHED",
      applicationDeadline: { $gt: new Date() },
      ...buildEligibilityFilter(student),
    };

    // Third-year students can only view internships.
    if (student.studentYear === "THIRD_YEAR") {
      filter.jobType = "INTERNSHIP";
    }

    const jobs = await Job.find(filter).sort({
      applicationDeadline: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: jobs.map(formatJob),
    });
  } catch (error) {
    console.error("List published jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve published jobs.",
    });
  }
}

// Student views one published job only if eligible.
export async function getPublishedJobById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const student = await User.findOne({
      _id: req.user.id,
      role: "STUDENT",
      accountStatus: "ACTIVE",
      emailVerified: true,
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "An active, verified student account is required.",
      });
    }

    const filter = {
      _id: req.params.jobId,
      status: "PUBLISHED",
      applicationDeadline: { $gt: new Date() },
      ...buildEligibilityFilter(student),
    };

    if (student.studentYear === "THIRD_YEAR") {
      filter.jobType = "INTERNSHIP";
    }

    const job = await Job.findOne(filter);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you are not eligible to view it.",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatJob(job),
    });
  } catch (error) {
    console.error("Get published job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve job.",
    });
  }
}

// TPO views jobs awaiting approval.
export async function listJobsPendingApproval(req, res) {
  try {
    const jobs = await Job.find({
      status: "PENDING_APPROVAL",
    })
      .populate("recruiter", "name email companyName designation")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: jobs.map((job) => ({
        ...formatJob(job),
        recruiterDetails: job.recruiter
          ? {
              name: job.recruiter.name,
              email: job.recruiter.email,
              companyName: job.recruiter.companyName,
              designation: job.recruiter.designation,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("List pending jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve pending jobs.",
    });
  }
}

// TPO approves or rejects a pending job.
export async function decideJob(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const parsed = decisionSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendValidationError(
        res,
        parsed,
        "Provide a valid approval decision."
      );
    }

    const { decision, note } = parsed.data;

    // Confirm the job exists and is still pending.
    const pendingJob = await Job.findOne({
      _id: req.params.jobId,
      status: "PENDING_APPROVAL",
    });

    if (!pendingJob) {
      return res.status(404).json({
        success: false,
        message:
          "Pending job not found. It may already have been reviewed.",
      });
    }

    if (decision === "APPROVE") {
      // Ensure the company is approved before publishing.
      const approvedCompany = await Company.findOne({
        requestedBy: pendingJob.recruiter,
        status: "APPROVED",
        name: pendingJob.companyName,
      });

      if (!approvedCompany) {
        return res.status(409).json({
          success: false,
          message:
            "The recruiter's company is not currently approved. The job cannot be published.",
        });
      }
    }

    const nextStatus = decision === "APPROVE" ? "PUBLISHED" : "REJECTED";

    // Conditional update prevents overwriting a decision if another
    // request has already reviewed this job.
    const job = await Job.findOneAndUpdate(
      {
        _id: pendingJob._id,
        status: "PENDING_APPROVAL",
      },
      {
        $set: {
          status: nextStatus,
          tpoDecision: {
            decidedBy: req.user.id,
            decidedAt: new Date(),
            note: note || "",
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!job) {
      return res.status(409).json({
        success: false,
        message:
          "This job was already reviewed by another request. Refresh the job list and try again if necessary.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        decision === "APPROVE"
          ? "Job approved and published."
          : "Job rejected.",
      data: formatJob(job),
    });
  } catch (error) {
    console.error("Decide job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process job decision.",
    });
  }
}
