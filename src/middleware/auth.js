import { verifyToken } from '../utils/token.js';

export function authenticate(requiredScopes = ['*']) {
    return (req, res, next) => {
        const auth = req.header('Authorization')?.split(' ')[1];
        if (!auth) return res.status(401).json({ status:'error', message:'Missing token' });

        try {
            const payload = verifyToken(auth);
            // Check scopes
            if (!payload.scope.includes('*') &&
                !requiredScopes.some(s => payload.scope.includes(s))) {
                return res.status(403).json({ status:'error', message:'Insufficient scope' });
            }
            req.user = { uid: payload.uid };
            next();
        } catch (e) {
            return res.status(401).json({ status:'error', message:'Invalid or expired token' });
        }
    };
}
