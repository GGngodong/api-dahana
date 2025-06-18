// middleware/auth.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errors: ['Unauthorized.'] });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    // 1) Verify our own JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 2) Load the user
    const user = await User.findByPk(payload.userId);
    if (!user) throw new Error('User not found');

    // 3) Attach and continue
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ errors: ['Invalid or expired token.'] });
  }
};
