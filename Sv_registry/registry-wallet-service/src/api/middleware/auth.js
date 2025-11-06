// Placeholder middleware for internal auth of mintInternal endpoint.
// Replace with real verification (mutual TLS, signed JWT, mTLS client cert, etc.) in production.

module.exports = function requireInternalAuth(req, res, next) {
  // Example: expect a pre-shared header INTERNAL_AUTH_TOKEN for internal calls
  const token = req.headers['x-internal-auth'];
  if (!token || token !== process.env.INTERNAL_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};
