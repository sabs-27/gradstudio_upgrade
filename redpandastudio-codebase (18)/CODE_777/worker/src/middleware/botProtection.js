import { logSecurityEvent } from '../utils/securityLogger.js';

/**
 * Bot Protection & Anti-Scraping Middleware
 */

export async function checkBotProtection(request, env) {
    const userAgent = request.headers.get('User-Agent') || '';
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // 1. Check User-Agent
    const lowerUA = userAgent.toLowerCase();
    const suspiciousAgents = ['curl', 'wget', 'python-requests', 'scrapy', 'bot', 'crawler', 'spider'];

    // We strictly block only if confirmed bad pattern for API
    if ((!userAgent || suspiciousAgents.some(agent => lowerUA.includes(agent))) && !userAgent.includes('SecurityAudit')) {
        // Allow our audit script if it sets a specific UA or Header (e.g. User-Agent: SecurityAudit)
        // But initially we didn't set that. 
        // Let's just log and block for now. The audit script might fail, which is correct behavior for a bot check!
        // User can disable bot protection or whitelist the script UA.

        await logSecurityEvent(env, null, 'bot_blocked', { ip, user_agent: userAgent, reason: 'suspicious_ua' });
        return new Response('Access Denied (Security)', { status: 403 });
    }

    // 2. Browser Fingerprinting (Missing Headers) - Skip for now to avoid false positives

    // 3. Cloudflare Bot Score
    const botScore = request?.cf?.botManagement?.score;
    if (botScore !== undefined && botScore < 30) {
        await logSecurityEvent(env, null, 'bot_blocked', { ip, user_agent: userAgent, reason: 'low_bot_score', score: botScore });
        return new Response('Access Denied (Security)', { status: 403 });
    }

    // 4. Honeypot check calls this strictly? 
    // No, honeypot is separate.

    return null; // Pass
}

export async function checkHoneypot(request, env) {
    const url = new URL(request.url);

    // Define trap routes
    const traps = ['/api/internal/config', '/api/.env', '/api/admin.php'];

    if (traps.includes(url.pathname)) {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        console.warn(`HONEYPOT TRIGGERED by IP: ${ip} on ${url.pathname}`);

        // Ban IP in KV for 24 hours
        // Key: "ban:ip_address"
        await env.KV.put(`ban:${ip}`, 'reason:honeypot', { expirationTtl: 86400 });

        await logSecurityEvent(env, null, 'honeypot_trigger', { ip, endpoint: url.pathname });

        return new Response('Access Denied', { status: 403 });
    }

    // Check if IP is already banned
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const isBanned = await env.KV.get(`ban:${ip}`);
    if (isBanned) {
        // We could log every hit from banned IP, but that's noisy. 
        // Maybe log 'ip_blocked' event occasionally?
        return new Response('Access Denied', { status: 403 });
    }

    return null;
}
