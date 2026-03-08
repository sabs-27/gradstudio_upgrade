import { checkRateLimit } from '../utils/rateLimiter.js';
import { AuthError } from '../utils/constants.js';
import { addSecurityHeaders } from './securityHeaders.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

/**
 * Creates a rate limit middleware function
 * @param {Object} options Configuration options
 * @param {number} options.limit Max requests allowed
 * @param {number} options.window Window size in seconds
 * @param {Function} options.keyGenerator Function to generate the key from request
 * @param {boolean} [options.skipAdmin] Skip for admins (default: false)
 * @returns {Function} Middleware function
 */
export function rateLimit(options) {
    const { limit, window, keyGenerator, skipAdmin = false } = options;

    return async (request, env, context = {}) => {
        // Optional: Skip if user is admin
        if (skipAdmin && context.user?.role === 'admin') {
            return null; // Pass
        }

        const key = keyGenerator(request, context.user);
        if (!key) return null; // Should not happen, but safe fallback

        const { allowed, remaining, resetAt } = await checkRateLimit(env, key, limit, window);

        const headers = {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString()
        };

        if (!allowed) {
            // Log Rate Limit Hit
            // We interpret 'key' as likely IP or UserId.
            // context.user might be present if auth middleware ran first.
            const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
            await logSecurityEvent(env, context.ctx, 'rate_limit_hit', {
                ip,
                userId: context.user?.id,
                email: context.user?.email,
                endpoint: new URL(request.url).pathname
            });

            const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
            const res = new Response(JSON.stringify({
                success: false,
                error: {
                    code: AuthError.RATE_LIMIT_EXCEEDED,
                    message: 'Too many requests. Please try again later.',
                    retryAfter
                }
            }), {
                status: 429,
                headers: {
                    ...headers,
                    'Retry-After': retryAfter.toString(),
                    'Content-Type': 'application/json'
                }
            });
            return addSecurityHeaders(res);
        }

        // Return headers to be appended to the final response if possible.
        // In our index.js architecture, middleware usually returns a Response ONLY on error.
        // If success, we might want to attach these headers to the request object or context to be used later?
        // Since we can't easily modify the *final* response headers from here without changing the whole architecture,
        // we will accept that successful requests might not always get the headers unless we explicitly add them in index.js.
        // However, the CRITICAL part is returning the 429 response on failure.

        return null; // Pass
    };
}
