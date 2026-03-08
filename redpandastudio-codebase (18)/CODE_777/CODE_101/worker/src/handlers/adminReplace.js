import { jsonResponse } from '../utils/responseHelpers.js';
import { scanHtmlFile } from '../utils/htmlScanner.js';
import { validateFileExtension } from '../utils/fileSecurity.js';

/**
 * POST /api/admin/replace-simulation
 * Replaces the HTML file in R2 for an existing simulation.
 * Does NOT change title, slug, display_order or any DB fields.
 *
 * FormData fields:
 *   file            — new .html file
 *   simulation_id   — ID of the simulation to replace
 */
export async function handleAdminReplaceSimulation(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const simulationId = formData.get('simulation_id');

        if (!file || !simulationId) {
            return jsonResponse({ error: 'Missing file or simulation_id' }, 400, corsHeaders);
        }

        if (!(file instanceof File)) {
            return jsonResponse({ error: 'Invalid file upload' }, 400, corsHeaders);
        }

        if (!validateFileExtension(file.name, ['.html'])) {
            return jsonResponse({ error: 'Only .html files are allowed' }, 400, corsHeaders);
        }

        // Look up existing simulation to get its R2 file_path
        const row = await env.DB.prepare(
            'SELECT id, title, slug, file_path FROM simulations WHERE id = ? AND is_deleted = 0'
        ).bind(simulationId).first();

        if (!row) {
            return jsonResponse({ error: 'Simulation not found' }, 404, corsHeaders);
        }

        const textContent = await file.text();

        // Scan for malicious content (warn only, don't block)
        const scanResult = scanHtmlFile(textContent);
        if (scanResult.score > 0) {
            console.warn(`Replace scan warnings for sim ${simulationId}:`, scanResult.warnings);
        }

        const r2Key = row.file_path;
        if (!r2Key) {
            return jsonResponse({ error: 'No file_path stored for this simulation' }, 400, corsHeaders);
        }

        // Overwrite in R2 at the exact same key
        await env.R2.put(r2Key, textContent, {
            httpMetadata: { contentType: 'text/html' },
            customMetadata: {
                originalName: file.name,
                replacedBy: 'admin',
                replaceDate: new Date().toISOString()
            }
        });

        return jsonResponse({
            success: true,
            simulation_id: simulationId,
            slug: row.slug,
            key: r2Key
        }, 200, corsHeaders);

    } catch (e) {
        console.error('Replace error:', e);
        return jsonResponse({ error: e.message }, 500, corsHeaders);
    }
}
