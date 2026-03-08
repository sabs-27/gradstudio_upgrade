import { SignJWT, jwtVerify } from 'jose';
import { AuthError } from './constants.js';

const ACCESS_EXPIRY = '7d';
const REFRESH_EXPIRY = '7d';

export async function generateTokens(user, env) {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

    const jti = crypto.randomUUID();

    const accessToken = await new SignJWT({
        userId: user.id,
        email: user.email,
        role: user.role || 'user'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_EXPIRY)
        .sign(secret);

    const refreshToken = await new SignJWT({
        userId: user.id,
        jti: jti
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_EXPIRY)
        .sign(refreshSecret);

    return { accessToken, refreshToken, jti };
}

export async function verifyAccessToken(token, env) {
    try {
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') throw new Error(AuthError.TOKEN_EXPIRED);
        throw new Error(AuthError.TOKEN_INVALID);
    }
}

export async function verifyRefreshToken(token, env) {
    try {
        const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') throw new Error(AuthError.REFRESH_TOKEN_EXPIRED);
        throw new Error(AuthError.REFRESH_TOKEN_INVALID);
    }
}

export function createRefreshCookie(token) {
    // 7 days in seconds
    const maxAge = 7 * 24 * 60 * 60;
    return `refresh_token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

export function clearRefreshCookie() {
    return `refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
