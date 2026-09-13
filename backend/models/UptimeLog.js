/*
 * Stores individual results generated during website monitoring.
 * Records status code, response time, availability, and check time.
 * These logs provide the historical monitoring data for each website.
 * They are also used to calculate uptime and performance statistics.
 */

const mongoose = require("mongoose");

const uptimeLogSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },

    statusCode: {
      type: Number,
      default: null,
    },

    responseTimeMs: {
      type: Number,
      default: null,
    },

    isUp: {
      type: Boolean,
      required: true,
    },

    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("UptimeLog", uptimeLogSchema);
