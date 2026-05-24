const jwt = require('jsonwebtoken');

function sign(payload, secret, opts = {}) {
  return jwt.sign(payload, secret, opts);
}

function verify(token, secret) {
  return jwt.verify(token, secret);
}

function verifyTokenMiddleware(req, res, next) {
  const auth = req.headers.authorization || req.query.token;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  try {
    const payload = verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { sign, verify, verifyTokenMiddleware };
