
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 10000,
    },
    jobType: {
      type: String,
      enum: ["INTERNSHIP", "FULL_TIME"],
      required: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "Not specified",
    },
    workMode: {
      type: String,
      enum: ["ONSITE", "HYBRID", "REMOTE"],
      default: "ONSITE",
    },
    compensation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    eligibleBranches: {
      type: [String],
      default: [],
    },
    minimumCgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    eligibleGraduationYears: {
      type: [Number],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING_APPROVAL",
        "PUBLISHED",
        "REJECTED",
        "CLOSED",
      ],
      default: "PENDING_APPROVAL",
      index: true,
    },
    tpoDecision: {
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      decidedAt: Date,
      note: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

jobSchema.index({ status: 1, applicationDeadline: 1 });
jobSchema.index({ recruiter: 1, createdAt: -1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
