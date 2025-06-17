// controllers/userController.js
const { validationResult } = require('express-validator');
const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const firebaseAuth      = require('../config/firebase');
const { User } = require('../models');
console.log('controllers/userController.js: User object after import from models/index:', typeof User, User); // <--- ADD THIS
// Helpers
function collectErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map(err => err.msg);
    res.status(400).json({ status: 'error', errors: msgs });
    return false;
  }
  return true;
}

// POST /api/users
exports.register = async (req, res) => {
  if (!collectErrors(req, res)) return;

  const { username, email, password, division } = req.body;
  try {
    // Create in Firebase
    await firebaseAuth.getUserByEmail(email)
      .then(() => Promise.reject(new Error('This email is already registered')))
      .catch(err => {
        if (err.code !== 'auth/user-not-found') throw err;
      });

    const fbUser = await firebaseAuth.createUser({ email, password, displayName: username });

    // Create local user
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hash, division });

    return res.status(201).json({
      status: 'success',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        division: user.division,
        role: user.role
      }
    });
  } catch (err) {
    const msg = err.message || 'Registration failed.';
    return res.status(400).json({ status: 'error', errors: [msg] });
  }
};

// POST /api/users/login
exports.login = async (req, res) => {
  if (!collectErrors(req, res)) return;

  const { email, password } = req.body;
  try {
    // 1) Find local user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ status: 'error', errors: ['Email is not registered'] });
    }

    // 2) Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ status: 'error', errors: ['Password is incorrect'] });
    }

    // 3) Verify Firebase credentials
    const signIn = await firebaseAuth.getUserByEmail(email); 
    // (we assume client handled sending a valid FB token; otherwise createCustomToken…)
    
    // 4) Issue our JWT
    const token = jwt.sign(
      { userId: user.id, firebaseUid: signIn.uid },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      status:  'success',
      message: 'Login successful.',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        division: user.division,
        role: user.role,
        token
      }
    });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ status: 'error', errors: ['Login failed.'] });
  }
};

// GET /api/users/current
exports.getCurrent = (req, res) => {
  const u = req.user;
  res.json({
    status: 'success',
    data: {
      id: u.id,
      username: u.username,
      email: u.email,
      division: u.division,
      role: u.role
    }
  });
};

// DELETE /api/users/logout
exports.logout = async (req, res) => {
  req.user.deviceToken = null;
  await req.user.save();
  res.json({ status: 'success', message: 'Logged out successfully.' });
};

// PATCH /api/users/current
exports.update = async (req, res) => {
  if (!collectErrors(req, res)) return;

  const { username, password } = req.body;
  if (username) req.user.username = username;
  if (password) req.user.password = await bcrypt.hash(password, 12);
  await req.user.save();

  res.json({
    status: 'success',
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      division: req.user.division,
      role: req.user.role
    }
  });
};

// PATCH /api/users/update-token
exports.updateDeviceToken = async (req, res) => {
  if (!collectErrors(req, res)) return;

  req.user.deviceToken = req.body.device_token;
  await req.user.save();
  res.json({ status: 'success', message: 'Device token updated successfully.' });
};

// POST /api/users/forgot-password
exports.sendPasswordResetEmail = async (req, res) => {
  if (!collectErrors(req, res)) return;

  try {
    const link = await firebaseAuth.generatePasswordResetLink(req.body.email);
    // ... send via your emailService ...
    res.json({ status: 'success', message: 'Password reset email sent successfully.' });
  } catch (err) {
    console.error('sendPasswordResetEmail:', err);
    res.status(400).json({ status: 'error', errors: ['Failed to send password reset email.'] });
  }
};

// POST /api/users/send-email-verification
exports.sendEmailVerification = async (req, res) => {
  try {
    const link = await firebaseAuth.generateEmailVerificationLink(req.user.email);
    // ... send via your emailService ...
    res.json({ status: 'success', message: 'Email verification link sent successfully.' });
  } catch (err) {
    console.error('sendEmailVerification:', err);
    res.status(400).json({ status: 'error', errors: ['Failed to send email verification link.'] });
  }
};

// GET /api/users/check-email-verified
exports.checkEmailVerified = async (req, res) => {
  try {
    const fbUser = await firebaseAuth.getUserByEmail(req.user.email);
    if (fbUser.emailVerified) {
      res.json({ status: 'success', message: 'Email is verified.' });
    } else {
      res.status(400).json({ status: 'error', errors: ['Email is not verified.'] });
    }
  } catch (err) {
    console.error('checkEmailVerified:', err);
    res.status(400).json({ status: 'error', errors: ['Failed to check verification status.'] });
  }
};
