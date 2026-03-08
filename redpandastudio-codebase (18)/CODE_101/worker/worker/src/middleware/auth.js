import { verifyAccessToken, verifyRefreshToken } from '../utils/auth.js';
import { AuthError } from '../utils/constants.js';

// Helper to try verifying a token with multiple secrets
async function tryVerifyAnyToken(token, env) {
    if (!token) return null;

    // 1. Try as Access Token
    try {
        return await verifyAccessToken(token, env);
    } catch (e) { /* ignore */ }

    // 2. Try as Refresh Token
    try {
        const payload = await verifyRefreshToken(token, env);
        // Refresh tokens might lack some fields, patch them
        return { ...payload, role: payload.role || 'user', email: payload.email || '' };
    } catch (e) { /* ignore */ }

    return null;
}

export async function authenticateToken(request, env) {
    // 1. Check Authorization Header (Bearer)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const user = await tryVerifyAnyToken(token, env);
        if (user) return user;
    }

    // 2. Check Cookies (Robust parsing)
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        // Look for common token cookie names
        const cookieNames = ['refresh_token', 'access_token', 'token', 'auth_token'];

        for (const name of cookieNames) {
            // Regex to find cookie value: (start or separator) name=value (end or separator)
            const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
            if (match && match[1]) {
                const token = decodeURIComponent(match[1]); // Ensure it's decoded
                const user = await tryVerifyAnyToken(token, env);
                if (user) return user;
            }
        }
    }

    throw new Error(AuthError.TOKEN_MISSING);
}

export async function getUserFromRequest(request, env) {
    try {
        const user = await authenticateToken(request, env);
        return { user, error: null };
    } catch (err) {
        return { user: null, error: err.message };
    }
}
