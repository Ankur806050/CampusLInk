
import mongoose from "mongoose";

const placementOfferSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    result: {
      type: String,
      enum: ["SELECTED", "NOT_SELECTED"],
      required: true,
    },
    offeredCompensation: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
      maxlength: 3,
    },
    offerDetails: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    offerStatus: {
      type: String,
      enum: ["NOT_APPLICABLE", "PENDING_RESPONSE", "ACCEPTED", "DECLINED", "WITHDRAWN"],
      default: "NOT_APPLICABLE",
    },
    announcedAt: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        action: {
          type: String,
          enum: [
            "RESULT_ANNOUNCED",
            "OFFER_ACCEPTED",
            "OFFER_DECLINED",
            "OFFER_WITHDRAWN",
            "RESULT_CORRECTED",
          ],
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
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

// Keep result, compensation, and offer-response status consistent.
placementOfferSchema.pre("validate", function () {
  if (this.result === "SELECTED") {
    if (
      this.offeredCompensation === undefined ||
      this.offeredCompensation === null ||
      !Number.isFinite(this.offeredCompensation) ||
      this.offeredCompensation < 0
    ) {
      this.invalidate(
        "offeredCompensation",
        "A selected result requires a valid offered compensation amount."
      );
    }

    if (
      !["PENDING_RESPONSE", "ACCEPTED", "DECLINED", "WITHDRAWN"].includes(
        this.offerStatus
      )
    ) {
      this.invalidate(
        "offerStatus",
        "A selected result must have a valid offer status."
      );
    }
  }

  if (this.result === "NOT_SELECTED") {
    if (
      this.offeredCompensation !== undefined &&
      this.offeredCompensation !== null
    ) {
      this.invalidate(
        "offeredCompensation",
        "A not-selected result cannot include offered compensation."
      );
    }

    if (this.offerStatus !== "NOT_APPLICABLE") {
      this.invalidate(
        "offerStatus",
        "A not-selected result must use NOT_APPLICABLE offer status."
      );
    }
  }
});

placementOfferSchema.index({ student: 1, announcedAt: -1 });

const PlacementOffer = mongoose.model("PlacementOffer", placementOfferSchema);

export default PlacementOffer;
