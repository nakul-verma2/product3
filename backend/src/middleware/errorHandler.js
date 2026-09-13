// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  if (status >= 500) console.error('[api]', err);
  res.status(status).json({ message: err.message || 'Server error.' });
}

function notFound(req, res) {
  res.status(404).json({ message: 'Route not found.' });
}

module.exports = { errorHandler, notFound };
