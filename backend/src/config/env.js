require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[env] Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: required('MONGO_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || '',
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID || '',
  CHECK_INTERVAL: process.env.CHECK_INTERVAL || '* * * * *',
  LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),
  isProd: process.env.NODE_ENV === 'production',
};

module.exports = env;
