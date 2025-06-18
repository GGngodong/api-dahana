
// controllers/userController.js
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const firebaseAuth = require("../config/firebase");
const { User } = require("../models");
const { sendMail } = require('../services/emailService');

console.log(
  "controllers/userController.js: User object after import from models/index:",
  typeof User,
  User
);
// Helpers
function collectErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((err) => err.msg);
    res.status(400).json({ status: "error", errors: msgs });
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
    await firebaseAuth
      .getUserByEmail(email)
      .then(() => Promise.reject(new Error("This email is already registered")))
      .catch((err) => {
        if (err.code !== "auth/user-not-found") throw err;
      });

    const fbUser = await firebaseAuth.createUser({
      email,
      password,
      displayName: username,
    });

    // Create local user
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      password: hash,
      division,
    });

    const token = jwt.sign(
      { userId: user.id, firebaseUid: fbUser.uid },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      status: "success",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        division: user.division,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    const msg = err.message || "Registration failed.";
    return res.status(400).json({ status: "error", errors: [msg] });
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
      return res
        .status(401)
        .json({ status: "error", errors: ["Email is not registered"] });
    }

    // 2) Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ status: "error", errors: ["Password is incorrect"] });
    }

    // 3) Check emailVerified in Firebase
    const fbUser = await firebaseAuth.getUserByEmail(email);
    if (!fbUser.emailVerified) {
      return res.status(403).json({
        status: "error",
        errors: [
          "Email not verified. Please check your inbox and verify before logging in.",
        ],
      });
    }

    // 4) Issue our JWT
    const token = jwt.sign(
      { userId: user.id, firebaseUid: fbUser.uid },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      status: "success",
      message: "Login successful.",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        division: user.division,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error("login:", err);
    return res.status(500).json({ status: "error", errors: ["Login failed."] });
  }
};

// GET /api/users/current
exports.getCurrent = (req, res) => {
  const u = req.user;
  res.json({
    status: "success",
    data: {
      id: u.id,
      username: u.username,
      email: u.email,
      division: u.division,
      role: u.role,
    },
  });
};

// DELETE /api/users/logout
exports.logout = async (req, res) => {
  req.user.deviceToken = null;
  await req.user.save();
  res.json({ status: "success", message: "Logged out successfully." });
};

// PATCH /api/users/current
exports.update = async (req, res) => {
  if (!collectErrors(req, res)) return;

  const { username, password } = req.body;
  if (username) req.user.username = username;
  if (password) req.user.password = await bcrypt.hash(password, 12);
  await req.user.save();

  res.json({
    status: "success",
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      division: req.user.division,
      role: req.user.role,
    },
  });
};

// PATCH /api/users/update-token
exports.updateDeviceToken = async (req, res) => {
  if (!collectErrors(req, res)) return;

  req.user.deviceToken = req.body.device_token;
  await req.user.save();
  res.json({
    status: "success",
    message: "Device token updated successfully.",
  });
};

exports.sendPasswordResetEmail = async (req, res) => {
  if (!collectErrors(req, res)) return;

  try {
    // 1) generate Firebase reset link
    const link = await firebaseAuth.generatePasswordResetLink(req.body.email);

    // 2) send via Nodemailer
    await sendMail({
      to: req.body.email,
      subject: 'Reset Your Password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${link}">Reset my password</a>
        <p>If you didn’t ask for this, you can ignore this email securely.</p>
      `
    });

    return res.json({
      status: 'success',
      message: 'Password reset email sent successfully.'
    });
  } catch (err) {
    console.error('sendPasswordResetEmail:', err);
    return res.status(400).json({
      status: 'error',
      errors: ['Failed to send password reset email.']
    });
  }
};

// POST /api/users/send-email-verification
exports.sendEmailVerification = async (req, res) => {
  try {
    // 1) generate Firebase link
    const link = await firebaseAuth.generateEmailVerificationLink(req.user.email);

    // 2) send via Nodemailer
    await sendMail({
      to: req.user.email,
      subject: 'Verify Your Email Address',
      html: `
        <p>Hi ${req.user.username},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${link}">Verify my email</a>
        <p>If you didn’t request this, please ignore.</p>
      `
    });

    return res.json({
      status: 'success',
      message: 'Email verification link sent successfully.'
    });
  } catch (err) {
    console.error('sendEmailVerification:', err);
    return res.status(400).json({
      status: 'error',
      errors: ['Failed to send email verification link.']
    });
  }
};
// GET /api/users/check-email-verified
exports.checkEmailVerified = async (req, res) => {
  try {
    const fbUser = await firebaseAuth.getUserByEmail(req.user.email);
    if (fbUser.emailVerified) {
      res.json({ status: "success", message: "Email is verified." });
    } else {
      res
        .status(400)
        .json({ status: "error", errors: ["Email is not verified."] });
    }
  } catch (err) {
    console.error("checkEmailVerified:", err);
    res
      .status(400)
      .json({
        status: "error",
        errors: ["Failed to check verification status."],
      });
  }
};
