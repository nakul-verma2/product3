/*
 * Defines the database schema for monitored business applications.
 * Supports services such as ERP, Tally, CCTV, and payment gateways.
 * Stores application details, monitoring status, and last check time.
 * The monitoring engine updates this information automatically.
 */

const mongoose = require("mongoose");

const businessAppSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["website", "tally", "erp", "cctv", "payment_gateway"],
      required: true,
    },

    status: {
      type: String,
      enum: ["up", "down"],
      default: "up",
    },

    lastChecked: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("BusinessApp", businessAppSchema);
