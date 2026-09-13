const dns = require('dns').promises;
const net = require('net');

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const PRIVATE_RE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)/;

function normalizeUrl(input) {
  let v = String(input || '').trim();
  if (!v) return '';
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = `https://${v}`;
  // Strip trailing slash for dedupe consistency
  if (v.length > 1) v = v.replace(/\/+$/, '');
  return v;
}

function parseTarget(input) {
  // Accepts http(s) URL or bare host:port (CCTV/Tally). Returns { kind, url, host, port }.
  const raw = String(input || '').trim();
  if (/^https?:\/\//i.test(raw)) {
    const u = new URL(raw);
    return { kind: 'http', url: u.toString().replace(/\/+$/, ''), host: u.hostname, port: u.port || null };
  }
  // bare "192.168.1.20:8080" or "host:554/path"
  const withProto = `http://${raw}`;
  try {
    const u = new URL(withProto);
    return { kind: 'tcp', url: raw, host: u.hostname, port: u.port ? Number(u.port) : 80 };
  } catch {
    return { kind: 'unknown', url: raw, host: raw, port: null };
  }
}

async function assertPublicHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (LOOPBACK.has(host)) throw Object.assign(new Error('Localhost URLs cannot be monitored.'), { statusCode: 400 });
  if (net.isIP(host)) {
    if (PRIVATE_RE.test(host) || host.startsWith('169.254.')) {
      throw Object.assign(new Error('Private-network IPs cannot be monitored from the cloud prober.'), { statusCode: 400 });
    }
    return;
  }
  let addrs = [];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw Object.assign(new Error('DNS lookup failed for that host.'), { statusCode: 400 });
  }
  if (addrs.some((a) => PRIVATE_RE.test(a.address) || LOOPBACK.has(a.address))) {
    throw Object.assign(new Error('That host resolves to a private address.'), { statusCode: 400 });
  }
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`.slice(0, 80);
  } catch {
    return String(url || '').slice(0, 80);
  }
}

module.exports = { normalizeUrl, parseTarget, assertPublicHost, maskUrl };
