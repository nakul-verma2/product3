const mongoose = require("mongoose");

const alertSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    whatsappEnabled: {
      type: Boolean,
      default: false,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    alertOnDown: {
      type: Boolean,
      default: true,
    },

    alertOnRecovery: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AlertSettings", alertSettingsSchema);