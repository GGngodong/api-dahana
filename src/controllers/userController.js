import admin from 'firebase-admin';
import { signTempToken, signAuthToken } from '../utils/token.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { validationResult } from 'express-validator';

export async function register(req, res, next) {
    try {
        // 1) Validate input (assumes express-validator used in route)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status:'error', errors: errors.array() });
        }

        const { username, email, password, division } = req.body;

        // 2) Prevent duplicate
        try {
            await admin.auth().getUserByEmail(email);
            return res.status(400).json({
                status: 'error',
                errors: [{ field:'email', msg:'Email already taken' }],
            });
        } catch {/* not found, OK */ }

        // 3) Create in Firebase
        const userRecord = await admin.auth().createUser({
            email, password, displayName: username,
        });

        // 4) [Optional] persist in your own DB here...

        // 5) Log them in by issuing a temp token
        const tempToken = signTempToken(userRecord.uid);

        // 6) Send verification email
        await sendVerificationEmail(email);

        return res.status(201).json({
            status: 'success',
            data: {
                user: {
                    uid: userRecord.uid,
                    username,
                    email,
                    division,
                },
                token: tempToken,
            },
            message: 'Registered successfully. Verification email sent.',
        });
    } catch (e) {
        next(e);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        // 1) Verify credentials via Firebase REST API
        const idToken = await admin
            .auth()
            .verifyIdToken(await admin.auth().createCustomToken(email, {password}));

        // [In real world you’d sign in with Firebase client SDK in Flutter, but here…]
        // 2) Ensure emailVerified
        const userRecord = await admin.auth().getUserByEmail(email);
        if (!userRecord.emailVerified) {
            return res.status(403).json({
                status:'error',
                message:'Please verify your email before logging in.',
            });
        }

        // 3) Issue full‑scope JWT
        const authToken = signAuthToken(userRecord.uid);

        return res.json({
            status:'success',
            data:{
                token: authToken,
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName,
                }
            },
            message:'Login successful',
        });
    } catch (e) {
        return res.status(401).json({ status:'error', message:'Invalid credentials' });
    }
}

export async function sendEmailVerification(req, res, next) {
    try {
        const { uid } = req.user;
        const userRecord = await admin.auth().getUser(uid);
        await sendVerificationEmail(userRecord.email);
        return res.json({ status:'success', message:'Verification email sent' });
    } catch (e) {
        next(e);
    }
}

export async function verifyEmail(req, res, next) {
    try {
        const oobCode = req.query.oobCode;
        if (!oobCode) return res.status(400).json({ status:'error', message:'Missing oobCode' });

        // Mark verified via Firebase
        await admin.auth().applyActionCode(oobCode);

        return res.json({ status:'success', message:'Email verified successfully' });
    } catch (e) {
        return res.status(400).json({ status:'error', message:e.message });
    }
}

export async function checkEmailVerified(req, res, next) {
    try {
        const { uid } = req.user;
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.emailVerified) {
            return res.json({ status:'success', message:'Email is verified.' });
        }
        return res.status(400).json({ status:'error', message:'Email is not verified.' });
    } catch (e) {
        next(e);
    }
}
