const mongoose = require('mongoose');

const businessAppSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['website', 'tally', 'erp', 'cctv', 'payment_gateway'],
      default: 'website',
    },
    status: { type: String, enum: ['up', 'down', 'paused'], default: 'up', index: true },
    isPaused: { type: Boolean, default: false },
    lastChecked: { type: Date, default: null },
    avgResponseMs: { type: Number, default: null },
    consecutiveFailures: { type: Number, default: 0 },
    checkMethod: { type: String, enum: ['http', 'tcp', 'ping'], default: 'http' },
  },
  { timestamps: true }
);

businessAppSchema.index({ userId: 1, url: 1 });

module.exports = mongoose.model('BusinessApp', businessAppSchema);
