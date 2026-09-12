const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["up", "down"],
      default: "up",
    },

    uptimePercent: {
      type: Number,
      default: 100,
    },

    avgResponseMs: {
      type: Number,
      default: 0,
    },

    sslExpiryDate: {
      type: Date,
      default: null,
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Website", websiteSchema);
