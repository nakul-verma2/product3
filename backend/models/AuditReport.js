/*
 * Stores metadata for generated monitoring audit reports.
 * Contains uptime statistics, incident information, MTTR, and report URL.
 * Reports are generated as PDF documents using the audit API.
 * This model allows previously generated reports to be retrieved.
 */

const mongoose = require("mongoose");

const auditReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    period: {
      type: String,
      required: true,
    },

    uptimePercent: {
      type: Number,
      default: 0,
    },

    incidents: {
      type: Number,
      default: 0,
    },

    mttrMinutes: {
      type: Number,
      default: 0,
    },

    pdfUrl: {
      type: String,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditReport", auditReportSchema);
