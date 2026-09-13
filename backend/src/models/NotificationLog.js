const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, index: true },
  channel: { type: String, enum: ['whatsapp', 'email', 'sms', 'call'], required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
  error: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now },
});

notificationLogSchema.index({ userId: 1, sentAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
