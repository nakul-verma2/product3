const Website = require('../models/Website');
const BusinessApp = require('../models/BusinessApp');
const Incident = require('../models/Incident');

async function summary(req, res, next) {
  try {
    const [sites, apps] = await Promise.all([
      Website.find({ userId: req.user.id }).select('status').lean(),
      BusinessApp.find({ userId: req.user.id }).select('_id').lean(),
    ]);
    const ids = [...sites, ...apps].map((d) => d._id);
    const recentCount = ids.length
      ? await Incident.countDocuments({ websiteId: { $in: ids }, status: 'ongoing' })
      : 0;
    const up = sites.filter((s) => s.status === 'up').length;
    const down = sites.filter((s) => s.status === 'down').length;
    return res.json({ total: sites.length, up, down, businessApps: apps.length, recentIncidents: recentCount });
  } catch (err) {
    next(err);
  }
}

async function incidents(req, res, next) {
  try {
    const filter = { status: { $in: ['ongoing', 'resolved'] } };
    if (req.query.websiteId) {
      // Verify ownership for website targets.
      const site = await Website.findOne({ _id: req.query.websiteId, userId: req.user.id }).select('_id').lean();
      const app = site ? null : await BusinessApp.findOne({ _id: req.query.websiteId, userId: req.user.id }).select('_id').lean();
      if (!site && !app) return res.status(404).json({ message: 'Target not found.' });
      filter.websiteId = req.query.websiteId;
    } else {
      const [sites, apps] = await Promise.all([
        Website.find({ userId: req.user.id }).select('_id').lean(),
        BusinessApp.find({ userId: req.user.id }).select('_id').lean(),
      ]);
      filter.websiteId = { $in: [...sites, ...apps].map((d) => d._id) };
    }
    const list = await Incident.find(filter).sort({ startedAt: -1 }).limit(100).lean();
    return res.json(list);
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, incidents };
