
import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    hrName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    hrEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },
    hrPhone: {
      type: String,
      trim: true,
      maxlength: 25,
      default: "",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    decision: {
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      decidedAt: Date,
      note: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
    },
    campusHistory: [
      {
        visitDate: Date,
        description: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },
      },
    ],
    hiringHistory: [
      {
        year: {
          type: Number,
          min: 2000,
          max: 2100,
        },
        role: {
          type: String,
          trim: true,
          maxlength: 150,
        },
        hires: {
          type: Number,
          min: 0,
          default: 0,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

companySchema.index({ name: 1, status: 1 });
companySchema.index({ requestedBy: 1, createdAt: -1 });

const Company = mongoose.model("Company", companySchema);

export default Company;
