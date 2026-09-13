const mongoose = require('mongoose');
const Website = require('../models/Website');
const BusinessApp = require('../models/BusinessApp');
const UptimeLog = require('../models/UptimeLog');
const { maskUrl } = require('../utils/url');

async function publicStatus(req, res, next) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: 'Status page not found.' });
    const [sites, apps] = await Promise.all([
      Website.find({ userId }).select('name url status uptimePercent avgResponseMs').lean(),
      BusinessApp.find({ userId }).select('name url status type').lean(),
    ]);
    if (!sites.length && !apps.length) return res.status(404).json({ message: 'Status page not found.' });

    // 30-segment bar: last 30 checks per service (up/down/no-data).
    const services = [];
    for (const s of [...sites, ...apps]) {
      const logs = await UptimeLog.find({ websiteId: s._id }).sort({ checkedAt: -1 }).limit(30).select('isUp').lean();
      const segments = logs.length ? logs.reverse().map((l) => (l.isUp ? 'up' : 'down')) : Array(30).fill('nodata');
      while (segments.length < 30) segments.unshift('nodata');
      services.push({
        _id: s._id,
        name: s.name,
        url: maskUrl(s.url),
        status: s.status || 'up',
        uptimePercent: s.uptimePercent ?? 100,
        avgResponseMs: s.avgResponseMs ?? null,
        segments,
      });
    }
    const down = services.filter((s) => s.status === 'down').length;
    res.set('Cache-Control', 'public, max-age=60');
    return res.json({ userId, overall: down > 0 ? 'degraded' : 'operational', services });
  } catch (err) {
    next(err);
  }
}

module.exports = { publicStatus };
