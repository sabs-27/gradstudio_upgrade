/**
 * File Security Utilities
 */

/**
 * Sanitize Filename
 * Ensures filename is safe for storage and URL usage.
 * @param {string} filename 
 * @returns {{ original: string, sanitized: string, extension: string }}
 */
export function sanitizeFilename(filename) {
    if (!filename) {
        // Generate a default if missing
        const random = crypto.randomUUID().split('-')[0];
        const timestamp = Date.now();
        return {
            original: 'unknown',
            sanitized: `${timestamp}-${random}-unknown.html`,
            extension: '.html'
        };
    }

    const original = filename;

    // 1. Extract and validate extension
    let extension = '';
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex !== -1 && lastDotIndex < filename.length - 1) {
        extension = filename.substring(lastDotIndex).toLowerCase();
    }

    // 2. Base sanitization (remove extension first)
    let nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;

    // Replace spaces with hyphens, remove special chars, convert to lower
    let sanitizedBase = nameWithoutExt
        .toLowerCase()
        .replace(/\s+/g, '-')          // Spaces to hyphens
        .replace(/[^a-z0-9\-_]/g, '')  // Remove non-alphanumeric (except - and _)
        .replace(/-+/g, '-');          // Collapse multiple hyphens

    // Ensure known length limit (max 200 total)
    if (sanitizedBase.length > 150) {
        sanitizedBase = sanitizedBase.substring(0, 150);
    }

    // 3. Prevent collisions and ensure uniqueness
    const timestamp = Date.now();
    const random = crypto.randomUUID().split('-')[0];

    // Final format: {timestamp}-{random}-{name}{ext}
    const finalName = `${timestamp}-${random}-${sanitizedBase}${extension}`;

    return {
        original,
        sanitized: finalName,
        extension
    };
}

/**
 * Validate File Extension
 * @param {string} filename 
 * @param {string[]} allowedExtensions 
 * @returns {boolean}
 */
export function validateFileExtension(filename, allowedExtensions = ['.html', '.htm']) {
    if (!filename) return false;
    const lowername = filename.toLowerCase();
    return allowedExtensions.some(ext => lowername.endsWith(ext));
}

/**
 * Validate MIME Type (Basic Check)
 * @param {string} contentType 
 * @param {string[]} allowedTypes 
 * @returns {boolean}
 */
export function validateMimeType(contentType, allowedTypes = ['text/html', 'application/xhtml+xml']) {
    if (!contentType) return false;
    // Handle "text/html; charset=utf-8"
    const type = contentType.split(';')[0].trim().toLowerCase();
    return allowedTypes.includes(type);
}
