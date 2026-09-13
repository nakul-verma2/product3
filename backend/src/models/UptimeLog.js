const mongoose = require('mongoose');
const env = require('../config/env');

const uptimeLogSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  targetType: { type: String, enum: ['Website', 'BusinessApp'], default: 'Website', index: true },
  statusCode: { type: Number, default: null },
  responseTimeMs: { type: Number, default: null },
  isUp: { type: Boolean, required: true, index: true },
  error: { type: String, default: '' },
  checkedAt: { type: Date, default: Date.now },
});

// TTL: auto-delete after retention window (prevents 43k docs/site/month OOM).
uptimeLogSchema.index(
  { checkedAt: 1 },
  { expireAfterSeconds: Math.max(1, env.LOG_RETENTION_DAYS) * 24 * 3600 }
);
uptimeLogSchema.index({ websiteId: 1, checkedAt: 1 });

module.exports = mongoose.model('UptimeLog', uptimeLogSchema);
