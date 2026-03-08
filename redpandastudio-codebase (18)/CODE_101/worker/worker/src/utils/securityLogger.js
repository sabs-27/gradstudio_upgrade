/**
 * Security Event Logger
 * Asynchronously logs security events to D1 without blocking the main response.
 */

export async function logSecurityEvent(env, ctx, type, data) {
    try {
        const { ip = 'unknown', userId = null, email = null, endpoint = 'unknown', ...metadata } = data;

        // Non-blocking insert using ctx.waitUntil
        const promise = env.DB.prepare(`
      INSERT INTO security_events (id, event_type, ip, user_id, email, endpoint, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
            crypto.randomUUID(),
            type,
            ip,
            userId,
            email,
            endpoint,
            JSON.stringify(metadata)
        ).run().catch(err => {
            console.error('Failed to log security event:', err);
        });

        if (ctx && ctx.waitUntil) {
            ctx.waitUntil(promise);
        } else {
            // If no ctx (e.g. testing), just start it floating
            // or await it if strict, but for logging we prefer fire-and-forget logic usually
        }
    } catch (err) {
        console.error('Error initiating security log:', err);
    }
}
