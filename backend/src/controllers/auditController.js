const path = require('path');
const Website = require('../models/Website');
const BusinessApp = require('../models/BusinessApp');
const UptimeLog = require('../models/UptimeLog');
const Incident = require('../models/Incident');
const AuditReport = require('../models/AuditReport');
const { generateAuditPdf } = require('../services/pdfReport');

const PERIOD_DAYS = { '1month': 30, '3months': 90, '6months': 180, '12months': 365 };

async function generate(req, res, next) {
  try {
    const period = String(req.query.period || '12months');
    if (!PERIOD_DAYS[period]) return res.status(400).json({ message: 'Invalid period. Use 1month|3months|6months|12months.' });
    const days = PERIOD_DAYS[period];
    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - days * 24 * 3600000);

    const [sites, apps] = await Promise.all([
      Website.find({ userId: req.user.id }).lean(),
      BusinessApp.find({ userId: req.user.id }).lean(),
    ]);
    const targets = [...sites.map((s) => ({ ...s, kind: 'Website' })), ...apps.map((a) => ({ ...a, kind: 'BusinessApp' }))];
    const ids = targets.map((t) => t._id);

    const [logs, incidents] = await Promise.all([
      ids.length
        ? UptimeLog.find({ websiteId: { $in: ids }, checkedAt: { $gte: periodStart } })
          .select('websiteId isUp responseTimeMs')
          .limit(100000)
          .lean()
        : [],
      ids.length ? Incident.find({ websiteId: { $in: ids }, startedAt: { $gte: periodStart } }).sort({ startedAt: -1 }).limit(500).lean() : [],
    ]);

    const byId = new Map();
    logs.forEach((l) => {
      const k = String(l.websiteId);
      if (!byId.has(k)) byId.set(k, { total: 0, up: 0, ms: [] });
      const b = byId.get(k);
      b.total += 1;
      if (l.isUp) b.up += 1;
      if (typeof l.responseTimeMs === 'number') b.ms.push(l.responseTimeMs);
    });

    const breakdown = targets.map((t) => {
      const b = byId.get(String(t._id)) || { total: 0, up: 0, ms: [] };
      return {
        name: t.name, url: t.url, type: t.type || 'website',
        total: b.total, up: b.up,
        uptimePercent: b.total ? (b.up / b.total) * 100 : 100,
        avgMs: b.ms.length ? Math.round(b.ms.reduce((a, x) => a + x, 0) / b.ms.length) : null,
      };
    });

    const totalChecks = logs.length;
    const upChecks = logs.filter((l) => l.isUp).length;
    const uptimePercent = totalChecks ? (upChecks / totalChecks) * 100 : 100;
    const resolved = incidents.filter((i) => i.status === 'resolved' && i.durationMinutes != null);
    const mttrMinutes = resolved.length ? Math.round(resolved.reduce((a, i) => a + i.durationMinutes, 0) / resolved.length) : 0;

    const fileName = `${req.user.id}-${Date.now()}.pdf`;
    const destPath = path.join(__dirname, '..', '..', 'public', 'reports', fileName);
    await generateAuditPdf({
      destPath,
      userEmail: req.user.email,
      period,
      stats: { uptimePercent, totalChecks, upChecks, incidents: incidents.length, mttrMinutes },
      breakdown,
      incidents: incidents.map((i) => ({ ...i, targetName: targets.find((t) => String(t._id) === String(i.websiteId))?.name })),
    });

    const report = await AuditReport.create({
      userId: req.user.id, period, periodStart, periodEnd,
      uptimePercent, incidents: incidents.length, mttrMinutes,
      totalChecks, upChecks, breakdownBySite: breakdown,
      pdfUrl: `/reports/${fileName}`,
    });
    return res.json({ report });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const reports = await AuditReport.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json(reports);
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, list };
