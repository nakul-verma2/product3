const Website = require('../models/Website');
const UptimeLog = require('../models/UptimeLog');
const Incident = require('../models/Incident');
const { normalizeUrl, assertPublicHost } = require('../utils/url');
const { probe } = require('../services/checker');

async function add(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Name is required.' });
    const url = normalizeUrl(req.body.url);
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ message: 'That URL does not look valid.' });
    }
    if (!/^https?:$/.test(parsed.protocol)) return res.status(400).json({ message: 'Only http(s) URLs are supported.' });
    await assertPublicHost(parsed.hostname);

    const dup = await Website.findOne({ userId: req.user.id, url });
    if (dup) return res.status(409).json({ message: 'That website is already monitored.' });

    const site = await Website.create({ userId: req.user.id, name: name.slice(0, 120), url });

    // Immediate first check so dashboard is not empty.
    probe(url).then(async (r) => {
      await UptimeLog.create({ websiteId: site._id, targetType: 'Website', statusCode: r.statusCode, responseTimeMs: r.responseTimeMs, isUp: r.isUp, error: r.error || '' });
      await Website.updateOne({ _id: site._id }, { $set: { status: r.isUp ? 'up' : 'down', avgResponseMs: r.responseTimeMs, lastCheckedAt: new Date(), consecutiveFailures: r.isUp ? 0 : 1 } });
    }).catch(() => {});

    return res.status(201).json(site);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That website is already monitored.' });
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const sites = await Website.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    // Frontend asArray() accepts a raw array — return it directly (matches demo shape).
    return res.json(sites);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const site = await Website.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!site) return res.status(404).json({ message: 'Website not found.' });
    return res.json(site);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const site = await Website.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!site) return res.status(404).json({ message: 'Website not found.' });
    await Promise.all([
      UptimeLog.deleteMany({ websiteId: site._id }),
      Incident.deleteMany({ websiteId: site._id }),
    ]);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function pause(req, res, next) {
  try {
    const { isPaused } = req.body;
    const site = await Website.findOne({ _id: req.params.id, userId: req.user.id });
    if (!site) return res.status(404).json({ message: 'Website not found.' });
    site.isPaused = !!isPaused;
    site.status = site.isPaused ? 'paused' : site.status === 'paused' ? 'up' : site.status;
    await site.save();
    return res.json(site);
  } catch (err) {
    next(err);
  }
}

async function logs(req, res, next) {
  try {
    const site = await Website.findOne({ _id: req.params.id, userId: req.user.id }).select('_id').lean();
    if (!site) return res.status(404).json({ message: 'Website not found.' });
    const days = Math.min(Math.max(parseInt(req.query.days || '7', 10) || 7, 1), 90);
    const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10) || 100, 1), 500);
    const since = new Date(Date.now() - days * 24 * 3600000);
    const docs = await UptimeLog.find({ websiteId: site._id, checkedAt: { $gte: since } })
      .sort({ checkedAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res.json(docs);
  } catch (err) {
    next(err);
  }
}

module.exports = { add, list, getOne, remove, pause, logs };
