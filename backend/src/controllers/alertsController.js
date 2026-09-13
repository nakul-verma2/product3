const AlertSettings = require('../models/AlertSettings');
const NotificationLog = require('../models/NotificationLog');
const { getSettings } = require('../services/whatsapp');

async function get(req, res, next) {
  try {
    const s = await getSettings(req.user.id);
    return res.json(s);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const allowed = ['emailEnabled', 'whatsappEnabled', 'smsEnabled', 'callEnabled', 'language', 'phones', 'cooldownMinutes', 'onlyOnStatusChange'];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.phones && !Array.isArray(patch.phones)) return res.status(400).json({ message: 'phones must be an array.' });
    if (patch.cooldownMinutes != null) patch.cooldownMinutes = Math.min(Math.max(Number(patch.cooldownMinutes) || 15, 1), 1440);
    const s = await AlertSettings.findOneAndUpdate({ userId: req.user.id }, { $set: patch }, { new: true, upsert: true });
    return res.json({ ok: true, settings: s });
  } catch (err) {
    next(err);
  }
}

async function test(req, res, next) {
  try {
    const channel = String(req.body.channel || 'whatsapp');
    if (channel === 'whatsapp') {
      // Real delivery path (bypasses toggle/cooldown gates, mocked when unconfigured).
      const { sendWhatsApp } = require('../services/whatsapp');
      const r = await sendWhatsApp({
        userId: req.user.id,
        websiteId: null,
        message: 'Test WhatsApp alert from Pulseboard. Monitoring alerts are working.',
        force: true,
      });
      if (!r.ok && !r.mocked) {
        return res.status(502).json({ message: `WhatsApp send failed: ${r.error || r.reason || 'provider error'}` });
      }
      return res.json({ ok: true, mocked: !!r.mocked });
    }
    await NotificationLog.create({ userId: req.user.id, channel, message: `Test ${channel} alert`, status: 'sent' });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const logs = await NotificationLog.find({ userId: req.user.id }).sort({ sentAt: -1 }).limit(100).lean();
    return res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function whatsappIngress(req, res, next) {
  // Internal sender used by cron-era PDF spec: POST /api/alert/whatsapp { websiteId, message }
  try {
    const { sendWhatsApp } = require('../services/whatsapp');
    const { websiteId, message } = req.body;
    if (!websiteId || !message) return res.status(400).json({ message: 'websiteId and message are required.' });
    const r = await sendWhatsApp({ userId: req.user.id, websiteId, message: String(message).slice(0, 1000) });
    return res.json({ ok: r.ok, ...r });
  } catch (err) {
    next(err);
  }
}

module.exports = { get, update, test, history, whatsappIngress };
