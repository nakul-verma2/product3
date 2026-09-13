const env = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');
const { startMonitorCron } = require('./jobs/monitorCron');

async function main() {
  await connectDb(env.MONGO_URI);
  console.log('[db] connected');
  startMonitorCron();
  console.log(`[cron] schedule ${env.CHECK_INTERVAL}`);

  const server = app.listen(env.PORT, () => console.log(`[api] listening on :${env.PORT}`));

  const shutdown = (sig) => {
    console.log(`[${sig}] shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e?.message || e));
}

main().catch((e) => {
  console.error('[fatal]', e.message);
  process.exit(1);
});
