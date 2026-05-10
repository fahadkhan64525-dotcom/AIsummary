import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const summarySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    sourceText: {
      type: String,
      required: true
    },
    source: {
      type: Schema.Types.Mixed,
      required: true
    },
    summary: {
      type: Schema.Types.Mixed,
      required: true
    },
    keywords: {
      type: [String],
      default: []
    },
    language: {
      type: String,
      required: true
    },
    length: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const SummaryModel = models.Summary ?? model("Summary", summarySchema);
