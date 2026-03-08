
import { jsonResponse } from '../utils/responseHelpers.js';
import { getUniqueSlug } from '../utils/slugs.js';

export async function handleSyncContent(request, env, corsHeaders) {
    try {
        const report = {
            coursesCreated: 0,
            sectionsCreated: 0,
            simulationsCreated: 0,
            errors: []
        };

        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor') || undefined;

        // Process only one batch to avoid Worker limits
        // Limit to 50 items per request
        const listed = await env.R2.list({
            prefix: 'simulations/',
            cursor: cursor,
            limit: 50
        });

        const nextCursor = listed.truncated ? listed.cursor : null;

        // Cache courses and sections to minimize DB lookups
        const courseCache = new Map(); // slug -> id
        const sectionCache = new Map(); // courseId -> defaultSectionId

        for (const obj of listed.objects) {
            // Expected format: simulations/{courseId}/{slug}/index.html
            const parts = obj.key.split('/');
            if (parts.length < 4 || parts[3] !== 'index.html') continue;

            const courseSlug = parts[1];
            const simSlug = parts[2];

            try {
                // 1. Ensure Course Exists
                let courseId = courseCache.get(courseSlug);
                if (!courseId) {
                    // Check DB
                    const existingCourse = await env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(courseSlug).first();
                    if (existingCourse) {
                        courseId = existingCourse.id;
                    } else {
                        // Create Course
                        // Auto-generate title from slug
                        const courseTitle = courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        await env.DB.prepare(`
              INSERT INTO courses (id, title, description, category, icon_class, color_theme, display_order, is_active, is_deleted)
              VALUES (?, ?, ?, 'imported', 'fas fa-cube', '#4ade80', 999, 1, 0)
            `).bind(courseSlug, courseTitle, 'Imported from R2').run();
                        courseId = courseSlug;
                        report.coursesCreated++;
                    }
                    courseCache.set(courseSlug, courseId);
                }

                // 2. Ensure Section Exists
                let sectionId = sectionCache.get(courseId);
                if (!sectionId) {
                    // Check for "Imported" section
                    const existingSection = await env.DB.prepare('SELECT id FROM sections WHERE course_id = ? AND title = ?').bind(courseId, 'Imported').first();
                    if (existingSection) {
                        sectionId = existingSection.id;
                    } else {
                        // Create Section
                        sectionId = crypto.randomUUID();
                        await env.DB.prepare(`
              INSERT INTO sections (id, course_id, title, display_order, is_deleted)
              VALUES (?, ?, 'Imported', 999, 0)
            `).bind(sectionId, courseId).run();
                        report.sectionsCreated++;
                    }
                    sectionCache.set(courseId, sectionId);
                }

                // 3. Ensure Simulation Exists
                const existingSim = await env.DB.prepare('SELECT id FROM simulations WHERE course_id = ? AND slug = ?').bind(courseId, simSlug).first();

                if (!existingSim) {
                    const simTitle = simSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    const newId = crypto.randomUUID();
                    await env.DB.prepare(`
             INSERT INTO simulations (id, course_id, section_id, title, slug, has_simulation, display_order, file_path, upload_date, is_deleted)
             VALUES (?, ?, ?, ?, ?, 1, 999, ?, ?, 0)
           `).bind(newId, courseId, sectionId, simTitle, simSlug, obj.key, new Date().toISOString()).run();
                    report.simulationsCreated++;
                }

            } catch (err) {
                console.error(`Error processing ${obj.key}:`, err);
                report.errors.push(`${obj.key}: ${err.message}`);
            }
        }

        return jsonResponse({ success: true, report, nextCursor }, 200, corsHeaders);

    } catch (e) {
        console.error('Sync error:', e);
        return jsonResponse({ error: e.message }, 500, corsHeaders);
    }
}
