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
