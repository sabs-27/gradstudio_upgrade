
/**
 * Helper to ensure unique slug by appending counter
 * Checks DB for existence and increments counter until unique
 */
export async function getUniqueSlug(env, baseSlug) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await env.DB.prepare('SELECT id FROM simulations WHERE slug = ?').bind(slug).first();
        if (!existing) return slug;

        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}
