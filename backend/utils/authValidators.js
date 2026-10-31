
import { z } from "zod";

const commonFields = {
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(80, "Name cannot exceed 80 characters.")
    .regex(/^[\p{L}\p{M} .'-]+$/u, "Name contains invalid characters."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254, "Email is too long."),

  password: z
    .string()
    .min(12, "Password must contain at least 12 characters.")
    .max(72, "Password cannot exceed 72 characters.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character."),
};

const studentSchema = z.object({
  ...commonFields,

  role: z.literal("STUDENT"),

  rollNumber: z
    .string()
    .trim()
    .min(2, "Roll number is required.")
    .max(30, "Roll number is too long."),

  studentYear: z.enum(["THIRD_YEAR", "FOURTH_YEAR"], {
    error: "Student year must be THIRD_YEAR or FOURTH_YEAR.",
  }),

  branch: z
    .string()
    .trim()
    .min(2, "Branch is required.")
    .max(100, "Branch name is too long."),

  cgpa: z.number().min(0).max(10),
});

const recruiterSchema = z.object({
  ...commonFields,

  role: z.literal("RECRUITER"),

  companyName: z
    .string()
    .trim()
    .min(2, "Company name is required.")
    .max(150),

  designation: z
    .string()
    .trim()
    .min(2, "Designation is required.")
    .max(100),
});

const tpoSchema = z.object({
  ...commonFields,

  role: z.literal("TPO"),

  tpoRegistrationSecret: z
    .string()
    .min(1, "TPO invitation secret is required."),
});

export const signupSchema = z.discriminatedUnion("role", [
  studentSchema,
  recruiterSchema,
  tpoSchema,
]);

const collegeDomain = (process.env.COLLEGE_EMAIL_DOMAIN || "")
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

export function validateSignupDomain(data) {
  const domain = data.email.split("@").pop()?.toLowerCase();

  if (data.role === "STUDENT" || data.role === "TPO") {
    if (!collegeDomain) {
      return {
        valid: false,
        message: "College email domain is not configured on the server.",
      };
    }

    if (domain !== collegeDomain) {
      return {
        valid: false,
        message: "Use your official college email address.",
      };
    }
  }

  if (data.role === "RECRUITER") {
    const personalDomains = new Set([
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "proton.me",
    ]);

    if (personalDomains.has(domain)) {
      return {
        valid: false,
        message: "Use your official company email address.",
      };
    }
  }

  return { valid: true };
}
