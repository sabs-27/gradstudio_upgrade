/**
 * ADMIN HANDLERS - CAROUSEL MANAGEMENT
 */
import { jsonResponse } from '../utils/responseHelpers.js';

/**
 * GET /api/carousels
 * Returns all active carousels with their cards (for homepage)
 */
export async function handleGetAllCarousels(request, env, corsHeaders) {
    // 1. Fetch all active carousels
    const { results: carousels } = await env.DB.prepare(`
        SELECT * FROM carousels 
        WHERE is_active = 1
        ORDER BY display_order ASC
    `).all();

    // 2. Fetch all active cards
    const { results: allCards } = await env.DB.prepare(`
        SELECT * FROM carousel_cards 
        WHERE is_active = 1
        ORDER BY display_order ASC
    `).all();

    // 3. Group cards by carousel_id
    const carouselsWithCards = carousels.map(carousel => ({
        ...carousel,
        cards: allCards.filter(card => card.carousel_id == carousel.id)
    }));

    return jsonResponse(carouselsWithCards, 200, corsHeaders);
}

/**
 * GET /api/carousel
 * Returns all active carousel cards for a specific carousel
 */
export async function handleGetCarouselCards(request, env, corsHeaders) {
    const url = new URL(request.url);
    const carouselId = url.searchParams.get('type') || '1';

    const { results } = await env.DB.prepare(`
        SELECT * FROM carousel_cards 
        WHERE is_active = 1 AND carousel_id = ?
        ORDER BY display_order ASC
    `).bind(carouselId).all();

    // Fetch carousel info for header
    const carousel = await env.DB.prepare(`
        SELECT header FROM carousels WHERE id = ?
    `).bind(carouselId).first();

    // Fallback to metadata for backward compatibility
    let header = carousel ? carousel.header : '';
    if (!header) {
        const headerResult = await env.DB.prepare(`
            SELECT value FROM metadata WHERE key = ?
        `).bind(`carousel_${carouselId}_header`).first();
        if (headerResult) header = headerResult.value;
    }

    return jsonResponse({ 
        cards: results,
        header: header
    }, 200, corsHeaders);
}

/**
 * GET /api/admin/carousel
 * Admin view: returns all carousel cards including inactive ones for a specific carousel
 */
export async function handleAdminGetCarouselCards(request, env, corsHeaders) {
    const url = new URL(request.url);
    const carouselId = url.searchParams.get('type') || '1';

    const { results } = await env.DB.prepare(`
        SELECT * FROM carousel_cards 
        WHERE carousel_id = ?
        ORDER BY display_order ASC
    `).bind(carouselId).all();

    // Fetch carousel info for header
    const carousel = await env.DB.prepare(`
        SELECT header FROM carousels WHERE id = ?
    `).bind(carouselId).first();

    // Fallback to metadata
    let header = carousel ? carousel.header : '';
    if (!header) {
        const headerResult = await env.DB.prepare(`
            SELECT value FROM metadata WHERE key = ?
        `).bind(`carousel_${carouselId}_header`).first();
        if (headerResult) header = headerResult.value;
    }

    return jsonResponse({ 
        cards: results,
        header: header
    }, 200, corsHeaders);
}

/**
 * GET /api/admin/carousels
 * Admin view: returns all carousels
 */
export async function handleAdminGetCarousels(request, env, corsHeaders) {
    const { results } = await env.DB.prepare(`
        SELECT * FROM carousels 
        ORDER BY display_order ASC
    `).all();

    return jsonResponse(results, 200, corsHeaders);
}

/**
 * POST /api/admin/carousels
 * Create a new carousel
 */
export async function handleAdminAddCarousel(data, env, corsHeaders) {
    const { name, header, display_order, is_active } = data;

    if (!name) {
        return jsonResponse({ error: 'Name is required' }, 400, corsHeaders);
    }

    const result = await env.DB.prepare(`
        INSERT INTO carousels (name, header, display_order, is_active)
        VALUES (?, ?, ?, ?)
    `).bind(
        name,
        header || '',
        display_order || 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
    ).run();

    return jsonResponse({ success: true, id: result.meta.last_row_id }, 201, corsHeaders);
}

/**
 * PUT /api/admin/carousels
 * Update an existing carousel
 */
export async function handleAdminUpdateCarousel(data, env, corsHeaders) {
    const { id, name, header, display_order, is_active } = data;

    if (!id) {
        return jsonResponse({ error: 'ID is required' }, 400, corsHeaders);
    }

    await env.DB.prepare(`
        UPDATE carousels 
        SET name = COALESCE(?, name),
            header = COALESCE(?, header),
            display_order = COALESCE(?, display_order),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
    `).bind(name, header, display_order, is_active, id).run();

    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * DELETE /api/admin/carousels/:id
 * Permanently delete a carousel and its cards
 */
export async function handleAdminDeleteCarousel(id, env, corsHeaders) {
    // Also delete associated cards? Maybe not, keep them orphaned?
    // User probably wants them deleted.
    await env.DB.prepare('DELETE FROM carousels WHERE id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM carousel_cards WHERE carousel_id = ?').bind(id).run();
    
    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * POST /api/admin/carousel
 * Create a new carousel card
 */
export async function handleAdminAddCarouselCard(data, env, corsHeaders) {
    const { 
        title, description, icon_class, color_hex, target_type, target_id, display_order, is_active,
        content_type, image_url, iframe_url, content_html, width, height_px, full_bleed, carousel_id
    } = data;

    if (!title || !target_type || !target_id) {
        return jsonResponse({ error: 'Title, target_type, and target_id are required' }, 400, corsHeaders);
    }

    const result = await env.DB.prepare(`
        INSERT INTO carousel_cards (
            title, description, icon_class, color_hex, target_type, target_id, display_order, is_active,
            content_type, image_url, iframe_url, content_html, width, height_px, full_bleed, carousel_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        title, 
        description || '', 
        icon_class || 'fas fa-book', 
        color_hex || '#3b82f6', 
        target_type, 
        target_id, 
        display_order || 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        content_type || 'standard',
        image_url || null,
        iframe_url || null,
        content_html || null,
        width || '300px',
        height_px || 'auto',
        full_bleed ? 1 : 0,
        carousel_id || 1
    ).run();

    return jsonResponse({ success: true, id: result.meta.last_row_id }, 201, corsHeaders);
}

/**
 * PUT /api/admin/carousel
 * Update an existing carousel card or update the header
 */
export async function handleAdminUpdateCarouselCard(data, env, corsHeaders) {
    // Check if updating header text
    if (data.type === 'header') {
        const { carousel_id, header } = data;
        if (!carousel_id || header === undefined) {
            return jsonResponse({ error: 'carousel_id and header are required' }, 400, corsHeaders);
        }
        await env.DB.prepare(`
            INSERT INTO metadata (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).bind(`carousel_${carousel_id}_header`, header).run();
        return jsonResponse({ success: true }, 200, corsHeaders);
    }

    const { 
        id, title, description, icon_class, color_hex, target_type, target_id, display_order, is_active,
        content_type, image_url, iframe_url, content_html, width, height_px, full_bleed, carousel_id
    } = data;

    if (!id) {
        return jsonResponse({ error: 'ID is required' }, 400, corsHeaders);
    }

    await env.DB.prepare(`
        UPDATE carousel_cards 
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            icon_class = COALESCE(?, icon_class),
            color_hex = COALESCE(?, color_hex),
            target_type = COALESCE(?, target_type),
            target_id = COALESCE(?, target_id),
            display_order = COALESCE(?, display_order),
            is_active = COALESCE(?, is_active),
            content_type = COALESCE(?, content_type),
            image_url = ?,
            iframe_url = ?,
            content_html = ?,
            width = COALESCE(?, width),
            height_px = COALESCE(?, height_px),
            full_bleed = COALESCE(?, full_bleed),
            carousel_id = COALESCE(?, carousel_id)
        WHERE id = ?
    `).bind(
        title, description, icon_class, color_hex, target_type, target_id, display_order, is_active,
        content_type, image_url, iframe_url, content_html, width, height_px, full_bleed, carousel_id, id
    ).run();

    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * DELETE /api/admin/carousel/:id
 * Permanently delete a carousel card
 */
export async function handleAdminDeleteCarouselCard(id, env, corsHeaders) {
    await env.DB.prepare('DELETE FROM carousel_cards WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * POST /api/admin/carousel/reorder
 * Bulk update display_order for carousel cards
 */
export async function handleAdminReorderCarouselCards(data, env, corsHeaders) {
    const { orders } = data; // Array of { id, display_order }

    if (!Array.isArray(orders)) {
        return jsonResponse({ error: 'Orders must be an array' }, 400, corsHeaders);
    }

    const statements = orders.map(item => 
        env.DB.prepare('UPDATE carousel_cards SET display_order = ? WHERE id = ?').bind(item.display_order, item.id)
    );

    await env.DB.batch(statements);
    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * POST /api/admin/carousels/reorder
 * Bulk update display_order for carousels
 */
export async function handleAdminReorderCarousels(data, env, corsHeaders) {
    const { orders } = data; // Array of { id, display_order }

    if (!Array.isArray(orders)) {
        return jsonResponse({ error: 'Orders must be an array' }, 400, corsHeaders);
    }

    const statements = orders.map(item => 
        env.DB.prepare('UPDATE carousels SET display_order = ? WHERE id = ?').bind(item.display_order, item.id)
    );

    await env.DB.batch(statements);
    return jsonResponse({ success: true }, 200, corsHeaders);
}

/**
 * POST /api/admin/carousel/upload
 * Upload media for carousel cards
 */
export async function handleAdminCarouselUpload(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const type = formData.get('type'); // 'image' or 'html'

        if (!file || !(file instanceof File)) {
            return jsonResponse({ error: 'No file uploaded' }, 400, corsHeaders);
        }

        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const folder = type === 'html' ? 'carousel/html' : 'carousel/images';
        const r2Key = `static/${folder}/${fileName}`;

        await env.R2.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type || (type === 'html' ? 'text/html' : 'image/jpeg'),
            }
        });

        // Return the public URL path
        return jsonResponse({ 
            success: true, 
            url: `/${folder}/${fileName}`,
            key: r2Key 
        }, 201, corsHeaders);
    } catch (e) {
        return jsonResponse({ error: e.message }, 500, corsHeaders);
    }
}
