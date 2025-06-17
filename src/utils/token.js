import jwt from 'jsonwebtoken';

export function signTempToken(uid) {
  
    return jwt.sign({ uid, scope: ['send-verification','verify-email'] },
        process.env.JWT_SECRET,
        { expiresIn: '15m' });
}

export function signAuthToken(uid) {

    return jwt.sign({ uid, scope: ['*'] },
        process.env.JWT_SECRET,
        { expiresIn: '7d' });
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
