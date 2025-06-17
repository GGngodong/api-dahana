// middleware/auth.js
const jwt = require('jsonwebtoken');
const firebaseAuth = require('../config/firebase');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const auth = req.header('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ errors: ['Unauthorized.'] });
  }
  const token = auth.replace('Bearer ', '');

  try {
    // Verify our own API JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Optionally verify Firebase idToken:
    await firebaseAuth.verifyIdToken(payload.firebaseIdToken);

    const user = await User.findByPk(payload.userId);
    if (!user) throw new Error();

    req.user = user;
    next();
  } catch {
    res.status(401).json({ errors: ['Invalid or expired token.'] });
  }
};
