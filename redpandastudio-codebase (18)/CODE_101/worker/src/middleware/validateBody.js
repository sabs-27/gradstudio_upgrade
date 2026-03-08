import { jsonResponse } from '../utils/responseHelpers.js';
import { AuthError } from '../utils/constants.js';
import {
    validateEmail,
    validateString,
    validateId,
    validatePassword,
    validateInteger,
    validateUrl
} from '../utils/validator.js';
import { sanitizeHtml, sanitizeForSQL } from '../utils/sanitizer.js';

/**
 * Generic Validation Middleware
 * @param {Object} schema - Validation schema definition
 * @returns {Function} Middleware function
 */
export function validateBody(schema) {
    return async (request, env, context) => {
        let body;
        try {
            body = await request.clone().json();
        } catch (e) {
            return jsonResponse({
                error: { code: 'INVALID_JSON', message: 'Invalid JSON body' }
            }, 400);
        }

        const errors = [];
        const sanitizedBody = {};

        for (const [key, rules] of Object.entries(schema)) {
            const value = body[key];

            // Required check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({ field: key, message: `${key} is required` });
                continue;
            }

            // Skip if optional and missing
            if (!rules.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // Type-specific validation
            let result = { valid: true, sanitized: value };

            switch (rules.type) {
                case 'email':
                    result = validateEmail(value);
                    break;
                case 'password':
                    result = validatePassword(value);
                    // Don't return sanitized password
                    if (result.valid) result.sanitized = value;
                    break;
                case 'string':
                    result = validateString(value, {
                        minLength: rules.minLength,
                        maxLength: rules.maxLength,
                        fieldName: key
                    });
                    if (result.valid && rules.sanitizeHtml) {
                        result.sanitized = sanitizeHtml(result.sanitized);
                    }
                    if (result.valid && rules.sanitizeSql) {
                        result.sanitized = sanitizeForSQL(result.sanitized);
                    }
                    break;
                case 'id':
                    result = validateId(value, key);
                    break;
                case 'integer':
                    result = validateInteger(value, { min: rules.min, max: rules.max, fieldName: key });
                    // validateInteger returns .value, map to .sanitized for consistency
                    if (result.valid) result.sanitized = result.value;
                    break;
                case 'url':
                    result = validateUrl(value);
                    break;
                case 'enum':
                    if (!rules.values.includes(value)) {
                        result = { valid: false, error: `Invalid ${key}` };
                    } else {
                        result.sanitized = value;
                    }
                    break;
                default:
                    result = { valid: true, sanitized: value };
            }

            if (!result.valid) {
                errors.push({ field: key, message: result.error });
            } else {
                sanitizedBody[key] = result.sanitized;
            }
        }

        if (errors.length > 0) {
            return jsonResponse({
                success: false,
                error: {
                    code: AuthError.VALIDATION_ERROR,
                    message: 'Validation failed',
                    details: errors
                }
            }, 400);
        }

        // Replace request body with sanitized version?
        // In Workers, we can't easily replace the request stream.
        // Instead, we can attach sanitized data to the request object or context?
        // OR we just return null and let the handler re-parse (which is wasteful)
        // OR we return the sanitized body if we change the middleware signature to return DATA not RESPONSE?
        // Current Index.js expects middleware to return Response on error or null on success.
        // So we will attach sanitized body to `request.sanitizedBody`

        request.sanitizedBody = sanitizedBody;
        return null;
    };
}
