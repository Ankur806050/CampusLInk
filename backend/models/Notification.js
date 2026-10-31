
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "APPLICATION_UPDATE",
        "SCHEDULE_UPDATE",
        "PLACEMENT_RESULT",
        "OFFER_UPDATE",
        "JOB_UPDATE",
        "COMPANY_UPDATE",
        "SYSTEM",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    relatedEntityType: {
      type: String,
      enum: ["JOB", "APPLICATION", "SCHEDULE", "COMPANY", "OFFER"],
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
