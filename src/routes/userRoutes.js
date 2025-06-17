const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const { User } = require('../models');
const router = express.Router();
console.log('routes/userRoutes.js: User object after import from models/index:', typeof User, User); // <--- ADD THIS

// Registration
router.post(
  '/users',
  [
    body('username')
      .exists().withMessage('Username is required')
      .bail()
      .isString().withMessage('Username must be text')
      .bail()
      .isLength({ max: 100 }).withMessage('Username can be at most 100 characters'),

    body('email')
      .exists().withMessage('Email is required')
      .bail()
      .isEmail().withMessage('You must provide a valid email address')
      .bail()
      .isLength({ max: 50 }).withMessage('Email can be at most 50 characters')
      .bail()
      .custom(async (email) => {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
          throw new Error('This email is already registered');
        }
        return true;
      }),

    body('password')
      .exists().withMessage('Password is required')
      .bail()
      .isString().withMessage('Password must be text')
      .bail()
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .bail()
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .bail()
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .bail()
      .matches(/[0-9]/).withMessage('Password must contain at least one digit')
      .bail()
      .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character'),

    body('division')
      .exists().withMessage('Division is required')
      .bail()
      .isString().withMessage('Division must be text')
      .bail()
      .isLength({ max: 50 }).withMessage('Division can be at most 50 characters'),
  ],
  ctrl.register
);

// Login
router.post(
  '/users/login',
  [
    body('email')
      .exists().withMessage('Email is required')
      .bail()
      .isEmail().withMessage('Email must be valid'),

    body('password')
      .exists().withMessage('Password is required')
      .bail()
      .isString().withMessage('Password must be text'),
  ],
  ctrl.login
);

// Password Reset
router.post(
  '/users/forgot-password',
  [ body('email').isEmail().withMessage('Email must be valid') ],
  ctrl.sendPasswordResetEmail
);

// Authenticated routes below
router.use(auth);

// Email verification routes
router.get('/users/check-email-verified', ctrl.checkEmailVerified);
router.post('/users/send-email-verification', ctrl.sendEmailVerification);

// Current user routes
router.get('/users/current', ctrl.getCurrent);

router.patch(
  '/users/current',
  [
    body('username').optional().isString().isLength({ max: 100 }),
    body('password').optional().isString().isLength({ min: 8, max: 100 }),
  ],
  ctrl.update
);

// Device token update
router.patch(
  '/users/update-token',
  [ body('device_token').isString().withMessage('Device token must be a string') ],
  ctrl.updateDeviceToken
);

// Logout
router.delete('/users/logout', ctrl.logout);

module.exports = router;
