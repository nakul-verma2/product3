const mongoose = require('mongoose');

const alertSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    emailEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    callEnabled: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    phones: { type: [String], default: [] },
    cooldownMinutes: { type: Number, default: 15, min: 1, max: 1440 },
    onlyOnStatusChange: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlertSettings', alertSettingsSchema);
