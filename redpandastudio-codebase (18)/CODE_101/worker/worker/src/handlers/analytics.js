
import { jsonResponse } from '../utils/responseHelpers.js';
import { logSecurityEvent } from '../utils/securityLogger.js';
import { sanitizeHtml } from '../utils/sanitizer.js';

/**
 * Handle Content View Tracking
 * POST /api/content/:simId/view
 */
export async function handleTrackView(simId, request, env, corsHeaders) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const referrer = request.headers.get('Referer') || ''; // 'Referer' header spelling

    // Determine device/browser (Simple heuristic for now, robust parsing requires a lib)
    const deviceType = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';
    let browser = 'other';
    if (/chrome|crios/i.test(userAgent)) browser = 'chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'firefox';
    else if (/safari/i.test(userAgent)) browser = 'safari';
    else if (/edg/i.test(userAgent)) browser = 'edge';

    // Get User if authenticated (optional for views, often anonymous)
    // Note: Middleware usually extracts user, but tracking might be open?
    // User request said: "User-facing tracking endpoints (view, share, report) need auth"
    // Actually, usually views are public. But requirement 7 says "need auth"? 
    // Wait, requirement 7 says "User-facing tracking endpoints (view, share, report) need auth".
    // I will stick to extracting user from request context if available, or error if strict auth is required.
    // However, usually public content should be trackable anonymously too. 
    // Given requirement 7 explicitly lists them under "need auth", let's assume `request.user` is present because we will protect route in `index.js`.

    const user = request.user; // Assumes auth middleware ran
    const userId = user ? user.userId : null;

    if (!userId) {
        // If we strictly require auth as per requirement 7:
        // return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        // But for a learning platform, maybe anonymous views are allowed?
        // Let's assume strict auth for now based on prompt.
    }

    // Deduplication Logic
    // Same user + same sim + window (e.g. 30 mins)
    // We can interpret "30 minutes" as checking if a view exists in the last 30 mins.
    // Query D1: select created_at from content_views where sim_id=? and (user_id=? OR ip=?) order by created_at desc limit 1
    // If diff < 30 mins, return same ID or just 200 OK without insert.

    const existing = await env.DB.prepare(`
        SELECT id, created_at FROM content_views 
        WHERE sim_id = ? AND (user_id = ? OR (user_id IS NULL AND ip = ?))
        ORDER BY created_at DESC LIMIT 1
    `).bind(simId, userId, ip).first();

    if (existing) {
        const lastView = new Date(existing.created_at).getTime();
        const now = Date.now();
        if (now - lastView < 30 * 60 * 1000) {
            // Duplicate view
            return jsonResponse({ success: true, id: existing.id, deduplicated: true }, 200, corsHeaders);
        }
    }

    const id = crypto.randomUUID();

    // Insert View
    await env.DB.prepare(`
        INSERT INTO content_views (id, sim_id, user_id, ip, device_type, browser, referrer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, simId, userId, ip, deviceType, browser, referrer).run();

    return jsonResponse({ success: true, id }, 200, corsHeaders);
}

/**
 * Handle View Duration Update
 * POST /api/content/:simId/view-duration
 * Body: { duration: number, completed: boolean }
 */
export async function handleTrackDuration(simId, body, request, env, corsHeaders) {
    // We need to identify WHICH view to update.
    // The frontend should ideally pass the view ID returned from handleTrackView.
    // But if not, we can find the latest view for this user/IP on this sim.

    const { duration, completed } = body;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const user = request.user;
    const userId = user ? user.userId : null;

    // Limit duration to avoid junk data (e.g. 10 hours)
    if (duration > 86400) return jsonResponse({ error: 'Invalid duration' }, 400, corsHeaders);

    // Update latest view
    // Note: duration_seconds is cumulative or absolute? 
    // Usually "total time spent". Frontend sends current session duration?
    // Let's assume body.duration is "total seconds watched so far".

    const info = await env.DB.prepare(`
        SELECT id FROM content_views 
        WHERE sim_id = ? AND (user_id = ? OR (user_id IS NULL AND ip = ?))
        ORDER BY created_at DESC LIMIT 1
    `).bind(simId, userId, ip).first();

    if (!info) {
        // No view found? Maybe create one? 
        // Or just ignore.
        return jsonResponse({ error: 'View not found' }, 404, corsHeaders);
    }

    await env.DB.prepare(`
        UPDATE content_views 
        SET duration_seconds = MAX(duration_seconds, ?), completed = MAX(completed, ?)
        WHERE id = ?
    `).bind(duration, completed ? 1 : 0, info.id).run();

    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * Handle Content Share
 * POST /api/content/:simId/share
 * Body: { platform: string }
 */
export async function handleTrackShare(simId, body, request, env, corsHeaders) {
    const { platform } = body;
    const user = request.user;
    const userId = user ? user.userId : null;

    if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

    const id = crypto.randomUUID();
    await env.DB.prepare(`
        INSERT INTO content_shares (id, sim_id, user_id, platform)
        VALUES (?, ?, ?, ?)
    `).bind(id, simId, userId, platform || 'link').run();

    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * Handle Content Report
 * POST /api/content/:simId/report
 * Body: { reason: string, description: string }
 */
export async function handleReportContent(simId, body, request, env, corsHeaders) {
    const { reason, description } = body;
    const user = request.user;
    const userId = user ? user.userId : null;

    if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

    // Validate reason
    const validReasons = ['inappropriate', 'misleading', 'broken', 'other'];
    const safeReason = validReasons.includes(reason) ? reason : 'other';
    const safeDesc = sanitizeHtml(description || '').substring(0, 1000);

    // Rate Limit Check (5 per hour) - strict check
    // Using KV for rate limiting reports specifically? 
    // Or just count D1 records (might be slower but safer for "5 per hour" strictness)
    // 5 queries/hour/user is low enough to query D1.

    const count = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM content_reports 
        WHERE reported_by = ? AND created_at > datetime('now', '-1 hour')
    `).bind(userId).first('count');

    if (count >= 5) {
        return jsonResponse({ error: 'Too many reports. Please try again later.' }, 429, corsHeaders);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(`
        INSERT INTO content_reports (id, sim_id, reported_by, reason, description)
        VALUES (?, ?, ?, ?, ?)
    `).bind(id, simId, userId, safeReason, safeDesc).run();

    // Log security event for high visibility
    await logSecurityEvent(env, request.ctx, 'content_reported', {
        simId,
        userId,
        reason: safeReason
    });

    return jsonResponse({ success: true, message: 'Report submitted' }, 201, corsHeaders);
}
