const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { cronState } = require('./jobs/monitorCron');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.FRONTEND_URL.split(',').map((s) => s.trim()), credentials: false }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));

// Static audit PDFs
app.use('/reports', express.static(path.join(__dirname, '..', 'public', 'reports')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? 'up' : 'down',
    uptimeSec: Math.round(process.uptime()),
    cronLastRun: cronState.lastRun,
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/websites', require('./routes/websites'));
app.use('/api', require('./routes/dashboard')); // /dashboard/summary + /incidents
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/alert/whatsapp', require('./routes/alertWhatsapp')); // legacy singular path from PDF
app.use('/api/ai', require('./routes/ai'));
app.use('/api/status', require('./routes/status'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
