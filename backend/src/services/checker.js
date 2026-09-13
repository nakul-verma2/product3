const axios = require('axios');
const net = require('net');
const { parseTarget } = require('../utils/url');

const http = axios.create({
  timeout: 10000,
  maxRedirects: 5,
  validateStatus: () => true,
  headers: { 'User-Agent': 'Pulseboard-Prober/1.0' },
});

function tcpCheck(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ...result, responseTimeMs: Date.now() - start });
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish({ isUp: true, statusCode: 200, error: '' }));
    socket.on('timeout', () => finish({ isUp: false, statusCode: 0, error: 'ETIMEDOUT' }));
    socket.on('error', (e) => finish({ isUp: false, statusCode: 0, error: e.code || e.message }));
    socket.connect(port, host);
  });
}

// Single probe: HTTP via axios, TCP for bare IP:port (CCTV/Tally).
async function probe(rawUrl, { checkMethod = 'auto' } = {}) {
  const target = parseTarget(rawUrl);
  const useTcp = checkMethod === 'tcp' || (checkMethod === 'auto' && target.kind === 'tcp');

  if (useTcp) {
    const port = Number(target.port) || 80;
    return tcpCheck(target.host, port);
  }

  const start = Date.now();
  try {
    const res = await http.get(target.url || rawUrl);
    return {
      isUp: res.status < 400,
      statusCode: res.status,
      responseTimeMs: Date.now() - start,
      error: '',
    };
  } catch (err) {
    return {
      isUp: false,
      statusCode: 0,
      responseTimeMs: Date.now() - start,
      error: err.code || err.message || 'REQUEST_FAILED',
    };
  }
}

module.exports = { probe };
