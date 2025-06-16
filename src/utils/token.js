import jwt from 'jsonwebtoken';

export function signTempToken(uid) {
    // valid for 15 minutes, scopes limited
    return jwt.sign({ uid, scope: ['send-verification','verify-email'] },
        process.env.JWT_SECRET,
        { expiresIn: '15m' });
}

export function signAuthToken(uid) {
    // valid for 7 days, full scope
    return jwt.sign({ uid, scope: ['*'] },
        process.env.JWT_SECRET,
        { expiresIn: '7d' });
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
