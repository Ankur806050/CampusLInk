
import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    otpHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);

export default EmailOtp;
