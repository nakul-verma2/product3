const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationMinutes: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["ongoing", "resolved"],
      default: "ongoing",
    },

    rootCause: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Incident", incidentSchema);