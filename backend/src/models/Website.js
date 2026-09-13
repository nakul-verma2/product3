const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true },
    status: { type: String, enum: ['up', 'down', 'paused'], default: 'up', index: true },
    isPaused: { type: Boolean, default: false, index: true },
    uptimePercent: { type: Number, default: 100 },
    avgResponseMs: { type: Number, default: null },
    sslExpiryDate: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
    lastStatusChangeAt: { type: Date, default: null },
    consecutiveFailures: { type: Number, default: 0 },
    checkIntervalSec: { type: Number, default: 60 },
  },
  { timestamps: true }
);

websiteSchema.index({ userId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('Website', websiteSchema);
