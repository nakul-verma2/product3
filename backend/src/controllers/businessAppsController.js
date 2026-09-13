const BusinessApp = require('../models/BusinessApp');
const UptimeLog = require('../models/UptimeLog');
const Incident = require('../models/Incident');
const { parseTarget } = require('../utils/url');
const { probe } = require('../services/checker');

const TYPES = ['website', 'tally', 'erp', 'cctv', 'payment_gateway'];

async function add(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const type = String(req.body.type || 'website').toLowerCase();
    let url = String(req.body.url || '').trim();
    if (!name || !url) return res.status(400).json({ message: 'Name and URL are required.' });
    if (!TYPES.includes(type)) return res.status(400).json({ message: 'Invalid type.' });
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      // Allow bare host:port for CCTV/Tally; normalize http check otherwise.
      url = url.includes('://') ? url : `http://${url}`;
    }
    const target = parseTarget(url);
    if (!target.host) return res.status(400).json({ message: 'Invalid URL.' });
    const checkMethod = target.kind === 'tcp' ? 'tcp' : 'http';
    const app = await BusinessApp.create({ userId: req.user.id, name: name.slice(0, 120), url, type, checkMethod });
    probe(url, { checkMethod }).then(async (r) => {
      await UptimeLog.create({ websiteId: app._id, targetType: 'BusinessApp', statusCode: r.statusCode, responseTimeMs: r.responseTimeMs, isUp: r.isUp, error: r.error || '' });
      await BusinessApp.updateOne({ _id: app._id }, { $set: { status: r.isUp ? 'up' : 'down', lastChecked: new Date(), avgResponseMs: r.responseTimeMs } });
    }).catch(() => {});
    return res.status(201).json(app);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const apps = await BusinessApp.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(apps);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const app = await BusinessApp.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!app) return res.status(404).json({ message: 'Business app not found.' });
    await Promise.all([
      UptimeLog.deleteMany({ websiteId: app._id }),
      Incident.deleteMany({ websiteId: app._id }),
    ]);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { add, list, remove };
