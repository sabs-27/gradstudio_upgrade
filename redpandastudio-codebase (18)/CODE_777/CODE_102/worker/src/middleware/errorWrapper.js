import { handleError } from '../utils/errorHandler.js';

/**
 * Higher-order function to wrap route handlers with try-catch
 * @param {Function} handler async (request, env, ...args) => Response
 * @returns {Function}
 */
export function withErrorHandling(handler) {
    return async (request, env, ...args) => {
        try {
            return await handler(request, env, ...args);
        } catch (error) {
            return handleError(error, env, request);
        }
    };
}
