/**
 * Input Validation Utilities
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_REGEX = /^[a-zA-Z0-9_-]+$/; // Alphanumeric, hyphens, underscores
const URL_REGEX = /^https?:\/\/.+/i; // Basic protocol check

/**
 * Validate Email Address
 * @param {string} email 
 * @returns {{valid: boolean, sanitized: string, error?: string}}
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, sanitized: '', error: 'Email is required' };
    }

    const sanitized = email.trim().toLowerCase();

    if (sanitized.length > 254) {
        return { valid: false, sanitized: '', error: 'Email too long' };
    }

    if (!EMAIL_REGEX.test(sanitized)) {
        return { valid: false, sanitized: '', error: 'Invalid email format' };
    }

    return { valid: true, sanitized };
}

/**
 * Validate Password Strength
 * @param {string} password 
 * @returns {{valid: boolean, error?: string}}
 */
export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
    if (password.length > 128) return { valid: false, error: 'Password too long' };

    return { valid: true };
}

/**
 * Validate Generic String
 * @param {any} value 
 * @param {Object} options 
 * @param {number} [options.minLength]
 * @param {number} [options.maxLength]
 * @param {string} [options.fieldName]
 * @returns {{valid: boolean, sanitized: string, error?: string}}
 */
export function validateString(value, options = {}) {
    const { minLength = 0, maxLength = 255, fieldName = 'Field' } = options;

    if (value === undefined || value === null) {
        if (minLength > 0) return { valid: false, sanitized: '', error: `${fieldName} is required` };
        return { valid: true, sanitized: '' }; // Optional
    }

    if (typeof value !== 'string') {
        return { valid: false, sanitized: '', error: `${fieldName} must be a string` };
    }

    const sanitized = value.trim();

    // Check for null bytes (security)
    if (sanitized.indexOf('\0') !== -1) {
        return { valid: false, sanitized: '', error: `${fieldName} contains invalid characters` };
    }

    if (sanitized.length < minLength) {
        return { valid: false, sanitized: '', error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (sanitized.length > maxLength) {
        return { valid: false, sanitized: '', error: `${fieldName} cannot exceed ${maxLength} characters` };
    }

    return { valid: true, sanitized };
}

/**
 * Validate ID (Alphanumeric, -, _)
 * @param {string} id 
 * @param {string} [fieldName]
 * @returns {{valid: boolean, sanitized: string, error?: string}}
 */
export function validateId(id, fieldName = 'ID') {
    if (!id || typeof id !== 'string') {
        return { valid: false, sanitized: '', error: `${fieldName} is required` };
    }

    if (id.length > 64) {
        return { valid: false, sanitized: '', error: `${fieldName} too long` };
    }

    if (!ID_REGEX.test(id)) {
        return { valid: false, sanitized: '', error: `${fieldName} can only contain letters, numbers, hyphens, and underscores` };
    }

    return { valid: true, sanitized: id };
}

/**
 * Validate Integer
 * @param {any} value 
 * @param {Object} options 
 * @returns {{valid: boolean, value: number, error?: string}}
 */
export function validateInteger(value, options = {}) {
    const { min, max, fieldName = 'Field' } = options;

    const num = Number(value);

    if (!Number.isInteger(num)) {
        return { valid: false, value: 0, error: `${fieldName} must be an integer` };
    }

    if (min !== undefined && num < min) {
        return { valid: false, value: 0, error: `${fieldName} must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
        return { valid: false, value: 0, error: `${fieldName} must be at most ${max}` };
    }

    return { valid: true, value: num };
}

/**
 * Validate URL
 * @param {string} url 
 * @returns {{valid: boolean, sanitized: string, error?: string}}
 */
export function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return { valid: false, sanitized: '', error: 'URL is required' };
    }

    if (url.length > 2048) {
        return { valid: false, sanitized: '', error: 'URL too long' };
    }

    if (!URL_REGEX.test(url)) {
        return { valid: false, sanitized: '', error: 'Invalid URL format (must be http/https)' };
    }

    return { valid: true, sanitized: url };
}
