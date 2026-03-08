/**
 * Rate Limiter Utility using Cloudflare KV
 */

/**
 * Check if a request should be rate limited
 * @param {Object} env - Worker environment bindings
 * @param {string} key - Unique identifier for the requester (e.g., IP or UserID)
 * @param {number} limit - Maximum requests allowed in the window
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
export async function checkRateLimit(env, key, limit, windowSeconds) {
    // EMERGENCY: Disable rate limiting to save KV writes (Quota Exceeded)
    return { allowed: true, remaining: limit, resetAt: Date.now() + (windowSeconds * 1000) };

    if (!env.RATE_LIMITS) {
        console.warn('RATE_LIMITS KV not bound. Skipping rate limit check.');
        return { allowed: true, remaining: limit, resetAt: Date.now() + (windowSeconds * 1000) };
    }

    // Use fixed windows (buckets) based on current time
    // This is an approximation but sufficient for high-scale/low-cost
    const now = Date.now();
    const bucket = Math.floor(now / (windowSeconds * 1000));
    const kvKey = `ratelimit:${key}:${bucket}`;

    // Increment counter for this bucket
    let count = 0;
    try {
        // If key doesn't exist, this returns 1. If it exists, increments and returns new value.
        // KV atomic operations aren't fully supported in all environments, but we can use metadata/read-modify-write as backup
        // For simple rate limiting, we can try to read and put, accepting race conditions as "good enough" for soft limits.
        // OR we can use the "text" value as the counter.

        // Efficient strategy for Workers KV (no atomic increment):
        // Just read. If null, put 1. If exists, parse and increment.
        // Race condition: Multiple requests might see same count and increment to same value.
        // Result: Under-counting. This is acceptable for DDoS protection (soft limits).

        const currentVal = await env.RATE_LIMITS.get(kvKey);
        count = currentVal ? parseInt(currentVal) + 1 : 1;

        // Write back with expiration
        // We only write if we are under the limit or just crossed it (to save writes? no, we need to track count)
        // To save writes, maybe we only update every X requests? No, let's keep it simple first.
        // Optimization: Use expirationTtl logic
        await env.RATE_LIMITS.put(kvKey, count.toString(), { expirationTtl: windowSeconds * 2 }); // Keep a bit longer for safety

    } catch (e) {
        console.error('Rate limit KV error:', e);
        return { allowed: true, remaining: 1, resetAt: now + 1000 };
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = (bucket + 1) * windowSeconds * 1000;

    return { allowed, remaining, resetAt };
}

/**
 * Track failed login attempts and check for account lockouts
 * @param {Object} env - Worker environment
 * @param {string} ip - Client IP
 * @param {string} email - Target email
 * @returns {Promise<{allowed: boolean, error?: string, remainingAttempts?: number}>}
 */
export async function trackFailedLogin(env, ip, email) {
    // DEV MODE: Always allow
    return { allowed: true };
}

/**
 * Record a failed login attempt
 * @param {Object} env 
 * @param {string} ip 
 * @param {string} email 
 */
export async function recordLoginFailure(env, ip, email) {
    // DEV MODE: Disabled
    return;
}

/**
 * Reset failed login counters on success
 * @param {Object} env 
 * @param {string} ip 
 * @param {string} email 
 */
export async function resetLoginFailures(env, ip, email) {
    if (!env.RATE_LIMITS) return;
    // We only reset the email lock because IP might be attacking multiple accounts
    // Actually, if a legitimate user logs in, we should assume this IP is maybe okay now for THIS email.
    // Standard practice: Reset account lock count on success.
    await env.RATE_LIMITS.delete(`failed_login:email:${email}`);

    // Optionally decrement IP count or leave it?
    // Let's leave IP count to catch distributed attacks or password spraying.
}
