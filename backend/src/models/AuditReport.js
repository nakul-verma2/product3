const mongoose = require('mongoose');

const auditReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  period: { type: String, enum: ['1month', '3months', '6months', '12months'], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  uptimePercent: { type: Number, default: 100 },
  incidents: { type: Number, default: 0 },
  mttrMinutes: { type: Number, default: 0 },
  totalChecks: { type: Number, default: 0 },
  upChecks: { type: Number, default: 0 },
  breakdownBySite: { type: Array, default: [] },
  pdfUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('AuditReport', auditReportSchema);
