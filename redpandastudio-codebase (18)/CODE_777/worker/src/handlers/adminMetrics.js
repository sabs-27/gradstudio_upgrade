/**
 * Admin Security Metrics Handlers
 */
import { jsonResponse } from '../utils/responseHelpers.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

// GET /api/admin/metrics/overview
export async function handleGetMetricsOverview(request, env, corsHeaders) {
    // ... (existing code, keeping it for context, but I should use replace or append if possible. 
    // Since I'm overwriting, I must include EVERYTHING. I'll copy the previous content + add new handlers to avoid partial file.)

    // RE-WRITING FULL FILE TO INCLUDE MISSING HANDLERS

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [
        totalUsers,
        activeSessions,
        rateLimitHits,
        blockedIPs,
        failedLogins,
        accountLocks,
        botBlocks,
        honeypotTriggers,
        fileUploads
    ] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first(),
        env.DB.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM security_events WHERE event_type = 'login_success' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM security_events WHERE event_type = 'rate_limit_hit' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM security_events WHERE event_type = 'ip_blocked' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM security_events WHERE event_type = 'login_fail' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM security_events WHERE event_type = 'account_locked' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM security_events WHERE event_type = 'bot_blocked' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM security_events WHERE event_type = 'honeypot_trigger' AND created_at > ?`).bind(todayIso).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM file_audit_log WHERE action = 'UPLOAD' AND timestamp > ?`).bind(new Date(Date.now() - 86400000).toISOString()).first()
    ]);

    return jsonResponse({
        totalUsers: totalUsers?.count || 0,
        activeSessionsCount: activeSessions?.count || 0,
        rateLimitHitsToday: rateLimitHits?.count || 0,
        blockedIPsCount: blockedIPs?.count || 0,
        failedLoginsToday: failedLogins?.count || 0,
        accountLocksToday: accountLocks?.count || 0,
        botBlocksToday: botBlocks?.count || 0,
        honeypotTriggersToday: honeypotTriggers?.count || 0,
        fileUploadsToday: fileUploads?.count || 0
    }, 200, corsHeaders);
}

// GET /api/admin/metrics/auth
export async function handleGetMetricsAuth(request, env, corsHeaders) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // Recent Failed Logins
    const { results: failedLogins } = await env.DB.prepare(`
    SELECT email, ip, count(*) as attempts, MAX(created_at) as lastAttempt
    FROM security_events 
    WHERE event_type = 'login_fail' AND created_at > ?
    GROUP BY email, ip
    ORDER BY lastAttempt DESC
    LIMIT 20
  `).bind(weekAgo).all();

    // Locked Accounts
    const { results: lockedAccounts } = await env.DB.prepare(`
    SELECT email, MAX(created_at) as lockedAt, metadata
    FROM security_events 
    WHERE event_type = 'account_locked' AND created_at > ?
    GROUP BY email
    ORDER BY lockedAt DESC
  `).bind(weekAgo).all();

    return jsonResponse({
        failedLogins,
        lockedAccounts: lockedAccounts.map(l => ({
            email: l.email,
            lockedAt: l.lockedAt,
            reason: JSON.parse(l.metadata || '{}').reason
        }))
    }, 200, corsHeaders);
}

// GET /api/admin/metrics/threats
export async function handleGetMetricsThreats(request, env, corsHeaders) {
    const { results: recentThreats } = await env.DB.prepare(`
    SELECT event_type, ip, endpoint, metadata, created_at
    FROM security_events 
    WHERE event_type IN ('rate_limit_hit', 'bot_blocked', 'honeypot_trigger')
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

    return jsonResponse({
        recentThreats: recentThreats.map(t => ({
            ...t,
            metadata: JSON.parse(t.metadata || '{}')
        }))
    }, 200, corsHeaders);
}

// GET /api/admin/metrics/content
export async function handleGetMetricsContent(request, env, corsHeaders) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
        totalSimulations,
        uploadsToday,
        uploadsThisWeek,
        recentAuditLog
    ] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM simulations WHERE is_deleted = 0').first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM file_audit_log WHERE action = 'UPLOAD' AND timestamp > ?`).bind(new Date().toISOString().split('T')[0]).first(), // Today
        env.DB.prepare(`SELECT COUNT(*) as count FROM file_audit_log WHERE action = 'UPLOAD' AND timestamp > ?`).bind(weekAgo).first(),
        env.DB.prepare(`SELECT action, file_name, user_id, timestamp, details FROM file_audit_log ORDER BY timestamp DESC LIMIT 20`).all()
    ]);

    // Blocked uploads from security events
    const { results: blockedUploads } = await env.DB.prepare(`
       SELECT endpoint, metadata, created_at, user_id 
       FROM security_events 
       WHERE event_type = 'unsafe_upload' 
       ORDER BY created_at DESC LIMIT 10
    `).all();

    return jsonResponse({
        totalSimulations: totalSimulations?.count || 0,
        uploadsToday: uploadsToday?.count || 0,
        uploadsThisWeek: uploadsThisWeek?.count || 0,
        recentAuditLog: recentAuditLog.results,
        blockedUploads: blockedUploads.map(b => ({
            filename: JSON.parse(b.metadata || '{}').filename,
            reason: JSON.parse(b.metadata || '{}').reason,
            uploadedBy: b.user_id,
            timestamp: b.created_at
        }))
    }, 200, corsHeaders);
}

// GET /api/admin/metrics/users
export async function handleGetMetricsUsers(request, env, corsHeaders) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
        totalUsers,
        admins,
        registeredToday,
        registeredThisWeek
    ] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = \'admin\' AND is_active = 1').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE created_at > ?').bind(new Date().toISOString().split('T')[0]).first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE created_at > ?').bind(weekAgo).first()
    ]);

    return jsonResponse({
        totalUsers: totalUsers?.count || 0,
        admins: admins?.count || 0,
        regularUsers: (totalUsers?.count || 0) - (admins?.count || 0),
        registeredToday: registeredToday?.count || 0,
        registeredThisWeek: registeredThisWeek?.count || 0
    }, 200, corsHeaders);
}

// POST /api/admin/metrics/unblock-ip
export async function handleUnblockIp(data, env, ctx, corsHeaders) {
    const { ip } = data;
    if (!ip) return jsonResponse({ error: 'IP required' }, 400, corsHeaders);

    await env.KV.delete(`ban:${ip}`);
    await logSecurityEvent(env, ctx, 'admin_action', { action: 'unblock_ip', target_ip: ip });

    return jsonResponse({ success: true, message: `Unblocked ${ip}` }, 200, corsHeaders);
}

// POST /api/admin/metrics/unlock-account
export async function handleUnlockAccount(data, env, ctx, corsHeaders) {
    const { email } = data;
    if (!email) return jsonResponse({ error: 'Email required' }, 400, corsHeaders);

    await env.KV.delete(`login_failures:${email}`);
    await env.KV.delete(`account_locked:${email}`);

    await logSecurityEvent(env, ctx, 'admin_action', { action: 'unlock_account', target_email: email });

    return jsonResponse({ success: true, message: `Unlocked ${email}` }, 200, corsHeaders);
}

// POST /api/admin/metrics/setup (Migration)
export async function handleSetupSecurityTable(env, corsHeaders) {
    try {
        await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS security_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        ip TEXT,
        user_id TEXT,
        email TEXT,
        endpoint TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

        // Add Indexes separately
        try {
            await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type)`).run();
            await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_security_events_date ON security_events(created_at)`).run();
        } catch (e) { console.warn('Index creation error (might exist)', e); }

        return jsonResponse({ success: true, message: 'Security events table created' }, 200, corsHeaders);
    } catch (err) {
        return jsonResponse({ error: err.message }, 500, corsHeaders);
    }
}
// POST /api/admin/metrics/setup-interactions
export async function handleSetupInteractionsTable(env, corsHeaders) {
    try {
        const statements = [
            `CREATE TABLE IF NOT EXISTS simulation_bookmarks (
                simulation_id TEXT,
                user_id TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (simulation_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS simulation_likes (
                simulation_id TEXT,
                user_id TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (simulation_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS simulation_dislikes (
                simulation_id TEXT,
                user_id TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (simulation_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS simulation_reports (
                simulation_id TEXT,
                user_id TEXT,
                reason TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (simulation_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                simulation_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                author_name TEXT,
                text TEXT,
                upvotes INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )`,
            `CREATE TABLE IF NOT EXISTS comment_likes (
                comment_id INTEGER,
                user_id TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (comment_id, user_id)
            )`
        ];

        // Execute sequentially
        for (const stmt of statements) {
            await env.DB.prepare(stmt).run();
        }

        // Add Indexes
        try {
            await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_comments_sim ON comments(simulation_id)').run();
            await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON simulation_bookmarks(user_id)').run();
        } catch (e) { console.warn('Index creation error', e); }

        return jsonResponse({ success: true, message: 'Interactions tables created' }, 200, corsHeaders);
    } catch (err) {
        return jsonResponse({ error: err.message }, 500, corsHeaders);
    }
}
