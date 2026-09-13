const axios = require('axios');
const env = require('../config/env');
const AlertSettings = require('../models/AlertSettings');
const NotificationLog = require('../models/NotificationLog');

async function getSettings(userId) {
  let s = await AlertSettings.findOne({ userId });
  if (!s) s = await AlertSettings.create({ userId });
  return s;
}

// Cooldown guard: skip repeat alerts for the same target inside the window.
async function shouldSend(userId, websiteId, cooldownMinutes) {
  const since = new Date(Date.now() - cooldownMinutes * 60000);
  const recent = await NotificationLog.findOne({
    userId,
    websiteId,
    status: 'sent',
    sentAt: { $gte: since },
  }).lean();
  return !recent;
}

async function sendWhatsApp({ userId, websiteId, message, force = false }) {
  const settings = await getSettings(userId);
  if (!settings.whatsappEnabled && !force) {
    await NotificationLog.create({ userId, websiteId, channel: 'whatsapp', message, status: 'skipped', error: 'disabled' });
    return { ok: false, skipped: true, reason: 'whatsapp disabled' };
  }
  // Manual tests (force) bypass the spam gates; cron outage alerts never do.
  const allowed = force ? true : await shouldSend(userId, websiteId, settings.cooldownMinutes);
  if (!allowed) {
    await NotificationLog.create({ userId, websiteId, channel: 'whatsapp', message, status: 'skipped', error: 'cooldown' });
    return { ok: false, skipped: true, reason: 'cooldown' };
  }
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !settings.phones?.length) {
    // No credentials/phones in dev -> record as sent so cron is observable without Meta.
    await NotificationLog.create({ userId, websiteId, channel: 'whatsapp', message, status: 'sent', error: 'no-provider-configured' });
    return { ok: true, mocked: true };
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: settings.phones[0],
        type: 'text',
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` }, timeout: 10000 }
    );
    await NotificationLog.create({ userId, websiteId, channel: 'whatsapp', message, status: 'sent' });
    return { ok: true };
  } catch (err) {
    await NotificationLog.create({
      userId,
      websiteId,
      channel: 'whatsapp',
      message,
      status: 'failed',
      error: err.response?.data ? JSON.stringify(err.response.data).slice(0, 500) : String(err.message).slice(0, 500),
    });
    return { ok: false, error: err.message };
  }
}

module.exports = { getSettings, shouldSend, sendWhatsApp };
