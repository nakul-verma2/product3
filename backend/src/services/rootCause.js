// Pure function: shared by HTTP route and cron. No I/O.
function diagnose({ statusCode = null, error = '', responseTimeMs = null, isUp = true } = {}) {
  const err = String(error || '').toUpperCase();

  if (err.includes('ENOTFOUND') || err.includes('EAI_AGAIN') || statusCode === 0 || statusCode === null) {
    if (!isUp) return { rootCause: 'DNS / Server Down', actionHint: 'Check DNS records and that the server is running.' };
  }
  if (err.includes('CERT') || err.includes('SSL') || err.includes('UNABLE_TO_VERIFY')) {
    return { rootCause: 'SSL Expired / Invalid', actionHint: 'Renew the TLS certificate and check the chain.' };
  }
  if (err.includes('ECONNABORTED') || err.includes('TIMEOUT') || err.includes('ETIMEDOUT')) {
    return { rootCause: 'Server Slow / Timeout', actionHint: 'Origin took >10s. Check load, DB, and upstream.' };
  }
  if (err.includes('ECONNREFUSED') || err.includes('ENETUNREACH') || err.includes('EHOSTUNREACH')) {
    return { rootCause: 'Connection Refused / Host Unreachable', actionHint: 'Port closed or firewall blocking. Verify service is listening.' };
  }
  if (statusCode >= 500) return { rootCause: 'Server Error', actionHint: `Upstream returned ${statusCode}. Check app logs.` };
  if (statusCode === 404) return { rootCause: 'Page Missing', actionHint: 'Path returns 404. Target is up but page is gone.' };
  if (statusCode === 403 || statusCode === 401) return { rootCause: 'Blocked / WAF', actionHint: 'Request blocked (WAF/auth). Allowlist the prober IP.' };
  if (statusCode === 429) return { rootCause: 'Rate Limited', actionHint: 'Target is throttling the prober. Slow the check interval.' };
  if (typeof responseTimeMs === 'number' && responseTimeMs > 3000 && isUp) {
    return { rootCause: 'Degraded Performance', actionHint: 'Responding but slow (>3s). Investigate DB/cold start.' };
  }
  if (!isUp) return { rootCause: 'Unknown Down', actionHint: 'Check server, DNS, and TLS.' };
  return { rootCause: 'Healthy', actionHint: 'No action needed.' };
}

module.exports = { diagnose };
