/**
 * Global Error Handler Utility
 */

import { AuthError } from './constants.js';

/**
 * Custom AppError class for known, safe-to-expose errors
 */
export class AppError extends Error {
    constructor(code, message, statusCode, details = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Generate a unique Request ID
 */
export function createRequestId() {
    return crypto.randomUUID();
}

/**
 * Global Error Handler
 * Logs full details internally, returns sanitized JSON to client.
 * @param {Error} error 
 * @param {Object} env 
 * @param {Request} request 
 * @returns {Response}
 */
export function handleError(error, env, request) {
    const requestId = request?.headers?.get('x-request-id') || createRequestId();
    const timestamp = new Date().toISOString();

    // 1. Internal Logging (Structured JSON)
    // NEVER log sensitive data (passwords, tokens)
    // We log the full error stack here for debugging.
    // In a real Worker, you might send this to a logging service (Datadog, etc.) via background queue.
    console.error(JSON.stringify({
        timestamp,
        requestId,
        method: request?.method,
        path: request?.url ? new URL(request.url).pathname : 'unknown',
        errorCode: error.code || 'UNKNOWN',
        message: error.message,
        stack: error.stack,
        details: error.details || null
    }));

    // 2. Client Response Construction
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred. Please try again later.';
    let statusCode = 500;
    let details = undefined;

    // Handle Known AppErrors
    if (error instanceof AppError) {
        code = error.code;
        message = error.message;
        statusCode = error.statusCode;
        details = error.details;
    }
    // Handle Known AuthError constants (if thrown directly as objects/strings)
    else if (Object.values(AuthError).includes(error.message) || Object.values(AuthError).includes(error)) {
        // If the error IS the code (legacy throws)
        const errorCode = error.message || error;
        code = errorCode; // e.g. 'UNAUTHORIZED'
        statusCode = getStatusForCode(errorCode);
        message = getMessageForCode(errorCode);
    }
    // Handle D1 Errors (Sanitization)
    else if (error.message && (error.message.includes('D1_') || error.message.includes('SQLITE_'))) {
        if (error.message.includes('UNIQUE constraint failed')) {
            code = 'CONFLICT';
            message = 'Resource already exists.';
            statusCode = 409;
        } else {
            code = 'DATABASE_ERROR';
            message = 'Unable to process your request.'; // Generic
            statusCode = 500;
        }
    }
    // Handle JSON Parse Errors
    else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        code = 'INVALID_JSON';
        message = 'Invalid JSON request body.';
        statusCode = 400;
    }

    // 3. Return JSON Response
    // Note: We don't have access to global constants/corsHeaders easily here unless passed.
    // We will assume the caller will attach CORS/Security headers or we return text/json.
    // Ideally, this function returns a Response object that the main handler can then wrap.

    return new Response(JSON.stringify({
        success: false,
        error: {
            code,
            message,
            requestId,
            details
        }
    }), {
        status: statusCode,
        headers: {
            'Content-Type': 'application/json'
            // Headers (CORS/Security) will be attached by the main middleware chain
        }
    });
}

// Helpers for Legacy Code Mapping
function getStatusForCode(code) {
    switch (code) {
        case AuthError.UNAUTHORIZED: return 401;
        case AuthError.FORBIDDEN: return 403;
        case AuthError.TOKEN_EXPIRED: return 401;
        case AuthError.RATE_LIMIT_EXCEEDED: return 429;
        case AuthError.VALIDATION_ERROR: return 400;
        case AuthError.NOT_FOUND: return 404; // If exists
        default: return 400;
    }
}

function getMessageForCode(code) {
    switch (code) {
        case AuthError.UNAUTHORIZED: return 'Unauthorized access';
        case AuthError.FORBIDDEN: return 'Access denied';
        case AuthError.TOKEN_EXPIRED: return 'Session expired';
        case AuthError.RATE_LIMIT_EXCEEDED: return 'Too many requests';
        default: return 'Request failed';
    }
}
