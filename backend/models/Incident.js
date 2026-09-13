/*
 * Stores downtime incidents detected by the monitoring system.
 * Records when an incident started, ended, and how long it lasted.
 * Incidents can remain ongoing until the service becomes available again.
 * Root-cause information can also be associated with an incident.
 */

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
