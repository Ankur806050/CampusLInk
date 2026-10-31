
import mongoose from "mongoose";
import { z } from "zod";
import Company from "../models/Company.js";
import User from "../models/User.js";

const companyRequestSchema = z.object({
  name: z.string().trim().min(2).max(150),
  website: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(100).optional(),
  description: z.string().trim().max(3000).optional(),
  address: z.string().trim().max(500).optional(),
  hrName: z.string().trim().max(100).optional(),
  hrEmail: z.string().trim().email().max(254).optional(),
  hrPhone: z.string().trim().max(25).optional(),
}).strict();

const companyDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(1000).optional(),
}).strict();

function formatCompany(company) {
  return {
    id: company._id.toString(),
    name: company.name,
    website: company.website,
    industry: company.industry,
    description: company.description,
    address: company.address,
    hrName: company.hrName,
    hrEmail: company.hrEmail,
    hrPhone: company.hrPhone,
    requestedBy: company.requestedBy?._id
      ? company.requestedBy._id.toString()
      : company.requestedBy?.toString(),
    status: company.status,
    decision: company.decision,
    campusHistory: company.campusHistory,
    hiringHistory: company.hiringHistory,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export async function createCompanyRequest(req, res) {
  try {
    const parsed = companyRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid company information.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
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

    const existingPending = await Company.findOne({
      requestedBy: recruiter._id,
      status: "PENDING_APPROVAL",
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "You already have a company request awaiting review.",
        data: formatCompany(existingPending),
      });
    }

    const company = await Company.create({
      ...parsed.data,
      requestedBy: recruiter._id,
      status: "PENDING_APPROVAL",
    });

    return res.status(201).json({
      success: true,
      message: "Company registration request submitted to the TPO.",
      data: formatCompany(company),
    });
  } catch (error) {
    console.error("Create company request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit company registration request.",
    });
  }
}

export async function getMyCompanyRequests(req, res) {
  try {
    const companies = await Company.find({
      requestedBy: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: companies.map(formatCompany),
    });
  } catch (error) {
    console.error("Get company requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve company requests.",
    });
  }
}

export async function listCompanyRequestsForTpo(req, res) {
  try {
    const filter = {};

    if (req.query.status) {
      const allowedStatuses = [
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company status filter.",
        });
      }

      filter.status = req.query.status;
    }

    const companies = await Company.find(filter)
      .populate("requestedBy", "name email companyName designation")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: companies.map((company) => ({
        ...formatCompany(company),
        recruiterDetails: company.requestedBy
          ? {
              name: company.requestedBy.name,
              email: company.requestedBy.email,
              companyName: company.requestedBy.companyName,
              designation: company.requestedBy.designation,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("List TPO company requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve company requests.",
    });
  }
}

export async function decideCompanyRequest(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID.",
      });
    }

    const parsed = companyDecisionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid company decision.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const company = await Company.findOne({
      _id: req.params.companyId,
      status: "PENDING_APPROVAL",
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Pending company request not found. It may already have been reviewed.",
      });
    }

    const approved = parsed.data.decision === "APPROVE";

    company.status = approved ? "APPROVED" : "REJECTED";
    company.decision = {
      decidedBy: req.user.id,
      decidedAt: new Date(),
      note: parsed.data.note || "",
    };

    await company.save();

    // Keep the recruiter's displayed company name consistent with the approved record.
    if (approved) {
      await User.updateOne(
        { _id: company.requestedBy, role: "RECRUITER" },
        { $set: { companyName: company.name } }
      );
    }

    return res.status(200).json({
      success: true,
      message: approved
        ? "Company approved successfully."
        : "Company registration rejected.",
      data: formatCompany(company),
    });
  } catch (error) {
    console.error("Decide company request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process company decision.",
    });
  }
}
