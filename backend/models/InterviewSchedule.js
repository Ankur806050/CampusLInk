
import mongoose from "mongoose";

const interviewScheduleSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roundType: {
      type: String,
      enum: ["ONLINE_ASSESSMENT", "TECHNICAL_INTERVIEW", "HR_INTERVIEW", "OTHER"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 480,
    },
    mode: {
      type: String,
      enum: ["ONLINE", "IN_PERSON"],
      required: true,
    },
    locationOrLink: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"],
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

// Enforce the location/link requirement at the model layer as well as
// in the controller, so invalid schedules cannot be saved accidentally.
interviewScheduleSchema.pre("validate", function () {
  if (
    (this.mode === "ONLINE" || this.mode === "IN_PERSON") &&
    !this.locationOrLink?.trim()
  ) {
    this.invalidate(
      "locationOrLink",
      this.mode === "ONLINE"
        ? "An online meeting link is required."
        : "A physical location is required."
    );
  }
});

interviewScheduleSchema.index({ application: 1, scheduledAt: 1 });
interviewScheduleSchema.index({ status: 1, scheduledAt: 1 });

const InterviewSchedule = mongoose.model(
  "InterviewSchedule",
  interviewScheduleSchema
);

export default InterviewSchedule;
