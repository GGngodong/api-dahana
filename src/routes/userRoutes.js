import { Router } from 'express';
import { body } from 'express-validator';
import * as UC from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Register
router.post(
    '/',
    [
        body('username').isString().isLength({ max:100 }),
        body('email').isEmail().isLength({ max:50 }),
        body('password').isLength({ min:8, max:100 }),
        body('division').isString().isLength({ max:50 }),
    ],
    UC.register
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail(),
        body('password').exists(),
    ],
    UC.login
);

// Protected: send verification & check status
router.post('/send-email-verification', authenticate(['send-verification']), UC.sendEmailVerification);
router.get('/verify-email', UC.verifyEmail);
router.get('/check-email-verified', authenticate(['verify-email']), UC.checkEmailVerified);

export default router;
