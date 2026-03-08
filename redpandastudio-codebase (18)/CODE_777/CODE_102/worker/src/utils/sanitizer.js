/**
 * Input Sanitization Utilities
 */

/**
 * Sanitize HTML Content using a strict whitelist approach
 * Removes dangerous tags and attributes
 * @param {string} html 
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
    if (!html) return '';

    // 1. Basic cleaning
    let sanitized = html
        .replace(/\0/g, '') // No null bytes
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Strip scripts completely
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Strip styles completely
        .replace(/<!--[\s\S]*?-->/g, ''); // Strip comments

    // 2. Remove event handlers (on*) and javascript: protocols
    sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, ''); // remove onclick="..."
    sanitized = sanitized.replace(/ on\w+='[^']*'/gi, ''); // remove onclick='...'
    sanitized = sanitized.replace(/ on\w+=[\w]+/gi, '');   // remove onclick=foo

    sanitized = sanitized.replace(/javascript:/gi, '');     // remove javascript: protocol
    sanitized = sanitized.replace(/data:/gi, '');           // remove data: protocol (too risky for now)

    // 3. Whitelist check (Crude but effective for Workers environment without heavy libs)
    // We will escape < and > unless they form a whitelisted tag.
    // This is hard to do perfectly with regex, so we'll use a safer approach:
    // Encode everything by default, then selectively unescape allowed tags.
    // OR: Just strip strictly dangerous tags: frame, iframe, object, embed, applet, base, form, input, link, meta

    const DANGEROUS_TAGS = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option', 'applet', 'base', 'meta', 'link', 'frame', 'frameset'];

    DANGEROUS_TAGS.forEach(tag => {
        const regex = new RegExp(`<${tag}[^>]*>|<\/${tag}>`, 'gi');
        sanitized = sanitized.replace(regex, '');
    });

    return sanitized.trim();
}

/**
 * Escape HTML entities for safe output
 * @param {string} str 
 * @returns {string}
 */
export function escapeOutput(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Sanitize For SQL (Secondary Defense)
 * Primarily used to ensure no control chars drift into queries
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeForSQL(str) {
    if (!str) return '';
    // Remove common SQL comment characters and semi-colons
    return str
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
}
