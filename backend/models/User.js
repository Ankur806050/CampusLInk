
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Common fields for STUDENT, RECRUITER, and TPO
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["STUDENT", "RECRUITER", "TPO"],
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    accountStatus: {
      type: String,
      enum: [
        "PENDING_VERIFICATION",
        "PENDING_APPROVAL",
        "ACTIVE",
        "REJECTED",
      ],
      default: "PENDING_VERIFICATION",
    },

    // Placement eligibility lock for students
    placementLocked: {
      type: Boolean,
      default: false,
    },

    placementLockedAt: {
      type: Date,
      default: null,
    },
    applicationSubmissionVersion: {
      type: Number,
      default: 0,
    },

    // STUDENT-specific academic information
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    studentYear: {
      type: String,
      enum: ["THIRD_YEAR", "FOURTH_YEAR"],
    },

    branch: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },

    graduationYear: {
      type: Number,
      min: 2020,
      max: 2100,
    },

    // STUDENT profile information
    phone: {
      type: String,
      trim: true,
      maxlength: 25,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    githubUrl: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    // RECRUITER-specific information
    companyName: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Validate required fields based on the user's role.
userSchema.pre("validate", function () {
  if (this.role === "STUDENT") {
    if (!this.rollNumber) {
      this.invalidate("rollNumber", "Student roll number is required.");
    }

    if (!this.studentYear) {
      this.invalidate("studentYear", "Student year is required.");
    }

    if (!this.branch) {
      this.invalidate("branch", "Student branch is required.");
    }

    if (this.cgpa === undefined || this.cgpa === null) {
      this.invalidate("cgpa", "Student CGPA is required.");
    }
  }

  if (this.role === "RECRUITER") {
    if (!this.companyName) {
      this.invalidate("companyName", "Company name is required.");
    }

    if (!this.designation) {
      this.invalidate("designation", "Recruiter designation is required.");
    }
  }

  // TPO-specific fields are intentionally not public signup fields.
  // TPO access should be controlled by the registration secret
  // or a pre-provisioned/approved TPO account.
});

const User = mongoose.model("User", userSchema);

export default User;
