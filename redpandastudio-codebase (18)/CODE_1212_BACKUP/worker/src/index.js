/**
 * CLOUDFLARE WORKER - LEARNING PLATFORM API
 * Main entry point for all API requests
 */
// Static files are now served from R2 (no more base64 embeds)
import { generateTokens, verifyRefreshToken, createRefreshCookie, clearRefreshCookie } from './utils/auth.js';
import { authenticateToken, getUserFromRequest } from './middleware/auth.js';
import { requireRole } from './middleware/authorize.js';
import { AuthError } from './utils/constants.js';
import { rateLimit } from './middleware/rateLimit.js';
import { trackFailedLogin, recordLoginFailure, resetLoginFailures } from './utils/rateLimiter.js';
import { validateBody } from './middleware/validateBody.js';
import { sanitizeHtml, sanitizeForSQL } from './utils/sanitizer.js';
import { handleCors, getCorsHeaders } from './middleware/cors.js';
import { addSecurityHeaders } from './middleware/securityHeaders.js';
import { sanitizeFilename, validateFileExtension, validateMimeType } from './utils/fileSecurity.js';
import { scanHtmlFile, addSecurityWrapper } from './utils/htmlScanner.js';
import { handleError, createRequestId } from './utils/errorHandler.js';
import { withErrorHandling } from './middleware/errorWrapper.js';
// Duplicates removed
import { checkBotProtection, checkHoneypot } from './middleware/botProtection.js';
import { logSecurityEvent } from './utils/securityLogger.js';

import {
  handleGetMetricsOverview,
  handleGetMetricsAuth,
  handleGetMetricsThreats,
  handleGetMetricsContent,
  handleGetMetricsUsers,
  handleUnblockIp,
  handleUnlockAccount,
  handleSetupSecurityTable,
  handleSetupInteractionsTable
} from './handlers/adminMetrics.js';
import {
  handleTrackView,
  handleTrackDuration,
  handleTrackShare,
  handleReportContent
} from './handlers/analytics.js';
import {
  handleGetAnalyticsOverview,
  handleGetContentAnalytics,
  handleGetContentDeepDive,
  handleGetPlatformTrends,
  handleGetReports,
  handleResolveReport
} from './handlers/adminAnalytics.js';
import { handleAdminUploadSimulation } from './handlers/adminUpload.js';
import { handleAdminReplaceSimulation } from './handlers/adminReplace.js';
import { handleSyncContent } from './handlers/adminSync.js';
  import {
    handleGetCarouselCards,
    handleGetAllCarousels,
    handleAdminGetCarousels,
    handleAdminAddCarousel,
    handleAdminUpdateCarousel,
    handleAdminDeleteCarousel,
    handleAdminGetCarouselCards,
    handleAdminAddCarouselCard,
    handleAdminUpdateCarouselCard,
      handleAdminDeleteCarouselCard,
      handleAdminReorderCarouselCards,
      handleAdminReorderCarousels,
      handleAdminCarouselUpload
    } from './handlers/adminCarousel.js';


async function requireAdmin(request, env) {
  const { user, error } = await getUserFromRequest(request, env);
  if (!user) throw new Error(AuthError.TOKEN_MISSING);
  if (user.role !== 'admin') throw new Error(AuthError.UNAUTHORIZED);
  return user;
}

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export default {
  async fetch(request, env, ctx) {
      try {
        const url = new URL(request.url);
        const path = url.pathname;

        // Force HTTPS redirect - fixes Safari/browser security warning
        if (url.protocol === 'http:' && url.hostname !== 'localhost' && !url.hostname.startsWith('127.')) {
          return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
        }

        // CORS headers for all responses
        // Request ID for tracing
        const requestId = createRequestId();

      // Attach to request headers for downstream use
      // request.headers.set('x-request-id', requestId);

      // 0. BOT PROTECTION & HONEYPOT
      // const botRes = await checkBotProtection(request, env);
      // if (botRes) return botRes;

      // const honeyRes = await checkHoneypot(request, env);
      // if (honeyRes) return honeyRes;

      // CORS & Security
      const corsRes = handleCors(request, env);
      if (corsRes) return addSecurityHeaders(corsRes);

      const corsHeaders = getCorsHeaders(request, env);

      try {
        // Health Check
        if (path === '/api/health') {
          return jsonResponse({ status: 'ok', version: '1.0.0', environment: env.ENVIRONMENT || 'production' }, 200, corsHeaders);
        }

        // ===== RATE LIMITING (IP BASED) =====
        const clientIp = getClientIp(request);
        let limitError = null;

        // 1. Auth - Register
        if (path === '/api/auth/register' && request.method === 'POST') {
          limitError = await rateLimit({ limit: 30, window: 3600, keyGenerator: () => clientIp })(request, env);
        }
        // 2. Auth - Refresh
        else if (path === '/api/auth/refresh' && request.method === 'POST') {
          limitError = await rateLimit({ limit: 10, window: 900, keyGenerator: () => clientIp })(request, env);
        }
        // 3. Auth - Logout
        else if ((path === '/api/auth/logout' || path === '/api/auth/logout-all') && request.method === 'POST') {
          limitError = await rateLimit({ limit: 10, window: 900, keyGenerator: () => clientIp })(request, env);
        }
        // 4. Public - Read APIs
        else if (request.method === 'GET' && (
          path === '/api/categories' ||
          path.startsWith('/api/courses') ||
          path.startsWith('/api/content') ||
          path.startsWith('/api/simulations') ||
          path === '/api/search' ||
          path === '/api/recent'
        )) {
          limitError = await rateLimit({ limit: 120, window: 60, keyGenerator: () => clientIp })(request, env);
        }
        // 5. Login - Skip (Handled in handler)
        else if (path === '/api/auth/login') {
          // Pass
        }
        // 6. Global Fallback
        else {
          // Apply baseline IP limit for everything else (incl Admin/User routes before auth)
          limitError = await rateLimit({ limit: 200, window: 60, keyGenerator: () => clientIp })(request, env);
        }

        if (limitError) return limitError;

        // ===== RATE LIMITING (USER BASED) =====
        const { user: ratelimitUser } = await getUserFromRequest(request, env);

        if (ratelimitUser) {
          let userLimitError = null;

          // ADMIN ROUTES
          if (path.startsWith('/api/admin/')) {
            if (path.startsWith('/api/admin/upload') && request.method === 'POST') {
              userLimitError = await rateLimit({ limit: 40, window: 60, keyGenerator: () => ratelimitUser.userId })(request, env);
            } else {
              userLimitError = await rateLimit({ limit: 120, window: 60, keyGenerator: () => ratelimitUser.userId })(request, env);
            }
          }
          // USER ROUTES
          else if (path.startsWith('/api/bookmarks/') && request.method === 'POST') {
            userLimitError = await rateLimit({ limit: 60, window: 60, keyGenerator: () => ratelimitUser.userId })(request, env);
          }
          else if (path.startsWith('/api/comments/') && request.method === 'POST') {
            userLimitError = await rateLimit({ limit: 20, window: 60, keyGenerator: () => ratelimitUser.userId })(request, env);
          }
          else if (path.startsWith('/api/likes/') && request.method === 'POST') {
            userLimitError = await rateLimit({ limit: 60, window: 60, keyGenerator: () => ratelimitUser.userId })(request, env);
          }

          if (userLimitError) return userLimitError;
        }

        // ===== ROUTE HANDLING =====

        // 0. List ALL courses (for dynamic sidebar)
        // GET /api/courses
        if (path === '/api/courses' && request.method === 'GET') {
          return await handleGetAllCourses(request, env, corsHeaders);
        }

        // 1. Get course structure (sections + simulations)
        // GET /api/courses/:courseId
        if (path.match(/^\/api\/courses\/[a-zA-Z0-9-]+$/)) {
          const courseId = path.split('/').pop();
          return await handleGetCourse(courseId, request, env, corsHeaders);
        }

        // 2. Get single simulation details
          // GET /api/simulations/:slug
          if (path.match(/^\/api\/simulations\/[a-zA-Z0-9-]+$/)) {
          const slug = path.split('/').pop();
          return await handleGetSimulation(slug, env, corsHeaders);
        }

        // 3. Increment view count
        // POST /api/views/:simId
        if (path.match(/^\/api\/views\/[a-zA-Z0-9-]+$/) && request.method === 'POST') {
          const simId = path.split('/').pop();
          return await handleIncrementView(simId, request, env, corsHeaders);
        }

        // 4. Toggle like
        // POST /api/likes/:simId
        if (path.match(/^\/api\/likes\/[a-zA-Z0-9-]+$/) && request.method === 'POST') {
          const simId = path.split('/').pop();
          return await handleToggleLike(simId, request, env, corsHeaders);
        }

        // 5. Search simulations
        // GET /api/search?q=ec2&course=aws
        if (path === '/api/search') {
          const query = url.searchParams.get('q') || '';
          const courseId = url.searchParams.get('course') || '';
          return await handleSearch(query, courseId, request, env, corsHeaders);
        }

        // 6. Get recent simulations
        // GET /api/recent?limit=10
        if (path === '/api/recent') {
          const limit = parseInt(url.searchParams.get('limit') || '10');
          return await handleGetRecent(limit, request, env, corsHeaders);
        }

          // 7. Get ALL categories
          // GET /api/categories
          if (path === '/api/categories' && request.method === 'GET') {
            return await handleGetAllCategories(env, corsHeaders);
          }

            // 7.1. Get ALL carousel cards
            // GET /api/carousel
            if (path === '/api/carousel' && request.method === 'GET') {
              return await handleGetCarouselCards(request, env, corsHeaders);
            }

            // 7.2. Get ALL active carousels with cards
            // GET /api/carousels
            if (path === '/api/carousels' && request.method === 'GET') {
              return await handleGetAllCarousels(request, env, corsHeaders);
            }


        // 8. Get comments for a simulation
        // GET /api/comments/:simId
        if (path.match(/^\/api\/comments\/[a-zA-Z0-9-]+$/) && request.method === 'GET') {
          const simId = path.split('/').pop();
          return await handleGetComments(simId, env, corsHeaders);
        }

        // 9. Post a comment
        // POST /api/comments/:simId
        if (path.match(/^\/api\/comments\/[a-zA-Z0-9-]+$/) && request.method === 'POST') {
          const simId = path.split('/').pop();
          const validationError = await validateBody({
            content: { type: 'string', required: true, minLength: 1, maxLength: 2000, sanitizeHtml: true }
          })(request, env);
          if (validationError) return validationError;

          const data = request.sanitizedBody;
          return await handlePostComment(simId, data, request, env, corsHeaders);
        }

        // 9.5 Get bookmarks for user
        // GET /api/bookmarks
        if (path === '/api/bookmarks' && request.method === 'GET') {
          return await handleGetBookmarks(request, env, corsHeaders);
        }

        // 9.6 Toggle bookmark
        // POST /api/bookmarks/:simId
        if (path.match(/^\/api\/bookmarks\/[a-zA-Z0-9-]+$/) && request.method === 'POST') {
          const simId = path.split('/').pop();
          return await handleToggleBookmark(simId, request, env, corsHeaders);
        }

        // 10. Upvote a comment
        // POST /api/comments/:commentId/upvote
        if (path.match(/^\/api\/comments\/[0-9]+\/upvote$/) && request.method === 'POST') {
          const commentId = path.split('/')[3];
          return await handleUpvoteComment(commentId, request, env, corsHeaders);
        }

        // 11. Toggle dislike
        // POST /api/dislikes/:simId
        if (path.match(/^\/api\/dislikes\/[a-zA-Z0-9-]+$/) && request.method === 'POST') {
          const simId = path.split('/').pop();
          return await handleToggleDislike(simId, request, env, corsHeaders);
        }

        // 11.1 Report simulation
        // POST /api/reports/:simId
        if (path.match(/^\/api\/reports\/[a-zA-Z0-9-]+$/) && request.method === 'POST') {
          const simId = path.split('/').pop();
          return await handleReportSimulation(simId, request, env, corsHeaders);
        }

        // 12. Content Analytics - User Tracking
        // API: /api/content/:simId/view
        if (path.match(/^\/api\/content\/[a-zA-Z0-9-]+\/view$/) && request.method === 'POST') {
          const simId = path.split('/')[3];
          return await handleTrackView(simId, request, env, corsHeaders);
        }

        // API: /api/content/:simId/view-duration
        if (path.match(/^\/api\/content\/[a-zA-Z0-9-]+\/view-duration$/) && request.method === 'POST') {
          const simId = path.split('/')[3];
          const validationError = await validateBody({
            duration: { type: 'number', required: true, min: 0 },
            completed: { type: 'boolean', required: false }
          })(request, env);
          if (validationError) return validationError;
          return await handleTrackDuration(simId, request.sanitizedBody, request, env, corsHeaders);
        }

        // API: /api/content/:simId/share
        if (path.match(/^\/api\/content\/[a-zA-Z0-9-]+\/share$/) && request.method === 'POST') {
          const simId = path.split('/')[3];
          return await handleTrackShare(simId, await request.json(), request, env, corsHeaders);
        }

        // API: /api/content/:simId/report
        if (path.match(/^\/api\/content\/[a-zA-Z0-9-]+\/report$/) && request.method === 'POST') {
          const simId = path.split('/')[3];
          return await handleReportContent(simId, await request.json(), request, env, corsHeaders);
        }

        // 13. Auth - Login
        // POST /api/auth/login
        if (path === '/api/auth/login' && request.method === 'POST') {
          const validationError = await validateBody({
            email: { type: 'email', required: true },
            password: { type: 'string', required: true, maxLength: 128 }
          })(request, env);
          if (validationError) return validationError;

          const data = request.sanitizedBody;
          const ip = getClientIp(request);
          return await handleAuthLogin(data, env, corsHeaders, ip);
        }

        // 13. Auth - Register
        // POST /api/auth/register
        if (path === '/api/auth/register' && request.method === 'POST') {
          const validationError = await validateBody({
            email: { type: 'email', required: true },
            password: { type: 'string', required: true },
            display_name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
            role: { type: 'string', required: false }
          })(request, env);
          if (validationError) return validationError;

          const data = request.sanitizedBody;
          return await handleAuthRegister(data, env, corsHeaders);
        }

        // 14. Auth - Current user
        // GET /api/auth/me
        if (path === '/api/auth/me' && request.method === 'GET') {
          return await handleAuthMe(request, env, corsHeaders);
        }

        // 15. Auth - Logout
        // POST /api/auth/logout
        if (path === '/api/auth/logout' && request.method === 'POST') {
          return await handleAuthLogout(request, env, corsHeaders);
        }

        // 15.1 Auth - Logout All
        // POST /api/auth/logout-all
        if (path === '/api/auth/logout-all' && request.method === 'POST') {
          return await handleAuthLogoutAll(request, env, corsHeaders);
        }

        // 15.2 Auth - Refresh Token
        // POST /api/auth/refresh
        if (path === '/api/auth/refresh' && request.method === 'POST') {
          return await handleAuthRefresh(request, env, corsHeaders);
        }

        // 16. Auth - Google start
        // GET /api/auth/google/start
        if (path === '/api/auth/google/start' && request.method === 'GET') {
          return await handleGoogleAuthStart(request, env, corsHeaders);
        }

        // 17. Auth - Google callback
        // GET /api/auth/google/callback
        if (path === '/api/auth/google/callback' && request.method === 'GET') {
          return await handleGoogleAuthCallback(request, env, corsHeaders);
        }

          // MIGRATION: Add parent_course_id column if missing
          if (path === '/api/admin/migrate' && request.method === 'POST') {
            await env.DB.prepare(`ALTER TABLE courses ADD COLUMN parent_course_id TEXT DEFAULT NULL`).run().catch(() => {});
            // Fix any orphaned subcourses that were created before the column existed
            await env.DB.prepare(`UPDATE courses SET parent_course_id = 'java1' WHERE id = 'java-2' AND (parent_course_id IS NULL OR parent_course_id = '')`).run().catch(() => {});
            await env.DB.prepare(`UPDATE courses SET parent_course_id = 'linux' WHERE id = 'linux-2' AND (parent_course_id IS NULL OR parent_course_id = '')`).run().catch(() => {});
            
            // Create carousel_cards table
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS carousel_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                icon_class TEXT,
                color_hex TEXT DEFAULT '#3b82f6',
                target_type TEXT,
                target_id TEXT,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                content_type TEXT DEFAULT 'standard',
                image_url TEXT,
                iframe_url TEXT,
                content_html TEXT,
                width TEXT DEFAULT '300px',
                full_bleed INTEGER DEFAULT 0
            )`).run().catch(() => {});

            // Create carousels table
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS carousels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                header TEXT,
                is_active BOOLEAN DEFAULT 1,
                display_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )`).run().catch(() => {});

            // Seed initial carousels
            await env.DB.prepare(`INSERT OR IGNORE INTO carousels (id, name, header, display_order) VALUES (1, 'Carousel 1', 'Free Interactive Demos', 1)`).run().catch(() => {});
            await env.DB.prepare(`INSERT OR IGNORE INTO carousels (id, name, header, display_order) VALUES (2, 'Carousel 2', 'Apple Style Carousel', 2)`).run().catch(() => {});

            // Add missing columns if table already exists
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN content_type TEXT DEFAULT 'standard'`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN image_url TEXT`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN iframe_url TEXT`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN content_html TEXT`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN width TEXT DEFAULT '300px'`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN height_px TEXT DEFAULT 'auto'`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN full_bleed INTEGER DEFAULT 0`).run().catch(() => {});
            await env.DB.prepare(`ALTER TABLE carousel_cards ADD COLUMN carousel_id INTEGER DEFAULT 1`).run().catch(() => {});

            // Create metadata table if not exists
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT DEFAULT (datetime('now'))
            )`).run().catch(() => {});

            // Seed initial carousel headers
            await env.DB.prepare(`INSERT OR IGNORE INTO metadata (key, value) VALUES ('carousel_1_header', 'Free Interactive Demos')`).run().catch(() => {});
            // Removed auto-seed of carousel 2 header to allow user persistence

            // Ensure all carousels are active and have correct headers
            await env.DB.prepare(`UPDATE carousels SET is_active = 1 WHERE is_active IS NULL OR is_active = 0`).run().catch(() => {});
            
            // Force Carousel 1 and 2 to be active with correct default headers if they are empty
            await env.DB.prepare(`UPDATE carousels SET header = 'Free Interactive Demos' WHERE id = 1 AND (header IS NULL OR header = '')`).run().catch(() => {});
            await env.DB.prepare(`UPDATE carousels SET header = 'Apple Style Carousel' WHERE id = 2 AND (header IS NULL OR header = '')`).run().catch(() => {});

            // Seed initial carousel cards if empty or for Carousel 1 restoration
            const { count: c1count } = await env.DB.prepare('SELECT COUNT(*) as count FROM carousel_cards WHERE carousel_id = 1').first();
            if (c1count === 0) {
              await env.DB.prepare(`
                INSERT INTO carousel_cards (title, description, icon_class, color_hex, target_type, target_id, display_order, carousel_id, is_active)
                VALUES 
                ('AWS Certified', 'Explore our interactive AWS labs and simulations.', 'fa-brands fa-aws', '#FF9900', 'course', 'aws-1', 1, 1, 1),
                ('DevOps Mastery', 'Master CI/CD pipelines and infrastructure as code.', 'fas fa-infinity', '#A855F7', 'course', 'devops-1', 2, 1, 1),
                ('Linux Admin', 'Get hands-on experience with Linux command line.', 'fa-brands fa-linux', '#FCC624', 'course', 'linux-1', 3, 1, 1)
              `).run().catch(e => console.error('Seed C1 Error:', e));
            }
            
            // Seed Carousel 2 placeholder if empty
            const { count: c2count } = await env.DB.prepare('SELECT COUNT(*) as count FROM carousel_cards WHERE carousel_id = 2').first();
            if (c2count === 0) {
              await env.DB.prepare(`
                INSERT INTO carousel_cards (title, description, color_hex, target_type, target_id, display_order, carousel_id, is_active, content_type, image_url, width, height_px)
                VALUES 
                ('Pro Design', 'Professional level layouts for modern apps.', '#3b82f6', 'none', 'none', 1, 2, 1, 'image', '/carousel/images/card1.jpg', '400px', '500px')
              `).run().catch(e => console.error('Seed C2 Error:', e));
            }

            // Ensure all Carousel 1 cards are active (to fix homepage visibility)
            await env.DB.prepare(`UPDATE carousel_cards SET is_active = 1 WHERE carousel_id = 1`).run().catch(() => {});
            await env.DB.prepare(`UPDATE carousels SET is_active = 1 WHERE id = 1`).run().catch(() => {});
            await env.DB.prepare(`UPDATE carousel_cards SET is_active = 1 WHERE carousel_id = 2 AND (is_active IS NULL OR is_active = 0)`).run().catch(() => {});
            await env.DB.prepare(`UPDATE carousels SET is_active = 1 WHERE id = 2 AND (is_active IS NULL OR is_active = 0)`).run().catch(() => {});

            await env.KV.delete('courses:all').catch(() => {});
            return jsonResponse({ success: true, message: 'Migration done' }, 200, corsHeaders);
          }

        // DEBUG: R2 List Route (Temporary)
        if (path === '/debug/r2') {
          const listed = await env.R2.list();
          return jsonResponse({
            keys: listed.objects.map(o => o.key),
            truncated: listed.truncated
          }, 200, corsHeaders);
        }


        // ===== ADMIN ROUTES =====
  
        // DELETE /api/admin/users/:id/role - Change user role
        if (path.match(/^\/api\/admin\/users\/[a-zA-Z0-9%\._ -]+\/role$/) && request.method === 'PUT') {
          try {
            const adminUser = await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
  
            const validationError = await validateBody({
              role: { type: 'enum', values: ['admin', 'user'], required: true }
            })(request, env);
            if (validationError) return validationError;
  
            const data = request.sanitizedBody;
            return await handleAdminUpdateUserRole(id, data, adminUser, env, corsHeaders);
          } catch (e) {
            const status = (e.message === AuthError.UNAUTHORIZED || e.message === AuthError.TOKEN_MISSING) ? 403 : 500;
            return jsonResponse({ error: { code: e.message, message: e.message } }, status, corsHeaders);
          }
        }
  
        // GET /api/admin/users - List users
        if (path === '/api/admin/users' && request.method === 'GET') {
          try {
            await requireAdmin(request, env);
            return await handleAdminListUsers(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: e.message }, 403, corsHeaders);
          }
        }
  
        // POST /api/admin/courses - Add new course
        if (path === '/api/admin/courses' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminAddCourse(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: e.message }, 403, corsHeaders);
          }
        }
  
        // POST /api/admin/categories - Add new category
        if (path === '/api/admin/categories' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const validationError = await validateBody({
              id: { type: 'id', required: true },
              name: { type: 'string', required: true, maxLength: 200 },
              description: { type: 'string', required: false, maxLength: 1000, sanitizeHtml: true }
            })(request, env);
            if (validationError) return validationError;
  
            const data = request.sanitizedBody;
            return await handleAdminAddCategory(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: e.message }, 403, corsHeaders);
          }
        }
  
        // PUT /api/admin/categories - Update category
        if (path === '/api/admin/categories' && request.method === 'PUT') {
          try {
            await requireAdmin(request, env);
            const validationError = await validateBody({
              id: { type: 'id', required: true },
              name: { type: 'string', required: false, maxLength: 200 },
              display_order: { type: 'integer', required: false, min: 0 },
              description: { type: 'string', required: false, maxLength: 1000, sanitizeHtml: true }
            })(request, env);
            if (validationError) return validationError;
  
            const data = request.sanitizedBody;
            return await handleAdminUpdateCategory(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: e.message }, 403, corsHeaders);
          }
        }
  
        // POST /api/admin/bulk-import - Bulk JSON Import
        if (path === '/api/admin/bulk-import' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminBulkImportAction(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: e.message }, 403, corsHeaders);
          }
        }

        // ===== ADMIN ANALYTICS & METRICS =====

        // GET /api/admin/metrics/overview
        if (path === '/api/admin/metrics/overview' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetMetricsOverview(request, env, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }
        // GET /api/admin/metrics/auth
        if (path === '/api/admin/metrics/auth' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetMetricsAuth(request, env, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }
        // GET /api/admin/metrics/threats
        if (path === '/api/admin/metrics/threats' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetMetricsThreats(request, env, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }
        // GET /api/admin/metrics/content
        if (path === '/api/admin/metrics/content' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetMetricsContent(request, env, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }
        // GET /api/admin/metrics/users
        if (path === '/api/admin/metrics/users' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetMetricsUsers(request, env, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }
        // POST /api/admin/metrics/unblock-ip
        if (path === '/api/admin/metrics/unblock-ip' && request.method === 'POST') {
          try { await requireAdmin(request, env); return await handleUnblockIp(await request.json(), env, request, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }
        // POST /api/admin/metrics/unlock-account
        if (path === '/api/admin/metrics/unlock-account' && request.method === 'POST') {
          try { await requireAdmin(request, env); return await handleUnlockAccount(await request.json(), env, request, corsHeaders); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }

        // --- CONTENT ANALYTICS ---

        // GET /api/admin/metrics/analytics/overview
        if (path === '/api/admin/metrics/analytics/overview' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetAnalyticsOverview(env); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }

        // GET /api/admin/metrics/analytics/content
        if (path === '/api/admin/metrics/analytics/content' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetContentAnalytics(request, env); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }

        // GET /api/admin/metrics/analytics/content/:simId
        if (path.match(/^\/api\/admin\/metrics\/analytics\/content\/[a-zA-Z0-9-]+$/) && request.method === 'GET') {
          try {
            await requireAdmin(request, env);
            const simId = path.split('/').pop();
            return await handleGetContentDeepDive(simId, env);
          } catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }

        // GET /api/admin/metrics/analytics/trends
        if (path === '/api/admin/metrics/analytics/trends' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetPlatformTrends(env); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }

        // GET /api/admin/metrics/analytics/reports
        if (path === '/api/admin/metrics/analytics/reports' && request.method === 'GET') {
          try { await requireAdmin(request, env); return await handleGetReports(env); }
          catch (e) { return jsonResponse({ error: 'Access Denied' }, 403, corsHeaders); }
        }

        // POST /api/admin/metrics/analytics/reports/:reportId/resolve
        if (path.match(/^\/api\/admin\/metrics\/analytics\/reports\/[a-zA-Z0-9-]+\/resolve$/) && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const reportId = path.split('/')[6];
            return await handleResolveReport(reportId, await request.json(), env);
          } catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
        }

        // DELETE /api/admin/categories/:id - Delete category
        if (path.match(/^\/api\/admin\/categories\/[a-zA-Z0-9-]+$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = path.split('/').pop();
            return await handleAdminDeleteCategory(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // SETUP: Create Categories Table
        if (path === '/api/admin/setup-categories-table' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleSetupCategoriesTable(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // SETUP: Create Interactions Table
        if (path === '/api/admin/setup-interactions-table' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleSetupInteractionsTable(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/sections - Add new section
        if (path === '/api/admin/sections' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminAddSection(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/simulations - Add new simulation (JSON only, no file)
        if (path === '/api/admin/simulations' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminAddSimulation(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }



        // POST /api/admin/bulk-upload - Upload multiple files
        if (path === '/api/admin/bulk-upload' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleAdminBulkUpload(request, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/sync-content - Sync R2 to D1
        if (path === '/api/admin/sync-content' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleSyncContent(request, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/courses/:id (soft delete)
        if (path.match(/^\/api\/admin\/courses\/[a-zA-Z0-9%\._ -]+$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/').pop());
            return await handleAdminDeleteCourse(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/courses/:id/restore
        if (path.match(/^\/api\/admin\/courses\/[a-zA-Z0-9%\._ -]+\/restore$/) && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminRestoreCourse(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/courses/:id/permanent
        if (path.match(/^\/api\/admin\/courses\/[a-zA-Z0-9%\._ -]+\/permanent$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminPermanentDeleteCourse(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // GET /api/admin/categories/deleted
        if (path === '/api/admin/categories/deleted' && request.method === 'GET') {
          try {
            await requireAdmin(request, env);
            return await handleGetDeletedCategories(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/categories/:id/restore
        if (path.match(/^\/api\/admin\/categories\/[a-zA-Z0-9%\._ -]+\/restore$/) && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminRestoreCategory(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

          // POST /api/admin/categories/reorder
          if (path === '/api/admin/categories/reorder' && request.method === 'POST') {
            try {
              await requireAdmin(request, env);
              const data = await request.json();
              return await handleAdminReorderCategories(data, env, corsHeaders);
            } catch (e) {
              return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
            }
          }

          // GET /api/admin/carousels
          if (path === '/api/admin/carousels' && request.method === 'GET') {
            try { await requireAdmin(request, env); return await handleAdminGetCarousels(request, env, corsHeaders); }
            catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
          }
          // POST /api/admin/carousels
          if (path === '/api/admin/carousels' && request.method === 'POST') {
            try { await requireAdmin(request, env); return await handleAdminAddCarousel(await request.json(), env, corsHeaders); }
            catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
          }
          // PUT /api/admin/carousels
          if (path === '/api/admin/carousels' && request.method === 'PUT') {
            try { await requireAdmin(request, env); return await handleAdminUpdateCarousel(await request.json(), env, corsHeaders); }
            catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
          }
          // DELETE /api/admin/carousels/:id
          if (path.match(/^\/api\/admin\/carousels\/[0-9]+$/) && request.method === 'DELETE') {
            try { await requireAdmin(request, env); return await handleAdminDeleteCarousel(path.split('/').pop(), env, corsHeaders); }
            catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
          }

          // GET /api/admin/carousel
          if (path === '/api/admin/carousel' && request.method === 'GET') {
            try { 
              await requireAdmin(request, env); 
              return await handleAdminGetCarouselCards(request, env, corsHeaders); 
            } catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
          }
          // POST /api/admin/carousel
          if (path === '/api/admin/carousel' && request.method === 'POST') {
            try { 
              await requireAdmin(request, env); 
              return await handleAdminAddCarouselCard(await request.json(), env, corsHeaders); 
            } catch (e) { 
              const status = (e.message === AuthError.TOKEN_MISSING || e.message === AuthError.UNAUTHORIZED || e.message === AuthError.ADMIN_REQUIRED) ? 403 : 500;
              return jsonResponse({ error: e.message || 'Server error during carousel add' }, status, corsHeaders); 
            }
          }
          // PUT /api/admin/carousel
          if (path === '/api/admin/carousel' && request.method === 'PUT') {
            try { 
              await requireAdmin(request, env); 
              return await handleAdminUpdateCarouselCard(await request.json(), env, corsHeaders); 
            } catch (e) { 
              const status = (e.message === AuthError.TOKEN_MISSING || e.message === AuthError.UNAUTHORIZED || e.message === AuthError.ADMIN_REQUIRED) ? 403 : 500;
              return jsonResponse({ error: e.message || 'Server error during carousel update' }, status, corsHeaders); 
            }
          }
          // POST /api/admin/carousel/upload
          if (path === '/api/admin/carousel/upload' && request.method === 'POST') {
            try { 
              await requireAdmin(request, env); 
              return await handleAdminCarouselUpload(request, env, corsHeaders); 
            } catch (e) { 
              const status = (e.message === AuthError.TOKEN_MISSING || e.message === AuthError.UNAUTHORIZED || e.message === AuthError.ADMIN_REQUIRED) ? 403 : 500;
              return jsonResponse({ error: e.message || 'Server error during upload' }, status, corsHeaders); 
            }
          }
          // DELETE /api/admin/carousel/:id
          if (path.match(/^\/api\/admin\/carousel\/[0-9]+$/) && request.method === 'DELETE') {
            try {
              await requireAdmin(request, env);
              const id = path.split('/').pop();
              return await handleAdminDeleteCarouselCard(id, env, corsHeaders);
            } catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
          }
            // POST /api/admin/carousel/reorder
            if (path === '/api/admin/carousel/reorder' && request.method === 'POST') {
              try { 
                await requireAdmin(request, env); 
                return await handleAdminReorderCarouselCards(await request.json(), env, corsHeaders); 
              } catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
            }
            // POST /api/admin/carousels/reorder
            if (path === '/api/admin/carousels/reorder' && request.method === 'POST') {
              try { 
                await requireAdmin(request, env); 
                return await handleAdminReorderCarousels(await request.json(), env, corsHeaders); 
              } catch (e) { return jsonResponse({ error: e.message || 'Access Denied' }, 403, corsHeaders); }
            }

        // POST /api/admin/courses/reorder
        if (path === '/api/admin/courses/reorder' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminReorderCourses(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/categories/:id/permanent
        if (path.match(/^\/api\/admin\/categories\/[a-zA-Z0-9%\._ -]+\/permanent$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminPermanentDeleteCategory(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/migrate-categories-table (one-time)
        if (path === '/api/admin/migrate-categories-table' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleMigrateCategoriesTable(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/migrate-simulations-table (one-time)
        if (path === '/api/admin/migrate-simulations-table' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleMigrateSimulationsTable(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/migrate-users-role (one-time)
        if (path === '/api/admin/migrate-users-role' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleMigrateUsersRole(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // GET /api/admin/courses/deleted
        if (path === '/api/admin/courses/deleted' && request.method === 'GET') {
          try {
            await requireAdmin(request, env);
            return await handleGetDeletedCourses(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // GET /api/admin/simulations/deleted
        if (path === '/api/admin/simulations/deleted' && request.method === 'GET') {
          try {
            await requireAdmin(request, env);
            return await handleGetDeletedSimulations(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/simulations/:id/restore
        if (path.match(/^\/api\/admin\/simulations\/[a-zA-Z0-9%\._ -]+\/restore$/) && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminRestoreSimulation(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/simulations/:id/permanent
        if (path.match(/^\/api\/admin\/simulations\/[a-zA-Z0-9%\._ -]+\/permanent$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminPermanentDeleteSimulation(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // PUT /api/admin/courses - Update course
        if (path === '/api/admin/courses' && request.method === 'PUT') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminUpdateCourse(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/sections/:id
        if (path.match(/^\/api\/admin\/sections\/[a-zA-Z0-9%\._ -]+$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/').pop());
            return await handleAdminDeleteSection(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // PUT /api/admin/sections - Update section
        if (path === '/api/admin/sections' && request.method === 'PUT') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminUpdateSection(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/simulations/:id
        if (path.match(/^\/api\/admin\/simulations\/[a-zA-Z0-9%\._ -]+$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/').pop());
            return await handleAdminDeleteSimulation(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // PUT /api/admin/simulations - Update simulation
        if (path === '/api/admin/simulations' && request.method === 'PUT') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminUpdateSimulation(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/migrate-sections-table (one-time)
        if (path === '/api/admin/migrate-sections-table' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleMigrateSectionsTable(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // GET /api/admin/sections/deleted
        if (path === '/api/admin/sections/deleted' && request.method === 'GET') {
          try {
            await requireAdmin(request, env);
            return await handleGetDeletedSections(env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/sections/:id/restore
        if (path.match(/^\/api\/admin\/sections\/[a-zA-Z0-9%\._ -]+\/restore$/) && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminRestoreSection(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // DELETE /api/admin/sections/:id/permanent
        if (path.match(/^\/api\/admin\/sections\/[a-zA-Z0-9%\._ -]+\/permanent$/) && request.method === 'DELETE') {
          try {
            await requireAdmin(request, env);
            const id = decodeURIComponent(path.split('/')[4]);
            return await handleAdminPermanentDeleteSection(id, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/sections/reorder
        if (path === '/api/admin/sections/reorder' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminReorderSections(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // POST /api/admin/upload-simulation
        if (path === '/api/admin/upload-simulation' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            // multipart/form-data is handled inside the handler
            return await handleAdminUploadSimulation(request, env, corsHeaders);
          } catch (e) {
            const status = (e.message === AuthError.UNAUTHORIZED || e.message === AuthError.TOKEN_MISSING) ? 403 : 500;
            return jsonResponse({ error: { code: 'UPLOAD_HANDLER_ERROR', message: e.message } }, status, corsHeaders);
          }
        }

        // POST /api/admin/replace-simulation — overwrite R2 file for existing simulation
        if (path === '/api/admin/replace-simulation' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            return await handleAdminReplaceSimulation(request, env, corsHeaders);
          } catch (e) {
            const status = (e.message === AuthError.UNAUTHORIZED || e.message === AuthError.TOKEN_MISSING) ? 403 : 500;
            return jsonResponse({ error: e.message }, status, corsHeaders);
          }
        }

        // POST /api/admin/simulations/reorder
        if (path === '/api/admin/simulations/reorder' && request.method === 'POST') {
          try {
            await requireAdmin(request, env);
            const data = await request.json();
            return await handleAdminReorderSimulations(data, env, corsHeaders);
          } catch (e) {
            return jsonResponse({ error: { code: e.message, message: 'Access Denied' } }, 403, corsHeaders);
          }
        }

        // 8. Serve simulation HTML from R2
        // GET /simulations/*
        if (path.startsWith('/simulations/')) {
          return await handleServeSimulation(path, request, env, corsHeaders);
        }

          // ===== STATIC FILE SERVING FROM R2 =====
            // Friendly URL aliases
              const ALIASES = {
                '/': 'static/index.html',
              '/about': 'static/about.html',
              '/contact': 'static/contact.html',
              '/legal/privacy': 'static/privacy.html',
              '/legal/cookies': 'static/cookies.html',
              '/legal/cookie-preferences': 'static/cookie-preferences.html',
              '/legal/terms': 'static/terms.html',
            };

            // Check alias first, then try R2 directly
            let r2Key = ALIASES[path];
            if (r2Key) {
              return await serveStaticFromR2(r2Key, env, corsHeaders);
            }

            // For any non-API path, try to serve from R2 as static/<filename>
            let filename = path.startsWith('/') ? path.slice(1) : path;
            if (filename === '') filename = 'index.html';

            if (filename && !filename.includes('..')) {
              const obj = await env.R2.get('static/' + filename);
              if (obj) {
                return await serveStaticFromR2('static/' + filename, env, corsHeaders);
              }
            }

            // Fallback for subdirectories (e.g. /login -> /login.html)
            if (filename && !filename.includes('.') && !filename.includes('..')) {
              const objHtml = await env.R2.get('static/' + filename + '.html');
              if (objHtml) {
                return await serveStaticFromR2('static/' + filename + '.html', env, corsHeaders);
              }
            }

            // 404 - Route not found
            return jsonResponse({
              error: 'Not found',
              path: path,
            }, 404, corsHeaders);

      } catch (error) {
        console.error('Worker error:', error);
        return jsonResponse(
          { error: 'Internal server error', message: error.message },
          500,
          corsHeaders
        );
      }
    } catch (criticalError) {
      return new Response('Critical Worker Error: ' + criticalError.message, { status: 500 });
    }
  },

  // Scheduled job handler
  async scheduled(event, env, ctx) {
    console.log('Starting KV → D1 sync job...');

    try {
      // Get all simulations from D1
      const { results: simulations } = await env.DB.prepare(`
        SELECT id FROM simulations
      `).all();

      let synced = 0;
      let errors = 0;

      // Process in batches of 50
      for (let i = 0; i < simulations.length; i += 50) {
        const batch = simulations.slice(i, i + 50);

        await Promise.all(batch.map(async (sim) => {
          try {
            // Fetch current counts from KV
            const viewsKey = `view:${sim.id}`;
            const likesKey = `likes:${sim.id}`;
            const dislikesKey = `dislikes:${sim.id}`;

            const views = parseInt(await env.KV.get(viewsKey) || '0');
            const likes = parseInt(await env.KV.get(likesKey) || '0');
            const dislikes = parseInt(await env.KV.get(dislikesKey) || '0');

            // Update D1 statistics table
            await env.DB.prepare(`
              INSERT INTO statistics (simulation_id, views, likes, dislikes, last_synced_at)
              VALUES (?, ?, ?, ?, datetime('now'))
              ON CONFLICT(simulation_id) 
              DO UPDATE SET 
                views = excluded.views,
                likes = excluded.likes,
                dislikes = excluded.dislikes,
                last_synced_at = excluded.last_synced_at
            `).bind(sim.id, views, likes, dislikes).run();

            synced++;
          } catch (err) {
            console.error(`Error syncing ${sim.id}:`, err);
            errors++;
          }
        }));
      }

      console.log(`Sync complete: ${synced} synced, ${errors} errors`);

      // Update metadata
      await env.DB.prepare(`
        UPDATE metadata 
        SET value = datetime('now'), updated_at = datetime('now')
        WHERE key = 'last_sync_date'
      `).run();

    } catch (error) {
      console.error('Sync job failed:', error);
    }
  }
};

const CACHE_BUST_PARAMS = ['t'];

// MIME type lookup for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/**
 * Serve a static file from R2 bucket
 * @param {string} r2Key - The key in R2 (e.g. 'static/index.html')
 * @param {object} env - Worker env bindings
 * @param {object} corsHeaders - CORS headers to include
 */
async function serveStaticFromR2(r2Key, env, corsHeaders) {
  const object = await env.R2.get(r2Key);

  if (!object) {
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  // Determine content type from extension
  const ext = '.' + r2Key.split('.').pop();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // All files: no-cache (always fresh - we update frequently).
      const noCache = true;
      const cacheControl = 'no-cache, no-store, must-revalidate';

  const headers = {
    ...corsHeaders,
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
  };

  if (noCache) {
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
      headers['CDN-Cache-Control'] = 'no-store';
      headers['Surrogate-Control'] = 'no-store';
    }

  return new Response(object.body, { headers });
}

function hasCacheBustParam(request) {
  const url = new URL(request.url);
  return CACHE_BUST_PARAMS.some(param => url.searchParams.has(param));
}

function buildCacheKey(request) {
  const url = new URL(request.url);
  CACHE_BUST_PARAMS.forEach(param => url.searchParams.delete(param));
  return new Request(url.toString(), request);
}

async function getCachedResponse(request) {
  if (request.method !== 'GET') return null;
  if (hasCacheBustParam(request)) return null;
  const cacheKey = buildCacheKey(request);
  return caches.default.match(cacheKey);
}

async function putCachedResponse(request, response, ttlSeconds) {
  if (request.method !== 'GET') return;
  if (hasCacheBustParam(request)) return;
  const cacheKey = buildCacheKey(request);
  const cached = response.clone();
  cached.headers.set('Cache-Control', `public, max-age=${ttlSeconds}`);
  await caches.default.put(cacheKey, cached);
}

// ===== HANDLER FUNCTIONS =====

/**
 * COURSE EXTENSIONS MAP
 * Legacy fallback only. Extensions are now managed via parent_course_id in the DB.
 * This map is no longer used for sidebar logic.
 */
const COURSE_EXTENSIONS_MAP = {};

/**
 * GET /api/courses
 * Returns list of all active courses (for dynamic sidebar)
 */
async function handleGetAllCourses(request, env, corsHeaders) {
  const _url = new URL(request.url);
  const _isAdmin = _url.searchParams.get('admin') === '1';
  if (!_isAdmin) {
    const cached = await getCachedResponse(request);
    if (cached) return cached;
  }

  // Query D1 database for all active courses with counts + parent_course_id
  let results;
  try {
    ({ results } = await env.DB.prepare(`
      SELECT 
        c.id,
        c.title,
        c.icon_class,
        c.description,
        c.color_theme,
        c.category,
        c.display_order,
        c.is_locked,
        c.parent_course_id,
        COUNT(DISTINCT sim.id) as simulation_count
      FROM courses c
      LEFT JOIN simulations sim ON c.id = sim.course_id AND sim.is_deleted = 0
      WHERE c.is_active = 1 AND c.is_deleted = 0
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `).all());
  } catch (err) {
    if (!err.message.includes('no such column')) throw err;
    // parent_course_id column doesn't exist yet — fall back without it
    ({ results } = await env.DB.prepare(`
      SELECT 
        c.id,
        c.title,
        c.icon_class,
        c.description,
        c.color_theme,
        c.category,
        c.display_order,
        c.is_locked,
        NULL as parent_course_id,
        COUNT(DISTINCT sim.id) as simulation_count
      FROM courses c
      LEFT JOIN simulations sim ON c.id = sim.course_id
      WHERE c.is_active = 1 AND c.is_deleted = 0
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `).all());
  }

  // Build lookup by id
  const allCoursesById = {};
  results.forEach(row => {
    allCoursesById[row.id] = {
      id: row.id,
      title: row.title,
      icon_class: row.icon_class,
      description: row.description,
      color_theme: row.color_theme,
      category: row.category || 'skill',
      display_order: row.display_order,
      is_locked: Boolean(row.is_locked),
      parent_course_id: row.parent_course_id || null,
      simulation_count: row.simulation_count || 0
    };
  });

  const url = new URL(request.url);
  const isAdminRequest = url.searchParams.get('admin') === '1';

  let responseData;
  if (isAdminRequest) {
    // Admin mode: return all courses as-is with parent_course_id
    const allCourses = results.map(row => ({ ...allCoursesById[row.id] }));
    responseData = { courses: allCourses, total: allCourses.length };
  } else {
    // Sidebar mode: extension courses (those with a parent_course_id) are hidden
    // from the top-level list; their parent gets an extensions[] array.
    const extensionIds = new Set(results.filter(r => r.parent_course_id).map(r => r.id));

    // Group extensions by parent
    const extensionsByParent = {};
    results.forEach(row => {
      if (row.parent_course_id) {
        if (!extensionsByParent[row.parent_course_id]) extensionsByParent[row.parent_course_id] = [];
        extensionsByParent[row.parent_course_id].push(allCoursesById[row.id]);
      }
    });

    const sidebarCourses = results
      .filter(row => !extensionIds.has(row.id))
      .map(row => {
        const course = { ...allCoursesById[row.id] };
        const children = extensionsByParent[row.id];
        if (children && children.length > 0) {
          // Parent shows as "Title Main" + each child extension
          const parentAsMain = { ...course, title: course.title + ' Main', extensions: [] };
          course.extensions = [parentAsMain, ...children];
        }
        return course;
      });
    responseData = { courses: sidebarCourses, total: sidebarCourses.length };
  }

  const resp = jsonResponse(responseData, 200, corsHeaders);
  if (!isAdminRequest) await putCachedResponse(request, resp, 300);
  return resp;
}

/**
 * GET /api/courses/:courseId
 * Returns complete course structure with sections and simulations
 */
async function handleGetCourse(courseId, request, env, corsHeaders) {
  const cached = await getCachedResponse(request);
  if (cached) return cached;

  // Query D1 database
  let results;
  try {
    ({ results } = await env.DB.prepare(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.icon_class as course_icon,
        c.description as course_description,
        c.is_locked as course_locked,
        sec.id as section_id,
        sec.title as section_title,
        sec.display_order as section_order,
        sec.is_locked as section_locked,
        sim.id as sim_id,
        sim.slug,
        sim.title as sim_title,
        sim.icon_class as sim_icon,
        sim.is_locked as sim_locked,
        sim.has_simulation,
        sim.file_path,
        sim.display_order as sim_order,
        sim.upload_date,
        COALESCE(st.views, 0) as views,
        COALESCE(st.likes, 0) as likes,
        COALESCE(st.dislikes, 0) as dislikes,
        COALESCE(st.reports, 0) as reports
      FROM courses c
      LEFT JOIN sections sec ON c.id = sec.course_id AND sec.is_deleted = 0
      LEFT JOIN simulations sim ON sec.id = sim.section_id AND sim.is_deleted = 0
      LEFT JOIN statistics st ON sim.id = st.simulation_id
      WHERE c.id = ? AND c.is_active = 1 AND c.is_deleted = 0
      ORDER BY sec.display_order, sim.display_order
    `).bind(courseId).all());
  } catch (err) {
    if (!err.message.includes('no such column')) throw err;
    ({ results } = await env.DB.prepare(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.icon_class as course_icon,
        c.description as course_description,
        c.is_locked as course_locked,
        sec.id as section_id,
        sec.title as section_title,
        sec.display_order as section_order,
        sec.is_locked as section_locked,
        sim.id as sim_id,
        sim.slug,
        sim.title as sim_title,
        sim.icon_class as sim_icon,
        sim.is_locked as sim_locked,
        sim.has_simulation,
        sim.display_order as sim_order,
        sim.upload_date,
          COALESCE(st.views, 0) as views,
          COALESCE(st.likes, 0) as likes,
          COALESCE(st.dislikes, 0) as dislikes,
          0 as reports
        FROM courses c
        LEFT JOIN sections sec ON c.id = sec.course_id
        LEFT JOIN simulations sim ON sec.id = sim.section_id
        LEFT JOIN statistics st ON sim.id = st.simulation_id
        WHERE c.id = ? AND c.is_active = 1 AND c.is_deleted = 0
        ORDER BY sec.display_order, sim.display_order
      `).bind(courseId).all());
  }

  if (results.length === 0) {
    // Check if course exists but has no data
    const courseCheck = await env.DB.prepare(`
      SELECT id, title, icon_class, description FROM courses WHERE id = ? AND is_active = 1 AND is_deleted = 0
    `).bind(courseId).first();

    if (courseCheck) {
      // Course exists but has no sections - return empty structure
      const emptyResponse = {
        id: courseCheck.id,
        title: courseCheck.title,
        icon: courseCheck.icon_class,
        description: courseCheck.description,
        sections: [],
        totalItems: 0
      };
      const resp = jsonResponse(emptyResponse, 200, corsHeaders);
      await putCachedResponse(request, resp, 300);
      return resp;
    }
    return jsonResponse({ error: 'Course not found' }, 404, corsHeaders);
  }

  // Transform flat results into hierarchical structure
  const courseData = {
    id: results[0].course_id,
    title: results[0].course_title,
    icon: results[0].course_icon,
    description: results[0].course_description,
    is_locked: results[0].course_locked,
    sections: [],
    totalItems: 0
  };

  const sectionsMap = new Map();

  results.forEach(row => {
    if (!row.section_id) return; // Skip if no sections

    if (!sectionsMap.has(row.section_id)) {
      sectionsMap.set(row.section_id, {
        id: row.section_id,
        title: row.section_title,
        display_order: row.section_order,
        is_locked: row.section_locked,
        items: [],
        simulations: []
      });
    }

    if (row.sim_id) {
      const simData = {
        id: row.sim_id,
        slug: row.slug,
        name: row.sim_title,
        icon: row.sim_icon,
        is_locked: row.sim_locked,
        type: 'file',
        // NOTE: file_path fallback is for local/dev. Production expects file_path to be set for simulations.
        // Original line (pre-session): link: row.has_simulation ? `simulations/${courseId}/${row.slug}/index.html` : null,
        // Intermediate line (session): link: row.file_path || `simulations/${courseId}/${row.slug}/index.html`,
        link: row.has_simulation ? (row.file_path || `simulations/${courseId}/${row.slug}/index.html`) : null,
        file_path: row.file_path || (row.has_simulation ? `simulations/${courseId}/${row.slug}/index.html` : null),
        simulation_id: row.sim_id,
        display_order: row.sim_order,
        views: row.views,
        likes: row.likes,
        dislikes: row.dislikes,
        reports: row.reports,
        upload_date: row.upload_date
      };
      sectionsMap.get(row.section_id).items.push(simData);
      sectionsMap.get(row.section_id).simulations.push(simData);
      courseData.totalItems++;
    }
  });

  courseData.sections = Array.from(sectionsMap.values());

  const resp = jsonResponse(courseData, 200, corsHeaders);
  await putCachedResponse(request, resp, 300);
  return resp;
}

/**
 * GET /api/simulations/:slug
 * Returns detailed simulation metadata
 */
async function handleGetSimulation(slug, env, corsHeaders) {
  const { results } = await env.DB.prepare(`
    SELECT 
      sim.*,
      sec.title as section_title,
      c.title as course_title,
      c.icon_class as course_icon,
      COALESCE(st.views, 0) as views,
      COALESCE(st.likes, 0) as likes,
      COALESCE(st.reports, 0) as reports,
      GROUP_CONCAT(t.tag_name, ',') as tags
    FROM simulations sim
    JOIN sections sec ON sim.section_id = sec.id
    JOIN courses c ON sim.course_id = c.id
    LEFT JOIN statistics st ON sim.id = st.simulation_id
    LEFT JOIN tags t ON sim.id = t.simulation_id
    WHERE sim.slug = ?
    GROUP BY sim.id
  `).bind(slug).all();

  if (results.length === 0) {
    return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);
  }

  const sim = results[0];
  const response = {
    id: sim.id,
    slug: sim.slug,
    title: sim.title,
    description: sim.description,
    icon: sim.icon_class,
    course: {
      id: sim.course_id,
      title: sim.course_title,
      icon: sim.course_icon
    },
    section: sim.section_title,
    filePath: sim.file_path,
    hasSimulation: Boolean(sim.has_simulation),
    views: sim.views,
    likes: sim.likes,
    dislikes: sim.dislikes,
    reports: sim.reports,
    tags: sim.tags ? sim.tags.split(',') : [],
    uploadDate: sim.upload_date
  };

  return jsonResponse(response, 200, corsHeaders);
}

/**
 * POST /api/views/:simId
 * Atomically increments view counter in D1
 */
async function handleIncrementView(simId, request, env, corsHeaders) {
  // Course-level views use virtual ids like "course-<id>" which aren't in simulations.
  // Skip D1 stats to avoid FK errors.
  if (simId.startsWith('course-')) {
    return jsonResponse({ simId, views: 0 }, 200, corsHeaders);
  }

  const dedupe = await resolveViewDedupe(request, env, simId);
  const existing = await env.KV.get(dedupe.key);

  if (existing) {
    const current = await env.DB.prepare(
      'SELECT COALESCE(views, 0) as views FROM statistics WHERE simulation_id = ?'
    ).bind(simId).first();

    return jsonResponse({
      simId,
      views: current?.views ?? 0
    }, 200, corsHeaders);
  }

  const { results } = await env.DB.prepare(`
    INSERT INTO statistics (simulation_id, views, likes, dislikes, reports, last_synced_at)
    VALUES (
      ?,
      1,
      0,
      0,
      (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
      datetime('now')
    )
    ON CONFLICT(simulation_id) DO UPDATE SET
      views = views + 1,
      reports = (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
      last_synced_at = datetime('now')
    RETURNING views
  `).bind(simId, simId, simId).all();

  const views = results?.[0]?.views ?? 0;
  try {
    await env.KV.put(dedupe.key, '1', { expirationTtl: dedupe.ttl });
  } catch (err) {
    console.warn('KV put failed for view dedupe:', err);
  }

  return jsonResponse({
    simId,
    views
  }, 200, corsHeaders);
}

/**
 * POST /api/likes/:simId
 * Toggles like using D1 with uniqueness constraints
 */
async function handleToggleLike(simId, request, env, corsHeaders) {
  const identity = await resolveUserIdentity(request, env);
  const userId = identity.userId;

  const sim = await env.DB.prepare('SELECT course_id FROM simulations WHERE id = ?').bind(simId).first();
  if (!sim) return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);

  // Ensure anonymous user exists to satisfy FK
  if (identity.isAnon) {
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, is_active)
      VALUES (?, ?, ?, 'Anonymous', 1)
      ON CONFLICT(id) DO NOTHING
    `).bind(userId, identity.email, '').run();
  }

  // Try to like (idempotent)
  const insertResult = await env.DB.prepare(`
    INSERT INTO simulation_likes (simulation_id, user_id)
    VALUES (?, ?)
    ON CONFLICT(simulation_id, user_id) DO NOTHING
    RETURNING 1 as inserted
  `).bind(simId, userId).all();

  let liked = false;

  if (insertResult.results?.length) {
    liked = true;
    // Enforce mutual exclusivity: remove dislike
    await env.DB.prepare(`
      DELETE FROM simulation_dislikes
      WHERE simulation_id = ? AND user_id = ?
    `).bind(simId, userId).run();
  } else {
    // Unlike if already liked
    const deleteResult = await env.DB.prepare(`
      DELETE FROM simulation_likes
      WHERE simulation_id = ? AND user_id = ?
      RETURNING 1 as deleted
    `).bind(simId, userId).all();
    liked = false;

    if (!deleteResult.results?.length) {
      // No-op: already unliked
      liked = false;
    }
  }

  // Sync counts to statistics from source-of-truth tables
  await env.DB.prepare(`
    INSERT INTO statistics (simulation_id, views, likes, dislikes, reports, last_synced_at)
    VALUES (
      ?,
      0,
      (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?),
      (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?),
      (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
      datetime('now')
    )
    ON CONFLICT(simulation_id) DO UPDATE SET
      likes = (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?),
      dislikes = (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?),
      reports = (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
      last_synced_at = datetime('now')
  `).bind(simId, simId, simId, simId, simId, simId, simId).run();

  const { results } = await env.DB.prepare(
    `SELECT 
       (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?) as likes,
       (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?) as dislikes
    `
  ).bind(simId, simId).all();

  const likes = results?.[0]?.likes ?? 0;
  const dislikes = results?.[0]?.dislikes ?? 0;

  await env.KV.delete(`metadata:${sim.course_id}`);

  return jsonResponse({
    simId,
    liked,
    likes,
    dislikes
  }, 200, corsHeaders);
}

/**
 * GET /api/search?q=ec2&course=aws
 * Full-text search across simulations
 */
async function handleSearch(query, courseId, request, env, corsHeaders) {
  if (!query || query.length < 2) {
    return jsonResponse({ error: 'Query too short' }, 400, corsHeaders);
  }

  const cached = await getCachedResponse(request);
  if (cached) return cached;

  // FTS search
  let sql = `
    SELECT sim.id, sim.slug, sim.title, sim.course_id, sim.icon_class
    FROM simulations sim
    JOIN simulations_fts fts ON sim.rowid = fts.rowid
    WHERE simulations_fts MATCH ?
  `;
  const params = [query];

  if (courseId) {
    sql += ` AND sim.course_id = ?`;
    params.push(courseId);
  }

  sql += ` ORDER BY rank LIMIT 20`;

  const { results } = await env.DB.prepare(sql).bind(...params).all();

  const response = {
    query,
    results: results.map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      course: r.course_id,
      icon: r.icon_class
    }))
  };

  const resp = jsonResponse(response, 200, corsHeaders);
  await putCachedResponse(request, resp, 600);
  return resp;
}

/**
 * GET /api/recent?limit=10
 * Returns recently added simulations
 */
async function handleGetRecent(limit, request, env, corsHeaders) {
  const cached = await getCachedResponse(request);
  if (cached) return cached;

  // Query D1
  const { results } = await env.DB.prepare(`
    SELECT 
      sim.id,
      sim.slug,
      sim.title,
      sim.course_id,
      c.title as course_title,
      c.icon_class as course_icon,
      sim.upload_date
    FROM simulations sim
    JOIN courses c ON sim.course_id = c.id
    ORDER BY sim.upload_date DESC
    LIMIT ?
  `).bind(limit).all();

  const resp = jsonResponse(results, 200, corsHeaders);
  await putCachedResponse(request, resp, 3600);
  return resp;
}

/**
 * GET /simulations/*
 * Serves simulation HTML files from R2
 */
async function handleServeSimulation(path, request, env, corsHeaders) {
  // Remove leading slash
  const key = path.substring(1);

  // Fetch from R2
  const object = await env.R2.get(key);

  if (!object) {
    return new Response('Simulation not found', {
      status: 404,
      headers: corsHeaders
    });
  }

  const res = new Response(object.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    }
  });

  const securedRes = addSecurityHeaders(res);

  // Restore/Override CSP for simulations (needs lenient policy)
  securedRes.headers.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *;");
  securedRes.headers.set('X-Frame-Options', 'ALLOWALL');

  return securedRes;
}

/**
 * Helper to ensure unique slug by appending counter
 */
async function getUniqueSlug(env, baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await env.DB.prepare('SELECT id FROM simulations WHERE slug = ?').bind(slug).first();
    if (!existing) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ===== ADMIN HANDLER FUNCTIONS =====

/**
 * POST /api/admin/courses
 * Add a new course
 */
async function handleAdminAddCourse(data, env, corsHeaders) {
  const { id, title, icon_class, category = 'skill', display_order = 0, parent_course_id = null } = data;

  if (!id || !title || !icon_class) {
    return jsonResponse({ error: 'Missing required fields: id, title, icon_class' }, 400, corsHeaders);
  }

  try {
    await env.DB.prepare(`
      INSERT INTO courses (id, title, icon_class, category, display_order, is_active, parent_course_id)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(id, title, icon_class, category, display_order, parent_course_id || null).run();

    // Invalidate cache
    await env.KV.delete('courses:all');

    return jsonResponse({ success: true, id }, 201, corsHeaders);
  } catch (err) {
    // parent_course_id column may not exist yet — retry without it
    if (err.message && err.message.includes('no such column')) {
      await env.DB.prepare(`
        INSERT INTO courses (id, title, icon_class, category, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(id, title, icon_class, category, display_order).run();
      await env.KV.delete('courses:all');
      return jsonResponse({ success: true, id, warning: 'parent_course_id not saved, run migration' }, 201, corsHeaders);
    }
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/admin/simulations
 * Add a new simulation
 */
async function handleAdminAddSimulation(data, env, corsHeaders) {
  const { id, section_id, course_id, slug: requestedSlug, title, file_path, has_simulation = 0, display_order = 0 } = data;

  if (!id || !section_id || !course_id || !requestedSlug || !title || !file_path) {
    return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
  }

  try {
    // Ensure unique slug
    const slug = await getUniqueSlug(env, requestedSlug);

    await env.DB.prepare(`
      INSERT INTO simulations (id, section_id, course_id, slug, title, file_path, has_simulation, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, section_id, course_id, slug, title, file_path, has_simulation, display_order).run();

    // Invalidate caches
    await env.KV.delete(`metadata:${course_id}`);
    await env.KV.delete('recent:all');

    return jsonResponse({ success: true, id, slug }, 201, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/admin/bulk-import
 * Bulk insert courses, sections, or simulations
 */
async function handleAdminBulkImport(data, env, corsHeaders) {
  const { type, items } = data;

  if (!type || !items || !Array.isArray(items)) {
    return jsonResponse({ error: 'Invalid request: need type and items array' }, 400, corsHeaders);
  }

  let inserted = 0;
  const errors = [];

  try {
    for (const item of items) {
      try {
        if (type === 'courses') {
          await env.DB.prepare(`
            INSERT INTO courses (id, title, icon_class, display_order, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).bind(item.id, item.title, item.icon_class, item.display_order || 0).run();
        } else if (type === 'sections') {
          await env.DB.prepare(`
            INSERT INTO sections (id, course_id, title, display_order)
            VALUES (?, ?, ?, ?)
          `).bind(item.id, item.course_id, item.title, item.display_order || 0).run();
        } else if (type === 'simulations') {
          // Unique slug check for bulk import
          const uniqueSlug = await getUniqueSlug(env, item.slug);

          await env.DB.prepare(`
            INSERT INTO simulations (id, section_id, course_id, slug, title, file_path, has_simulation, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(item.id, item.section_id, item.course_id, uniqueSlug, item.title, item.file_path, item.has_simulation || 0, item.display_order || 0).run();
        }
        inserted++;
      } catch (itemErr) {
        errors.push({ item: item.id, error: itemErr.message });
      }
    }

    // Invalidate all relevant caches
    await env.KV.delete('courses:all');
    await env.KV.delete('recent:all');

    return jsonResponse({ success: true, inserted, errors }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/admin/upload-simulation
 * Upload single simulation file to R2 and create D1 record
 */

/**
 * POST /api/admin/bulk-upload
 * Upload multiple simulation files to R2 and create D1 records
 */
async function handleAdminBulkUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const course_id = formData.get('course_id');
    const section_id = formData.get('section_id');
    const files = formData.getAll('files');

    if (!course_id || !section_id || !files.length) {
      return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
    }

    let uploaded = 0;
    const errors = [];
    const results = [];

    for (const file of files) {
      try {
        // File Validation
        if (file.size > 50 * 1024 * 1024) {
          errors.push({ filename: file.name, error: 'File size exceeds 50MB limit' });
          continue;
        }
        if (!file.name.toLowerCase().endsWith('.html')) {
          errors.push({ filename: file.name, error: 'Only .html files are allowed' });
          continue;
        }

        // Extract title from filename (remove .html extension)
        const filename = file.name;
        const title = filename.replace(/\.html$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const baseSlug = filename.replace(/\.html$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Ensure unique slug
        const slug = await getUniqueSlug(env, baseSlug);

        const id = `sim-${course_id}-${Date.now()}-${uploaded}`;
        const file_path = `simulations/${course_id}/${slug}/index.html`;

        // Upload to R2
        const fileContent = await file.arrayBuffer();
        await env.R2.put(file_path, fileContent, {
          httpMetadata: { contentType: 'text/html' }
        });

        // Insert to D1
        await env.DB.prepare(`
          INSERT INTO simulations (id, section_id, course_id, slug, title, file_path, has_simulation, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, section_id, course_id, slug, title, file_path, 1, uploaded).run();

        results.push({ id, slug, file_path });
        uploaded++;
      } catch (fileErr) {
        errors.push({ filename: file.name, error: fileErr.message });
      }
    }

    // Invalidate caches
    await env.KV.delete(`metadata:${course_id}`);
    await env.KV.delete('recent:all');
    await env.KV.delete('courses:all');

    return jsonResponse({ success: true, uploaded, results, errors }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

// ===== HELPERS =====
async function resequenceGroup(env, table, groupCol, groupVal) {
  // SQL Injection Protection: Whitelist tables
  const allowedTables = ['simulations', 'sections', 'courses', 'categories'];
  if (!allowedTables.includes(table)) {
    throw new Error(`Invalid table for resequencing: ${table}`);
  }

  let query = `SELECT id, display_order FROM ${table} WHERE is_deleted = 0`;
  let params = [];
  if (groupCol) {
    if (!/^[a-zA-Z0-9_]+$/.test(groupCol)) throw new Error('Invalid column name');
    query += ` AND ${groupCol} = ?`;
    params.push(groupVal);
  }
  query += ` ORDER BY display_order ASC, created_at ASC`;

  let results;
  try {
    ({ results } = await env.DB.prepare(query).bind(...params).all());
  } catch (err) {
    if (!err.message.includes('no such column')) throw err;
    // Fallback for tables without is_deleted
    let fallbackQuery = `SELECT id, display_order FROM ${table}`;
    let fallbackParams = [];
    if (groupCol) {
      fallbackQuery += ` WHERE ${groupCol} = ?`;
      fallbackParams.push(groupVal);
    }
    fallbackQuery += ` ORDER BY display_order ASC, created_at ASC`;
    ({ results } = await env.DB.prepare(fallbackQuery).bind(...fallbackParams).all());
  }

  // Batch updates for incorrect orders
  const updates = [];
  for (let i = 0; i < results.length; i++) {
    const correct = i + 1;
    if (results[i].display_order !== correct) {
      updates.push(
        env.DB.prepare(`UPDATE ${table} SET display_order = ? WHERE id = ?`)
          .bind(correct, results[i].id)
      );
    }
  }

  if (updates.length > 0) {
    await env.DB.batch(updates);
  }
}


async function handleAdminDeleteCourse(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const course = await env.DB.prepare('SELECT display_order, category FROM courses WHERE id = ?').bind(id).first();
    if (!course) return jsonResponse({ error: 'Course not found' }, 404, corsHeaders);

    try {
      await env.DB.prepare(
        'UPDATE courses SET is_deleted = 1, deleted_at = datetime(\'now\') WHERE id = ?'
      ).bind(id).run();
    } catch (err) {
      if (!err.message.includes('no such column')) throw err;
      await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
    }

    // If this was a parent, orphan its extensions (make them standalone)
    try {
      await env.DB.prepare('UPDATE courses SET parent_course_id = NULL WHERE parent_course_id = ?').bind(id).run();
    } catch (_) {}

    // Resequence group
    if (course.category) {
      await resequenceGroup(env, 'courses', 'category', course.category);
    } else {
      await resequenceGroup(env, 'courses', 'category', 'skill');
    }

    await env.KV.delete('courses:all');
    await env.KV.delete(`metadata:${id}`);
    return jsonResponse({ success: true, message: 'Course moved to recycle bin' }, 200, corsHeaders);
  } catch (err) {
    console.error('Delete course error:', err);
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminRestoreCourse(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const course = await env.DB.prepare(
      'SELECT id, is_deleted, category FROM courses WHERE id = ?'
    ).bind(id).first();

    if (!course) return jsonResponse({ error: 'Course not found' }, 404, corsHeaders);
    if (course.is_deleted === 0) return jsonResponse({ error: 'Course is not deleted' }, 400, corsHeaders);

    await env.DB.prepare(
      'UPDATE courses SET is_deleted = 0, deleted_at = NULL, display_order = 9999 WHERE id = ?'
    ).bind(id).run();

    // Resequence to fix order
    await resequenceGroup(env, 'courses', 'category', course.category);

    await env.KV.delete('courses:all');
    await env.KV.delete(`metadata:${id}`);
    return jsonResponse({ success: true, message: 'Course restored' }, 200, corsHeaders);
  } catch (err) {
    console.error('Restore course error:', err);
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminPermanentDeleteCourse(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();

    await env.KV.delete('courses:all');
    await env.KV.delete(`metadata:${id}`);
    return jsonResponse({ success: true, message: 'Course permanently deleted' }, 200, corsHeaders);
  } catch (err) {
    console.error('Permanent delete error:', err);
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleGetDeletedCourses(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, title, icon_class, category, display_order, deleted_at
      FROM courses
      WHERE is_deleted = 1
      ORDER BY deleted_at DESC
    `).all();

    return jsonResponse({ courses: results, total: results.length }, 200, corsHeaders);
  } catch (err) {
    console.error('Get deleted courses error:', err);
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminUpdateCourse(data, env, corsHeaders) {
  const { id, title, icon_class, category, display_order, parent_course_id = null } = data;
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    await env.DB.prepare(
      'UPDATE courses SET title = ?, icon_class = ?, category = ?, display_order = ?, parent_course_id = ? WHERE id = ?'
    ).bind(title, icon_class, category, display_order, parent_course_id || null, id).run();

    await env.KV.delete('courses:all');
    await env.KV.delete(`metadata:${id}`);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    if (err.message && err.message.includes('no such column')) {
      await env.DB.prepare(
        'UPDATE courses SET title = ?, icon_class = ?, category = ?, display_order = ? WHERE id = ?'
      ).bind(title, icon_class, category, display_order, id).run();
      await env.KV.delete('courses:all');
      return jsonResponse({ success: true, warning: 'parent_course_id not saved' }, 200, corsHeaders);
    }
    console.error('Update course error:', err);
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminDeleteSection(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    // Get course_id for cache invalidation
    const section = await env.DB.prepare('SELECT course_id, display_order FROM sections WHERE id = ?').bind(id).first();
    if (!section) return jsonResponse({ error: 'Section not found' }, 404, corsHeaders);

    try {
      await env.DB.prepare('UPDATE sections SET is_deleted = 1, deleted_at = (unixepoch()) WHERE id = ?').bind(id).run();
    } catch (err) {
      if (!err.message.includes('no such column')) throw err;
      await env.DB.prepare('DELETE FROM sections WHERE id = ?').bind(id).run();
    }

    await resequenceGroup(env, 'sections', 'course_id', section.course_id);

    await env.KV.delete(`metadata:${section.course_id}`);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleMigrateSectionsTable(env, corsHeaders) {
  try {
    try {
      await env.DB.prepare('ALTER TABLE sections ADD COLUMN is_deleted INTEGER DEFAULT 0').run();
    } catch (e) { /* ignore */ }
    try {
      await env.DB.prepare('ALTER TABLE sections ADD COLUMN deleted_at INTEGER').run();
    } catch (e) { /* ignore */ }
    return jsonResponse({ success: true, message: 'Sections table migrated' }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleGetDeletedSections(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT s.*, c.title as course_title 
      FROM sections s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.is_deleted = 1 
      ORDER BY s.deleted_at DESC
    `).all();
    return jsonResponse({ sections: results, count: results.length }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminRestoreSection(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const section = await env.DB.prepare('SELECT course_id FROM sections WHERE id = ?').bind(id).first();
    if (!section) return jsonResponse({ error: 'Section not found' }, 404, corsHeaders);

    await env.DB.prepare('UPDATE sections SET is_deleted = 0, deleted_at = NULL, display_order = 9999 WHERE id = ?').bind(id).run();
    await resequenceGroup(env, 'sections', 'course_id', section.course_id);

    await env.KV.delete(`metadata:${section.course_id}`);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminPermanentDeleteSection(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const section = await env.DB.prepare('SELECT course_id FROM sections WHERE id = ?').bind(id).first();
    await env.DB.prepare('DELETE FROM sections WHERE id = ?').bind(id).run();
    if (section) await env.KV.delete(`metadata:${section.course_id}`);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminReorderSections(data, env, corsHeaders) {
  if (!Array.isArray(data)) return jsonResponse({ error: 'Expected array' }, 400, corsHeaders);
  try {
    const stmt = env.DB.prepare('UPDATE sections SET display_order = ? WHERE id = ?');
    const batch = data.map(item => stmt.bind(item.display_order, item.id));
    await env.DB.batch(batch);

    // Invalidate cache for the course(s) involved
    // Ideally pass course_id in payload or fetch it. For now, we might rely on UI reload or aggressive cache clearing.
    // Optimization: find unique course_ids
    // For simplicity, we won't batch invalidate here unless critical. The UI usually reloads.
    // Actually, let's try to invalidate if course_id is provided in payload item
    const courseIds = [...new Set(data.map(i => i.course_id).filter(Boolean))];
    for (const cid of courseIds) {
      await env.KV.delete(`metadata:${cid}`);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminReorderSimulations(data, env, corsHeaders) {
  if (!Array.isArray(data)) return jsonResponse({ error: 'Expected array' }, 400, corsHeaders);
  try {
    const stmt = env.DB.prepare('UPDATE simulations SET display_order = ? WHERE id = ?');
    const batch = data.map(item => stmt.bind(item.display_order, item.id));
    await env.DB.batch(batch);

    const courseIds = [...new Set(data.map(i => i.course_id).filter(Boolean))];
    for (const cid of courseIds) {
      await env.KV.delete(`metadata:${cid}`);
      // Bust Cloudflare edge cache for the course page
      try {
        const cacheUrl = `https://www.gradstudio.org/api/courses/${cid}`;
        await caches.default.delete(new Request(cacheUrl));
      } catch (_) {}
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }

}

async function handleAdminAddSection(data, env, corsHeaders) {
  const { course_id, title, display_order } = data;

  if (!course_id || !title) {
    return jsonResponse({ error: 'Missing required fields: course_id, title' }, 400, corsHeaders);
  }

  try {
    // Generate section ID: section-{courseId}-{timestamp}
    const sectionId = `section-${course_id}-${Date.now()}`;

    // Use provided display_order or default to 1
    const order = display_order !== undefined ? display_order : 1;

    await env.DB.prepare(
      'INSERT INTO sections (id, course_id, title, display_order, is_deleted) VALUES (?, ?, ?, ?, 0)'
    ).bind(sectionId, course_id, title, order).run();

    // Invalidate course cache
    await env.KV.delete(`metadata:${course_id}`);

    return jsonResponse({ success: true, id: sectionId }, 200, corsHeaders);
  } catch (err) {
    console.error('Add section error:', err);
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminUpdateSection(data, env, corsHeaders) {
  const { id, title, display_order } = data;
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const section = await env.DB.prepare('SELECT course_id FROM sections WHERE id = ?').bind(id).first();
    if (!section) return jsonResponse({ error: 'Section not found' }, 404, corsHeaders);

    await env.DB.prepare('UPDATE sections SET title = ?, display_order = ? WHERE id = ?')
      .bind(title, display_order, id).run();

    await env.KV.delete(`metadata:${section.course_id}`);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminDeleteSimulation(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const sim = await env.DB.prepare('SELECT course_id, section_id, display_order FROM simulations WHERE id = ?').bind(id).first();
    if (!sim) return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);

    try {
      await env.DB.prepare('UPDATE simulations SET is_deleted = 1, deleted_at = (unixepoch()) WHERE id = ?').bind(id).run();
    } catch (err) {
      if (!err.message.includes('no such column')) throw err;
      await env.DB.prepare('DELETE FROM simulations WHERE id = ?').bind(id).run();
    }

    await resequenceGroup(env, 'simulations', 'section_id', sim.section_id);

    await env.KV.delete(`metadata:${sim.course_id}`);
    await env.KV.delete('recent:all');
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminUpdateSimulation(data, env, corsHeaders) {
  const { id, title } = data;
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);

  try {
    const sim = await env.DB.prepare('SELECT course_id, section_id, display_order FROM simulations WHERE id = ?').bind(id).first();
    if (!sim) return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);

    // If only title update (no reorder)
    if (data.display_order === undefined) {
      await env.DB.prepare('UPDATE simulations SET title = ? WHERE id = ?').bind(title, id).run();
    } else {
      // Manual Reorder: Remove -> Insert Model
      const newOrderInput = parseInt(data.display_order);
      const sectionId = sim.section_id;

      // 1. Fetch all siblings (including self) sorted by current order
      const { results } = await env.DB.prepare(
        'SELECT id, display_order FROM simulations WHERE section_id = ? AND is_deleted = 0 ORDER BY display_order ASC, created_at ASC'
      ).bind(sectionId).all();

      // 2. Remove target from list
      const siblings = results.filter(s => s.id !== id);

      // 3. Clamp newOrder
      // newOrder is 1-based index from UI.
      // Valid range is 1 to (siblings.length + 1)
      let newIndx = newOrderInput;
      if (newIndx < 1) newIndx = 1;
      if (newIndx > siblings.length + 1) newIndx = siblings.length + 1;

      // 4. Insert target at new index (convert 1-based order to 0-based array index)
      // Array index = newIndx - 1
      const targetItem = { id, display_order: newIndx }; // placeholder
      siblings.splice(newIndx - 1, 0, targetItem);

      // 5. Upgrade Title & Batch Update Order
      const updates = [];

      // Update title and order for target
      updates.push(
        env.DB.prepare('UPDATE simulations SET title = ?, display_order = ? WHERE id = ?')
          .bind(title, newIndx, id)
      );

      // Update order for everyone else if changed
      for (let i = 0; i < siblings.length; i++) {
        const item = siblings[i];
        const correctOrder = i + 1;
        if (item.id !== id) {
          // We only need to update if order changed, but doing all ensures consistency.
          // Optimization logic
          if (item.display_order !== correctOrder) {
            updates.push(
              env.DB.prepare('UPDATE simulations SET display_order = ? WHERE id = ?')
                .bind(correctOrder, item.id)
            );
          }
        }
      }

      // 6. Execute Batch
      if (updates.length > 0) {
        await env.DB.batch(updates);
      }
    }

    // INVALIDATE CACHE
    await env.KV.delete(`metadata:${sim.course_id}`);
    await env.KV.delete('recent:all');

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

// ===== CATEGORY HANDLERS =====

async function handleGetAllCategories(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM categories WHERE is_deleted = 0 ORDER BY display_order, name').all();
    return jsonResponse({ categories: results, count: results.length }, 200, corsHeaders);
  } catch (err) {
    if (err.message.includes('no such table')) {
      return jsonResponse({ categories: [], count: 0 }, 200, corsHeaders);
    }
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleMigrateSimulationsTable(env, corsHeaders) {
  try {
    try {
      await env.DB.prepare('ALTER TABLE simulations ADD COLUMN is_deleted INTEGER DEFAULT 0').run();
    } catch (e) { /* ignore */ }

    try {
      await env.DB.prepare('ALTER TABLE simulations ADD COLUMN deleted_at INTEGER').run();
    } catch (e) { /* ignore */ }

    return jsonResponse({ success: true, message: 'Simulations table migrated' }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleGetDeletedSimulations(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, title, slug, file_path, course_id, section_id, deleted_at
      FROM simulations
      WHERE is_deleted = 1
      ORDER BY deleted_at DESC
    `).all();
    return jsonResponse({ simulations: results, count: results.length }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminRestoreSimulation(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const sim = await env.DB.prepare('SELECT course_id, section_id FROM simulations WHERE id = ?').bind(id).first();
    if (!sim) return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);

    await env.DB.prepare('UPDATE simulations SET is_deleted = 0, deleted_at = NULL, display_order = 9999 WHERE id = ?').bind(id).run();
    await resequenceGroup(env, 'simulations', 'section_id', sim.section_id);

    await env.KV.delete(`metadata:${sim.course_id}`);
    await env.KV.delete('recent:all');
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminPermanentDeleteSimulation(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const sim = await env.DB.prepare('SELECT course_id FROM simulations WHERE id = ?').bind(id).first();
    if (!sim) return jsonResponse({ success: true }, 200, corsHeaders);

    await env.DB.prepare('DELETE FROM simulations WHERE id = ?').bind(id).run();

    await env.KV.delete(`metadata:${sim.course_id}`);
    await env.KV.delete('recent:all');
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminAddCategory(data, env, corsHeaders) {
  const { id, name, display_order = 0 } = data;
  if (!id || !name) return jsonResponse({ error: 'Missing id or name' }, 400, corsHeaders);

  const safeId = id.toLowerCase();
  if (safeId !== id) return jsonResponse({ error: 'ID must be lowercase' }, 400, corsHeaders);

  try {
    await env.DB.prepare('INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)').bind(safeId, name, display_order).run();
    return jsonResponse({ success: true, id: safeId }, 201, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminUpdateCategory(data, env, corsHeaders) {
  const { id, name, display_order } = data;
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    await env.DB.prepare('UPDATE categories SET name = ?, display_order = ? WHERE id = ?').bind(name, display_order, id).run();
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminDeleteCategory(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    const cat = await env.DB.prepare('SELECT display_order FROM categories WHERE id = ?').bind(id).first();
    if (!cat) return jsonResponse({ error: 'Category not found' }, 404, corsHeaders);

    try {
      await env.DB.prepare('UPDATE categories SET is_deleted = 1, deleted_at = (unixepoch()) WHERE id = ?').bind(id).run();
    } catch (err) {
      if (!err.message.includes('no such column')) throw err;
      await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    }

    await resequenceGroup(env, 'categories', null, null);

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleGetDeletedCategories(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM categories WHERE is_deleted = 1 ORDER BY deleted_at DESC').all();
    return jsonResponse({ categories: results, count: results.length }, 200, corsHeaders);
  } catch (err) {
    if (err.message.includes('no such column')) {
      return jsonResponse({ categories: [], count: 0, error: 'Migration needed' }, 200, corsHeaders);
    }
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminRestoreCategory(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    await env.DB.prepare('UPDATE categories SET is_deleted = 0, deleted_at = NULL, display_order = 9999 WHERE id = ?').bind(id).run();
    await resequenceGroup(env, 'categories', null, null);

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminPermanentDeleteCategory(id, env, corsHeaders) {
  if (!id) return jsonResponse({ error: 'Missing id' }, 400, corsHeaders);
  try {
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminReorderCategories(data, env, corsHeaders) {
  if (!Array.isArray(data)) return jsonResponse({ error: 'Expected array' }, 400, corsHeaders);
  try {
    const stmt = env.DB.prepare('UPDATE categories SET display_order = ? WHERE id = ?');
    const batch = data.map(item => stmt.bind(item.display_order, item.id));
    await env.DB.batch(batch);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminReorderCourses(data, env, corsHeaders) {
  if (!Array.isArray(data)) return jsonResponse({ error: 'Expected array' }, 400, corsHeaders);
  try {
    const stmt = env.DB.prepare('UPDATE courses SET display_order = ? WHERE id = ?');
    const batch = data.map(item => stmt.bind(item.display_order, item.id));
    await env.DB.batch(batch);
    await env.KV.delete('courses:all');
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleAdminBulkImportAction(data, env, corsHeaders) {
  const { type, items } = data;

  if (!type || !items || !Array.isArray(items)) {
    return jsonResponse({ error: 'Invalid payload: details type and items array required' }, 400, corsHeaders);
  }

  const validTypes = ['courses', 'sections', 'simulations'];
  if (!validTypes.includes(type)) {
    return jsonResponse({ error: 'Invalid type. Must be courses, sections, or simulations' }, 400, corsHeaders);
  }

  if (items.length === 0) {
    return jsonResponse({ success: true, inserted: 0 }, 200, corsHeaders);
  }

  const stmts = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const idx = i + 1; // 1-based index for error reporting

    // Common Validation: display_order
    if (item.display_order === undefined || item.display_order === null) {
      errors.push(`Item ${idx}: Missing display_order`);
      continue;
    }
    if (!Number.isInteger(item.display_order) || item.display_order < 1) {
      errors.push(`Item ${idx}: display_order must be integer >= 1`);
      continue;
    }

    try {
      if (type === 'courses') {
        // Required: id, title, icon_class, category
        if (!item.id || !item.title || !item.icon_class || !item.category) {
          errors.push(`Item ${idx}: Missing required fields (id, title, icon_class, category)`);
          continue;
        }
        stmts.push(
          env.DB.prepare('INSERT INTO courses (id, title, icon_class, category, display_order, is_deleted) VALUES (?, ?, ?, ?, ?, 0)')
            .bind(item.id, item.title, item.icon_class, item.category, item.display_order)
        );

      } else if (type === 'sections') {
        // Required: id, course_id, title
        if (!item.id || !item.course_id || !item.title) {
          errors.push(`Item ${idx}: Missing required fields (id, course_id, title)`);
          continue;
        }
        stmts.push(
          env.DB.prepare('INSERT INTO sections (id, course_id, title, display_order, is_deleted) VALUES (?, ?, ?, ?, 0)')
            .bind(item.id, item.course_id, item.title, item.display_order)
        );

      } else if (type === 'simulations') {
        // Required: course_id, section_id, title, slug, link, has_simulation
        if (!item.course_id || !item.section_id || !item.title || !item.slug || !item.link || item.has_simulation === undefined) {
          errors.push(`Item ${idx}: Missing required fields`);
          continue;
        }
        stmts.push(
          env.DB.prepare('INSERT INTO simulations (course_id, section_id, title, slug, link, has_simulation, display_order, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
            .bind(item.course_id, item.section_id, item.title, item.slug, item.link, item.has_simulation, item.display_order)
        );
      }
    } catch (e) {
      errors.push(`Item ${idx}: Prep failed - ${e.message}`);
    }
  }

  if (errors.length > 0) {
    return jsonResponse({ error: `Validation Failed: ${errors.join('; ')}` }, 400, corsHeaders);
  }

  try {
    await env.DB.batch(stmts);

    // Invalidate Caches
    await env.KV.delete('courses:all');
    if (type === 'courses') { /* nothing specific */ }
    if (type === 'sections') { /* nothing specific */ }
    if (type === 'simulations') { await env.KV.delete('recent:all'); }

    // No automatic resequencing unless specifically requested or duplication logic added.
    // User instruction: "ONLY then call resequenceGroup IF duplicates exist"
    // Since we are doing a bulk import, we assume the user provides correct unique orders.
    // We will skip resequencing to strictly follow "No post-insert reshuffling unless duplicates exist"
    // If we wanted to check duplicates, we'd need a read-after-write or a complex constraint check.
    // For now, let's trust the input as per strict contract.

    return jsonResponse({ success: true, inserted: stmts.length }, 200, corsHeaders);

  } catch (err) {
    return jsonResponse({ error: `Batch Insert Failed: ${err.message}` }, 500, corsHeaders);
  }
}

async function handleMigrateCategoriesTable(env, corsHeaders) {
  try {
    try {
      await env.DB.prepare('ALTER TABLE categories ADD COLUMN is_deleted INTEGER DEFAULT 0').run();
    } catch (e) { /* ignore */ }
    try {
      await env.DB.prepare('ALTER TABLE categories ADD COLUMN deleted_at INTEGER').run();
    } catch (e) { /* ignore */ }
    return jsonResponse({ success: true, message: 'Categories table migrated' }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleSetupCategoriesTable(env, corsHeaders) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        deleted_at INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `).run();

    await env.DB.prepare(`
      INSERT OR IGNORE INTO categories (id, name)
      SELECT DISTINCT category, 
        CASE 
          WHEN category = 'role' THEN 'Role Based' 
          WHEN category = 'skill' THEN 'Skill Based' 
          ELSE UPPER(SUBSTR(category, 1, 1)) || SUBSTR(category, 2) 
        END 
      FROM courses WHERE category IS NOT NULL
    `).run();

    return jsonResponse({ success: true, message: 'Categories table created and backfilled' }, 200, corsHeaders);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

// ===== COMMENT HANDLERS =====

/**
 * GET /api/comments/:simId
 * Get all comments for a simulation
 */
async function handleGetComments(simId, env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        c.id,
        c.simulation_id,
        c.user_id,
        c.author_name,
        c.text,
        c.upvotes,
        c.created_at,
        COALESCE(u.display_name, u.email, c.author_name, 'Anonymous') AS display_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.simulation_id = ?
      ORDER BY c.created_at DESC
    `).bind(simId).all();

    return jsonResponse({ comments: results || [] }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/comments/:simId
 * Post a new comment
 */
async function handlePostComment(simId, data, request, env, corsHeaders) {
  try {
    const auth = await requireAuthUser(request, env, corsHeaders);
    if (auth.error) return auth.error;

    const { text } = data;

    if (!text || !text.trim()) {
      return jsonResponse({ error: 'Comment text is required' }, 400, corsHeaders);
    }

    const userRow = await env.DB.prepare(
      'SELECT id, display_name, email FROM users WHERE id = ?'
    ).bind(auth.userId).first();

    if (!userRow?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const recent = await env.DB.prepare(`
      SELECT 1
      FROM comments
      WHERE simulation_id = ?
        AND user_id = ?
        AND created_at >= datetime('now','-1 minute')
      LIMIT 1
    `).bind(simId, auth.userId).first();

    if (recent) {
      return jsonResponse({ error: 'Please wait before posting another comment' }, 429, corsHeaders);
    }

    const displayName = userRow.display_name || userRow.email || 'User';

    const result = await env.DB.prepare(`
      INSERT INTO comments (simulation_id, user_id, author_name, text, upvotes, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `).bind(simId, auth.userId, displayName.trim(), text.trim()).run();

    const comment = await env.DB.prepare(`
      SELECT
        c.id,
        c.simulation_id,
        c.user_id,
        c.author_name,
        c.text,
        c.upvotes,
        c.created_at,
        COALESCE(u.display_name, u.email, c.author_name, 'Anonymous') AS display_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first();

    return jsonResponse({ comment }, 201, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/comments/:commentId/upvote
 * Upvote a comment
 */
async function handleUpvoteComment(commentId, request, env, corsHeaders) {
  try {
    const auth = await requireAuthUser(request, env, corsHeaders);
    if (auth.error) return auth.error;

    const comment = await env.DB.prepare(
      'SELECT id, upvotes FROM comments WHERE id = ?'
    ).bind(commentId).first();

    if (!comment?.id) {
      return jsonResponse({ error: 'Comment not found' }, 404, corsHeaders);
    }

    const existing = await env.DB.prepare(
      'SELECT 1 as has_like FROM comment_likes WHERE comment_id = ? AND user_id = ?'
    ).bind(commentId, auth.userId).first();

    let liked = false;
    if (existing) {
      await env.DB.prepare(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?'
      ).bind(commentId, auth.userId).run();

      await env.DB.prepare(`
        UPDATE comments
        SET upvotes = CASE WHEN upvotes > 0 THEN upvotes - 1 ELSE 0 END
        WHERE id = ?
      `).bind(commentId).run();
      liked = false;
    } else {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO comment_likes (comment_id, user_id) VALUES (?, ?)'
      ).bind(commentId, auth.userId).run();

      await env.DB.prepare(`
        UPDATE comments
        SET upvotes = upvotes + 1
        WHERE id = ?
      `).bind(commentId).run();
      liked = true;
    }

    const updated = await env.DB.prepare(
      'SELECT upvotes FROM comments WHERE id = ?'
    ).bind(commentId).first();

    return jsonResponse({ upvotes: updated?.upvotes || 0, liked }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

// ===== BOOKMARK HANDLERS =====

/**
 * GET /api/bookmarks
 * List bookmarks for the authenticated user
 */
async function handleGetBookmarks(request, env, corsHeaders) {
  try {
    const auth = await requireAuthUser(request, env, corsHeaders);
    if (auth.error) return auth.error;

    const { results } = await env.DB.prepare(`
      SELECT
        b.simulation_id,
        b.created_at as bookmarked_at,
        sim.title,
        sim.slug,
        sim.course_id,
        sim.file_path,
        sim.upload_date,
        sec.title as section_title,
        c.title as course_title,
        c.icon_class,
        COALESCE(st.views, 0) as views,
        COALESCE(st.likes, 0) as likes,
        COALESCE(st.dislikes, 0) as dislikes,
        COALESCE(st.reports, 0) as reports
      FROM simulation_bookmarks b
      JOIN simulations sim ON sim.id = b.simulation_id
      LEFT JOIN sections sec ON sec.id = sim.section_id
      LEFT JOIN courses c ON c.id = sim.course_id
      LEFT JOIN statistics st ON st.simulation_id = sim.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).bind(auth.userId).all();

    return jsonResponse({ bookmarks: results || [] }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/bookmarks/:simId
 * Toggle bookmark for the authenticated user
 */
async function handleToggleBookmark(simId, request, env, corsHeaders) {
  try {
    const auth = await requireAuthUser(request, env, corsHeaders);
    if (auth.error) return auth.error;

    const sim = await env.DB.prepare(
      'SELECT id FROM simulations WHERE id = ?'
    ).bind(simId).first();

    if (!sim?.id) {
      return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);
    }

    const deleteResult = await env.DB.prepare(
      'DELETE FROM simulation_bookmarks WHERE simulation_id = ? AND user_id = ?'
    ).bind(simId, auth.userId).run();

    const deleteChanges = Number(deleteResult?.meta?.changes ?? deleteResult?.changes ?? 0);

    let bookmarked = false;
    if (deleteChanges > 0) {
      bookmarked = false;
    } else {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO simulation_bookmarks (simulation_id, user_id) VALUES (?, ?)'
      ).bind(simId, auth.userId).run();

      const stillExists = await env.DB.prepare(
        'SELECT 1 as has_bookmark FROM simulation_bookmarks WHERE simulation_id = ? AND user_id = ?'
      ).bind(simId, auth.userId).first();
      bookmarked = Boolean(stillExists);
    }

    return jsonResponse({ simId, bookmarked }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/dislikes/:simId
 * Toggles dislike using D1 with uniqueness constraints
 */
async function handleToggleDislike(simId, request, env, corsHeaders) {
  try {
    const identity = await resolveUserIdentity(request, env);
    const userId = identity.userId;

    const sim = await env.DB.prepare('SELECT course_id FROM simulations WHERE id = ?').bind(simId).first();
    if (!sim) return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);

    // Ensure anonymous user exists to satisfy FK
    if (identity.isAnon) {
      await env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, display_name, is_active)
        VALUES (?, ?, ?, 'Anonymous', 1)
        ON CONFLICT(id) DO NOTHING
      `).bind(userId, identity.email, '').run();
    }

    const insertResult = await env.DB.prepare(`
      INSERT INTO simulation_dislikes (simulation_id, user_id)
      VALUES (?, ?)
      ON CONFLICT(simulation_id, user_id) DO NOTHING
      RETURNING 1 as inserted
    `).bind(simId, userId).all();

    let disliked = false;

    if (insertResult.results?.length) {
      disliked = true;
      // Enforce mutual exclusivity: remove like
      await env.DB.prepare(`
        DELETE FROM simulation_likes
        WHERE simulation_id = ? AND user_id = ?
      `).bind(simId, userId).run();
    } else {
      const deleteResult = await env.DB.prepare(`
        DELETE FROM simulation_dislikes
        WHERE simulation_id = ? AND user_id = ?
        RETURNING 1 as deleted
      `).bind(simId, userId).all();
      disliked = false;

      if (!deleteResult.results?.length) {
        disliked = false;
      }
    }

    await env.DB.prepare(`
        INSERT INTO statistics (simulation_id, views, likes, dislikes, reports, last_synced_at)
      VALUES (
        ?,
        0,
        (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?),
        (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?),
          (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
        datetime('now')
      )
      ON CONFLICT(simulation_id) DO UPDATE SET
        likes = (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?),
        dislikes = (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?),
          reports = (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
        last_synced_at = datetime('now')
      `).bind(simId, simId, simId, simId, simId, simId, simId).run();

    const { results } = await env.DB.prepare(
      `SELECT 
         (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?) as likes,
         (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?) as dislikes
      `
    ).bind(simId, simId).all();

    const likes = results?.[0]?.likes ?? 0;
    const dislikes = results?.[0]?.dislikes ?? 0;

    await env.KV.delete(`metadata:${sim.course_id}`);

    return jsonResponse({ disliked, likes, dislikes }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

/**
 * POST /api/reports/:simId
 * Toggle report for a simulation per user
 */
async function handleReportSimulation(simId, request, env, corsHeaders) {
  const auth = await requireAuthUser(request, env, corsHeaders);
  if (auth.error) return auth.error;

  const sim = await env.DB.prepare('SELECT course_id FROM simulations WHERE id = ?').bind(simId).first();
  if (!sim) return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);

  let reported = false;
  const deleteResult = await env.DB.prepare(
    'DELETE FROM simulation_reports WHERE simulation_id = ? AND user_id = ?'
  ).bind(simId, auth.userId).run();

  const deleteChanges = Number(deleteResult?.meta?.changes ?? deleteResult?.changes ?? 0);

  if (deleteChanges > 0) {
    reported = false;
  } else {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO simulation_reports (simulation_id, user_id) VALUES (?, ?)'
    ).bind(simId, auth.userId).run();

    const stillExists = await env.DB.prepare(
      'SELECT 1 as has_report FROM simulation_reports WHERE simulation_id = ? AND user_id = ?'
    ).bind(simId, auth.userId).first();
    reported = Boolean(stillExists);
  }

  await env.DB.prepare(`
    INSERT INTO statistics (simulation_id, views, likes, dislikes, reports, last_synced_at)
    VALUES (
      ?,
      0,
      (SELECT COUNT(*) FROM simulation_likes WHERE simulation_id = ?),
      (SELECT COUNT(*) FROM simulation_dislikes WHERE simulation_id = ?),
      (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
      datetime('now')
    )
    ON CONFLICT(simulation_id) DO UPDATE SET
      reports = (SELECT COUNT(*) FROM simulation_reports WHERE simulation_id = ?),
      last_synced_at = datetime('now')
  `).bind(simId, simId, simId, simId, simId).run();

  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) as reports FROM simulation_reports WHERE simulation_id = ?'
  ).bind(simId).first();

  await env.KV.delete(`metadata:${sim.course_id}`);

  return jsonResponse({
    simId,
    reported,
    reports: countRow?.reports ?? 0
  }, 200, corsHeaders);
}

// ===== FILE AUDIT LOGGING =====

async function handleSetupFileAuditTable(env, corsHeaders) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS file_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL, 
        file_key TEXT NOT NULL,
        user_id TEXT,
        user_email TEXT,
        metadata TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `).run();
    return jsonResponse({ success: true, message: 'File audit log table created' }, 200, corsHeaders);
  } catch (err) {
    return handleError(err, env);
  }
}

async function logFileAction(env, action, fileKey, user, metadata = {}) {
  try {
    await env.DB.prepare(`
      INSERT INTO file_audit_log (action, file_key, user_id, user_email, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      action,
      fileKey,
      user?.userId || 'system',
      user?.email || 'unknown',
      JSON.stringify(metadata)
    ).run();
  } catch (e) {
    console.error('Audit Log Error:', e);
  }
}

// ===== AUTH HANDLERS =====

const GOOGLE_CLIENT_ID = 'XXXX';
const GOOGLE_REDIRECT_URI = 'http://localhost:8787/api/auth/google/callback';

// Relocated to fetch handler

// ... (existing code)

async function handleMigrateUsersRole(env, corsHeaders) {
  try {
    try {
      await env.DB.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
    } catch (e) { /* ignore if exists */ }

    // Set first user as admin if needed (optional, or manual)
    // For now just ensuring column exists is enough.

    return jsonResponse({ success: true, message: 'Users table migrated with role column' }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAuthRegister(data, env, corsHeaders) {
  const email = (data?.email || '').toLowerCase().trim();
  const password = data?.password || '';
  const displayName = (data?.display_name || '').trim() || null;

  if (!email || !password) return jsonResponse({ error: 'Email and password are required' }, 400, corsHeaders);
  if (!isValidEmail(email)) return jsonResponse({ error: 'Invalid email format' }, 400, corsHeaders);
  if (!isValidPassword(password)) return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
  if (displayName && !isValidDisplayName(displayName)) return jsonResponse({ error: 'Display name contains invalid characters' }, 400, corsHeaders);

  try {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return jsonResponse({ error: 'Email already registered' }, 409, corsHeaders);

    const userId = `user_${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(password);
    const role = 'user'; // Default role

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, display_name, is_active, role) VALUES (?, ?, ?, ?, 1, ?)'
    ).bind(userId, email, passwordHash, displayName, role).run();

    await env.DB.prepare(
      'INSERT INTO user_access (user_id, has_full_access, unlocked_at) VALUES (?, 1, datetime(\'now\')) ON CONFLICT(user_id) DO UPDATE SET has_full_access = 1, unlocked_at = datetime(\'now\')'
    ).bind(userId).run();

    // JWT Generation
    const { accessToken, refreshToken, jti } = await generateTokens({ id: userId, email, role }, env);

    // Store Refresh Token in KV
    await env.REFRESH_TOKENS.put(`refresh:${userId}:${jti}`, JSON.stringify({
      token: refreshToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    const headers = {
      ...corsHeaders,
      'Set-Cookie': createRefreshCookie(refreshToken)
    };

    // Log Security Event (non-blocking, no ctx available here)
    logSecurityEvent(env, null, 'register', {
      userId,
      email,
      ip: 'unknown',
      role
    }).catch(() => { });

    return jsonResponse({
      accessToken,
      user: { id: userId, email, display_name: displayName, role },
      hasFullAccess: true
    }, 201, headers);

  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAuthLogin(data, env, corsHeaders, ip) {
  const email = (data?.email || '').toLowerCase().trim();
  const password = data?.password || '';

  if (!email || !password) return jsonResponse({ error: 'Email and password are required' }, 400, corsHeaders);

  // Check Rate Limit / Lockout
  const { allowed, error } = await trackFailedLogin(env, ip, email);
  if (!allowed) {
    await logSecurityEvent(env, null, 'account_locked', { email, ip, reason: 'too_many_attempts' });
    return jsonResponse({
      error: {
        code: AuthError.ACCOUNT_LOCKED,
        message: error
      }
    }, 429, corsHeaders);
  }

  try {
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, display_name, role FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    const isPasswordValid = user && await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      await recordLoginFailure(env, ip, email);
      await logSecurityEvent(env, null, 'login_fail', { email, ip, reason: 'invalid_credentials' });
      // Determine if we should warn about attempts left? For security, generic message is better.
      // But user experience might prefer "Invalid credentials".
      return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
    }

    // Hash Migration: Upgrade legacy SHA-256 hashes to PBKDF2
    if (!user.password_hash.startsWith('pbkdf2:')) {
      try {
        const newHash = await hashPassword(password);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
        console.log(`Migrated password hash for user ${user.id}`);
      } catch (e) {
        console.error('Failed to migrate password hash', e);
      }
    }

    // Reset failures on success
    await resetLoginFailures(env, ip, email);

    // JWT Generation
    const { accessToken, refreshToken, jti } = await generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    }, env);

    // Store Refresh Token in KV
    await env.REFRESH_TOKENS.put(`refresh:${user.id}:${jti}`, JSON.stringify({
      token: refreshToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    const headers = {
      ...corsHeaders,
      'Set-Cookie': createRefreshCookie(refreshToken)
    };

    // Log Success
    await logSecurityEvent(env, null, 'login_success', {
      userId: user.id,
      email: user.email,
      ip,
      role: user.role
    });

    return jsonResponse({
      accessToken,
      user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role },
      hasFullAccess: true
    }, 200, headers);

  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAuthMe(request, env, corsHeaders) {
  const { user, error } = await getUserFromRequest(request, env);
  if (error || !user) return jsonResponse({ error: AuthError.UNAUTHORIZED }, 401, corsHeaders);

  // Fetch latest details
  const dbUser = await env.DB.prepare('SELECT display_name FROM users WHERE id = ?').bind(user.userId).first();

  return jsonResponse({
    user: { id: user.userId, email: user.email, display_name: dbUser?.display_name, role: user.role },
    hasFullAccess: true
  }, 200, corsHeaders);
}

async function handleAuthRefresh(request, env, corsHeaders) {
  const cookieHeader = request.headers.get('Cookie');
  let refreshToken = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));
    if (refreshCookie) {
      refreshToken = refreshCookie.split('=')[1];
    }
  }

  if (!refreshToken) {
    return jsonResponse({ error: AuthError.TOKEN_MISSING }, 401, corsHeaders);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken, env);
    const { userId, jti } = payload;
    const kvKey = `refresh:${userId}:${jti}`;

    const stored = await env.REFRESH_TOKENS.get(kvKey, { type: 'json' });

    if (!stored || stored.token !== refreshToken) {
      return jsonResponse({ error: AuthError.REFRESH_TOKEN_INVALID }, 403, corsHeaders);
    }

    const user = await env.DB.prepare('SELECT id, email, role FROM users WHERE id = ?').bind(userId).first();
    if (!user) return jsonResponse({ error: 'User not found' }, 403, corsHeaders);

    const { accessToken: newAccess, refreshToken: newRefresh, jti: newJti } = await generateTokens({ id: user.id, email: user.email, role: user.role }, env);

    await env.REFRESH_TOKENS.delete(kvKey);
    await env.REFRESH_TOKENS.put(`refresh:${userId}:${newJti}`, JSON.stringify({
      token: newRefresh,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    const headers = {
      ...corsHeaders,
      'Set-Cookie': createRefreshCookie(newRefresh)
    };

    return jsonResponse({ accessToken: newAccess }, 200, headers);
  } catch (err) {
    const headers = { ...corsHeaders, 'Set-Cookie': clearRefreshCookie() };
    return jsonResponse({ error: AuthError.REFRESH_TOKEN_INVALID, message: err.message }, 403, headers);
  }
}

async function handleAuthLogout(request, env, corsHeaders) {
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));
    if (refreshCookie) {
      const token = refreshCookie.split('=')[1];
      try {
        const payload = await verifyRefreshToken(token, env);
        if (payload && payload.userId && payload.jti) {
          await env.REFRESH_TOKENS.delete(`refresh:${payload.userId}:${payload.jti}`);
        }
      } catch (e) { /* ignore invalid token on logout */ }
    }
  }

  const headers = { ...corsHeaders, 'Set-Cookie': clearRefreshCookie() };
  return jsonResponse({ success: true }, 200, headers);
}

async function handleAuthLogoutAll(request, env, corsHeaders) {
  const { user, error } = await getUserFromRequest(request, env);
  if (error || !user) return jsonResponse({ error: error || 'Unauthorized' }, 401, corsHeaders);

  try {
    const { keys } = await env.REFRESH_TOKENS.list({ prefix: `refresh:${user.userId}:` });
    for (const key of keys) {
      await env.REFRESH_TOKENS.delete(key.name);
    }

    const headers = { ...corsHeaders, 'Set-Cookie': clearRefreshCookie() };
    return jsonResponse({ success: true, count: keys.length }, 200, headers);
  } catch (err) { return jsonResponse({ error: err.message }, 500, corsHeaders); }
}

async function handleGoogleAuthStart(request, env, corsHeaders) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'login';

  const redirectUrl = new URL(GOOGLE_REDIRECT_URI);
  redirectUrl.searchParams.set('mode', mode);
  redirectUrl.searchParams.set('email', 'google.user@example.com');

  return Response.redirect(redirectUrl.toString(), 302);
}

async function handleGoogleAuthCallback(request, env, corsHeaders) {
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || 'google.user@example.com').toLowerCase();
  const displayName = email.split('@')[0];

  let user = await env.DB.prepare('SELECT id, email, display_name FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    const userId = `user_${crypto.randomUUID()}`;
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, display_name, is_active) VALUES (?, ?, ?, ?, 1)'
    ).bind(userId, email, 'google_oauth', displayName).run();

    await env.DB.prepare(
      'INSERT INTO user_access (user_id, has_full_access, unlocked_at) VALUES (?, 1, datetime(\'now\')) ON CONFLICT(user_id) DO UPDATE SET has_full_access = 1, unlocked_at = datetime(\'now\')'
    ).bind(userId).run();

    user = { id: userId, email, display_name: displayName };
  }

  // JWT Generation
  const { accessToken, refreshToken, jti } = await generateTokens({ id: user.id, email: user.email, role: 'user' }, env);

  // Store Refresh Token in KV
  await env.REFRESH_TOKENS.put(`refresh:${user.id}:${jti}`, JSON.stringify({
    token: refreshToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
  }), { expirationTtl: 7 * 24 * 60 * 60 });

  // Set-Cookie in response used by window.opener check? 
  // Wait, postMessage is JS. The response loads in the popup. 
  // The popup sets the cookie for the domain.
  // Then opener can close popup. Opener needs accessToken.

  // NOTE: Set-Cookie headers on this response will set the cookie on the browser for this domain.
  // This is exactly what we want.

  const headers = {
    ...corsHeaders,
    'Set-Cookie': createRefreshCookie(refreshToken),
    'Content-Type': 'text/html'
  };

  const html = `<!doctype html>
  <html><body>
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: 'auth-success',
          token: '${accessToken}',
          user: { email: '${user.email}', display_name: '${user.display_name || ''}' }
        }, '*');
        window.close();
      } else {
        document.body.innerText = 'Login complete. You can close this window.';
      }
    </script>
  </body></html>`;

  return new Response(html, { headers });
}

async function handleAdminUpdateUserRole(targetUserId, data, adminUser, env, corsHeaders) {
  const { role } = data;
  if (!role || !['admin', 'user'].includes(role)) {
    return jsonResponse({ error: { code: 'INVALID_ROLE', message: 'Role must be admin or user' } }, 400, corsHeaders);
  }

  // Prevent editing self
  if (targetUserId === adminUser.userId) {
    return jsonResponse({ error: { code: 'SELF_DEMOTION_DENIED', message: 'Cannot change your own role' } }, 403, corsHeaders);
  }

  // Prevent demoting last admin
  if (role === 'user') {
    const adminCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").first();
    if (adminCount.count <= 1) {
      // Check if target is indeed an admin
      const target = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(targetUserId).first();
      if (target && target.role === 'admin') {
        return jsonResponse({ error: { code: 'LAST_ADMIN_PROTECTION', message: 'Cannot demote the last administrator' } }, 403, corsHeaders);
      }
    }
  }

  try {
    const res = await env.DB.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").bind(role, targetUserId).run();
    if (res.meta.changes === 0) {
      return jsonResponse({ error: 'User not found' }, 404, corsHeaders);
    }

    // Invalidate ALL refresh tokens for this user
    try {
      const { keys } = await env.REFRESH_TOKENS.list({ prefix: `refresh:${targetUserId}:` });
      for (const key of keys) {
        await env.REFRESH_TOKENS.delete(key.name);
      }
    } catch (e) { console.error('Failed to invalidate tokens', e); }

    return jsonResponse({ success: true, role }, 200, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function handleAdminListUsers(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, email, display_name, role, is_active, created_at, last_login_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `).all(); // Limit 100 for safety
    return jsonResponse({ users: results }, 200, corsHeaders);
  } catch (err) {
    // If role column doesn't exist yet, handle gracefully
    if (err.message.includes('no such column')) {
      return jsonResponse({ error: 'Migration required for roles' }, 500, corsHeaders);
    }
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

async function resolveUserIdentity(request, env) {
  const { user } = await getUserFromRequest(request, env);
  if (user) {
    return { userId: user.userId, email: user.email || '', isAnon: false };
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashString(ip || 'anonymous');
  return { userId: `anon:${ipHash}`, email: `${ipHash}@anon.local`, isAnon: true };
}

async function requireAuthUser(request, env, corsHeaders) {
  const { user, error } = await getUserFromRequest(request, env);
  if (error || !user) {
    return { error: jsonResponse({ error: AuthError.UNAUTHORIZED }, 401, corsHeaders) };
  }
  return { userId: user.userId, email: user.email || '' };
}

async function resolveViewDedupe(request, env, simId) {
  const { user } = await getUserFromRequest(request, env);
  if (user) {
    return {
      key: `viewdedupe:user:${simId}:${user.userId}`,
      ttl: 60 * 60 * 24 * 7
    };
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashString(ip || 'anonymous');
  return {
    key: `viewdedupe:ip:${simId}:${ipHash}`,
    ttl: 60 * 60 * 2
  };
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const hash = new Uint8Array(derived);
  return `pbkdf2:100000:${base64Encode(salt)}:${base64Encode(hash)}`;
}

async function verifyPassword(password, stored) {
  // New PBKDF2 format
  if (stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    const iterations = parseInt(parts[1], 10);
    const salt = base64Decode(parts[2]);
    const expected = base64Decode(parts[3]);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      key,
      256
    );
    const actual = new Uint8Array(derived);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  }

  // Legacy format: 16-char SHA-256 substring (from old hashString function)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const legacyHash = fullHash.substring(0, 16);

  if (stored === legacyHash || stored === fullHash) {
    return true;
  }

  return false;
}

function base64Encode(bytes) {
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

function base64Decode(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function isValidDisplayName(name) {
  return /^[a-zA-Z0-9 ._-]{1,40}$/.test(name);
}

// ===== UTILITY FUNCTIONS =====

function jsonResponse(data, status = 200, corsHeaders = {}) {
  const res = new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    }
  });
  return addSecurityHeaders(res);
}

async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
