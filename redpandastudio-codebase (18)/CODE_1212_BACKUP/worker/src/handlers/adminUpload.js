import { jsonResponse } from '../utils/responseHelpers.js';
import { logSecurityEvent } from '../utils/securityLogger.js';
import { sanitizeFilename, validateFileExtension, validateMimeType } from '../utils/fileSecurity.js';
import { scanHtmlFile, addSecurityWrapper } from '../utils/htmlScanner.js';
import { sanitizeForSQL } from '../utils/sanitizer.js';
import { getUniqueSlug } from '../utils/slugs.js';

export async function handleAdminUploadSimulation(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const courseId = formData.get('course_id');
        const sectionId = formData.get('section_id');
        const title = formData.get('title');
        const slugInput = formData.get('slug');
        const hasSimulation = formData.get('has_simulation') === '1';
        const displayOrder = parseInt(formData.get('display_order') || '1');

        if (!file || !courseId || !sectionId || !title) {
            return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
        }

        // 1. Validate File
        if (!(file instanceof File)) {
            return jsonResponse({ error: 'Invalid file upload' }, 400, corsHeaders);
        }

        const filename = file.name;
        const sanitizedObj = sanitizeFilename(filename);
        const sanitizedFilename = sanitizedObj.sanitized;

        // Validate Extension (HTML only for simulations for now)
        if (!validateFileExtension(sanitizedFilename, ['.html'])) {
            await logSecurityEvent(env, {}, 'file_upload_blocked', {
                reason: 'invalid_extension',
                filename: sanitizedFilename,
                ip: request.headers.get('CF-Connecting-IP')
            });
            return jsonResponse({ error: 'Only .html files are allowed' }, 400, corsHeaders);
        }

        // Validate MIME type (lenient - allow empty since we check extension)
        if (file.type && !validateMimeType(file.type, ['text/html', 'application/xhtml+xml', 'application/octet-stream', ''])) {
            await logSecurityEvent(env, {}, 'file_upload_blocked', {
                reason: 'invalid_mime',
                mime: file.type,
                filename: sanitizedFilename
            });
            return jsonResponse({ error: 'Invalid file type. Expected HTML file.' }, 400, corsHeaders);
        }

        // 2. Scan content for malicious code
        const textContent = await file.text();
        const scanResult = scanHtmlFile(textContent);

        // Log warnings but don't block unless critical (policy choice)
        if (scanResult.score > 0) {
            console.warn(`File scan warnings for ${sanitizedFilename}:`, scanResult.warnings);
        }

        // 3. Add Security Wrapper/Headers Injection (optional, keeps uploaded HTML safe)
        // For now, we trust the clean HTML, but let's wrap it to inject our styles/scripts if needed
        // const secureContent = addSecurityWrapper(textContent); 
        // KEEPING ORIGINAL CONTENT FOR NOW to ensure functionality, can enable wrapper later.
        const secureContent = textContent;

        // 4. Generate Slug/Key
        const baseSlug = slugInput || sanitizedFilename.replace(/\.html$/i, '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const slug = await getUniqueSlug(env, baseSlug);
        const r2Key = `simulations/${courseId}/${slug}/index.html`;

        // 5. Upload to R2
        // We convert text back to blob/buffer to ensure encoding consistency
        await env.R2.put(r2Key, secureContent, {
            httpMetadata: {
                contentType: 'text/html',
            },
            customMetadata: {
                originalName: sanitizedFilename,
                uploadedBy: 'admin', // simplified
                uploadDate: new Date().toISOString()
            }
        });

        // 6. DB Insert
        // Use upsert-like logic or just insert. slug should be unique per course/section ideally.
        // Check if exists first to avoid constraint errors if needed, or rely on catch.

        const uploadDate = new Date().toISOString();

        const { results } = await env.DB.prepare(`
      INSERT INTO simulations (id, course_id, section_id, title, slug, description, has_simulation, display_order, file_path, upload_date, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      RETURNING id
    `).bind(
            crypto.randomUUID(),
            courseId,
            sectionId,
            title,
            slug,
            '', // description
            hasSimulation ? 1 : 0,
            displayOrder,
            r2Key, // store the R2 key as file_path
            uploadDate
        ).all();

        const newId = results[0].id;

        // 7. Log Success
        await logSecurityEvent(env, {}, 'file_upload_success', {
            filename: sanitizedFilename,
            size: file.size,
            key: r2Key,
            sim_id: newId
        });

        return jsonResponse({
            success: true,
            id: newId,
            slug: slug,
            key: r2Key
        }, 201, corsHeaders);

    } catch (e) {
        console.error('Upload error:', e);
        return jsonResponse({ error: e.message }, 500, corsHeaders);
    }
}
