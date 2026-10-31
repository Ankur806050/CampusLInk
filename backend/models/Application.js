
import mongoose from "mongoose";

const applicationStatuses = [
  "APPLIED",
  "SHORTLISTED",
  "REJECTED",
  "OA_SCHEDULED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "NOT_SELECTED",
  "WITHDRAWN",
];

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    status: {
      type: String,
      enum: applicationStatuses,
      default: "APPLIED",
      index: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    recruiterNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: applicationStatuses,
          required: true,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        note: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate applications to the same job.
applicationSchema.index(
  { student: 1, job: 1 },
  { unique: true }
);

// Efficient student application history.
applicationSchema.index({
  student: 1,
  appliedAt: -1,
});

// Efficient recruiter applicant lists.
applicationSchema.index({
  job: 1,
  appliedAt: -1,
});

// Efficient filtering by application status and job.
applicationSchema.index({
  job: 1,
  status: 1,
});

const Application = mongoose.model(
  "Application",
  applicationSchema
);

export default Application;
