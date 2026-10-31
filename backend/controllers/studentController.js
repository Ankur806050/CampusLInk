
import { z } from "zod";
import User from "../models/User.js";

// Only allow students to update personal profile fields.
// Academic eligibility fields are read-only through this endpoint.
const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(25).optional(),
    bio: z.string().trim().max(1000).optional(),
    linkedinUrl: z.string().trim().max(300).optional(),
    githubUrl: z.string().trim().max(300).optional(),
    portfolioUrl: z.string().trim().max(300).optional(),
  })
  .strict();

function formatStudentProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    accountStatus: user.accountStatus,

    // Academic information
    rollNumber: user.rollNumber,
    studentYear: user.studentYear,
    branch: user.branch,
    cgpa: user.cgpa,
    graduationYear: user.graduationYear ?? null,

    // Personal profile information
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    linkedinUrl: user.linkedinUrl ?? "",
    githubUrl: user.githubUrl ?? "",
    portfolioUrl: user.portfolioUrl ?? "",

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// GET /api/student/profile
export async function getStudentProfile(req, res) {
  try {
    const user = await User.findOne({
      _id: req.user.id,
      role: "STUDENT",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatStudentProfile(user),
    });
  } catch (error) {
    console.error("Get student profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student profile.",
    });
  }
}

// PATCH /api/student/profile
export async function updateStudentProfile(req, res) {
  try {
    const result = profileUpdateSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile information.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const updates = result.data;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one profile field to update.",
      });
    }

    const user = await User.findOne({
      _id: req.user.id,
      role: "STUDENT",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    for (const [field, value] of Object.entries(updates)) {
      user[field] = value;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully.",
      data: formatStudentProfile(user),
    });
  } catch (error) {
    console.error("Update student profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update student profile.",
    });
  }
}
