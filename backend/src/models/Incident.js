const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  targetType: { type: String, enum: ['Website', 'BusinessApp'], default: 'Website' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  durationMinutes: { type: Number, default: null },
  status: { type: String, enum: ['ongoing', 'resolved'], default: 'ongoing', index: true },
  rootCause: { type: String, default: '' },
  resolvedAutomatically: { type: Boolean, default: true },
});

incidentSchema.index({ websiteId: 1, status: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
