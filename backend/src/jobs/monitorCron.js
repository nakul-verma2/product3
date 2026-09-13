const cron = require('node-cron');
const env = require('../config/env');
const Website = require('../models/Website');
const BusinessApp = require('../models/BusinessApp');
const UptimeLog = require('../models/UptimeLog');
const Incident = require('../models/Incident');
const { probe } = require('../services/checker');
const { diagnose } = require('../services/rootCause');
const { sendWhatsApp } = require('../services/whatsapp');

const state = { lastRun: null, running: false, lastResult: null };

// Tiny concurrency limiter (avoids an ESM-only p-limit dependency in CJS).
function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || !queue.length) return;
    active += 1;
    const { fn, resolve } = queue.shift();
    Promise.resolve()
      .then(fn)
      .then(resolve, resolve)
      .finally(() => {
        active -= 1;
        next();
      });
  };
  return (fn) => new Promise((resolve) => {
    queue.push({ fn, resolve });
    next();
  });
}
const limit = createLimiter(10);

async function checkTarget(doc, targetType) {
  const Model = targetType === 'Website' ? Website : BusinessApp;
  const idField = targetType === 'Website' ? 'lastCheckedAt' : 'lastChecked';
  try {
    const result = await probe(doc.url, { checkMethod: doc.checkMethod || 'auto' });
    const { rootCause } = diagnose({ ...result });

    await UptimeLog.create({
      websiteId: doc._id,
      targetType,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      isUp: result.isUp,
      error: rootCause === 'Healthy' ? '' : `${rootCause} ${result.error || ''}`.trim().slice(0, 500),
    });

    const prevStatus = doc.status;
    const failures = result.isUp ? 0 : (doc.consecutiveFailures || 0) + 1;
    // Flap guard: require 2 consecutive failures before marking down.
    const nextStatus = doc.isPaused ? 'paused' : result.isUp ? 'up' : failures >= 2 ? 'down' : prevStatus;

    const update = {
      [idField]: new Date(),
      consecutiveFailures: failures,
      avgResponseMs:
        result.responseTimeMs != null
          ? Math.round(((doc.avgResponseMs || result.responseTimeMs) * 4 + result.responseTimeMs) / 5)
          : doc.avgResponseMs,
    };
    if (nextStatus !== prevStatus) {
      update.status = nextStatus;
      update.lastStatusChangeAt = new Date();
    }
    await Model.updateOne({ _id: doc._id }, { $set: update });

    // Transition-only incidents + alerts (never on every tick).
    if (prevStatus !== 'down' && nextStatus === 'down') {
      await Incident.create({ websiteId: doc._id, targetType, status: 'ongoing', rootCause });
      await sendWhatsApp({ userId: doc.userId, websiteId: doc._id, message: `DOWN: ${doc.name} (${doc.url}) — ${rootCause}` }).catch(() => {});
    } else if (prevStatus === 'down' && nextStatus === 'up') {
      const ongoing = await Incident.findOne({ websiteId: doc._id, status: 'ongoing' }).sort({ startedAt: -1 });
      if (ongoing) {
        const mins = Math.max(1, Math.round((Date.now() - ongoing.startedAt.getTime()) / 60000));
        ongoing.status = 'resolved';
        ongoing.endedAt = new Date();
        ongoing.durationMinutes = mins;
        ongoing.resolvedAutomatically = true;
        await ongoing.save();
      }
      await sendWhatsApp({ userId: doc.userId, websiteId: doc._id, message: `RECOVERED: ${doc.name} is back up.` }).catch(() => {});
    }
    return { id: String(doc._id), up: result.isUp };
  } catch (err) {
    console.error('[cron] target failed', doc._id, err.message);
    return { id: String(doc._id), error: err.message };
  }
}

async function runOnce() {
  if (state.running) return { skipped: true };
  state.running = true;
  try {
    const [sites, apps] = await Promise.all([
      Website.find({ isPaused: false }).limit(500).lean(),
      BusinessApp.find({ isPaused: false }).limit(500).lean(),
    ]);
    const tasks = [
      ...sites.map((s) => limit(() => checkTarget(s, 'Website'))),
      ...apps.map((a) => limit(() => checkTarget(a, 'BusinessApp'))),
    ];
    const results = await Promise.all(tasks);
    state.lastRun = new Date();
    state.lastResult = { checked: results.length, at: state.lastRun };
    return state.lastResult;
  } finally {
    state.running = false;
  }
}

function startMonitorCron() {
  cron.schedule(env.CHECK_INTERVAL, () => {
    runOnce().catch((e) => console.error('[cron]', e.message));
  });
  return { runOnce, state };
}

module.exports = { startMonitorCron, runOnce, cronState: state };
