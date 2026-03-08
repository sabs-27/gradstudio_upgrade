import { AuthError } from '../utils/constants.js';
import { hasPermission } from '../utils/roles.js';

export function requireRole(...allowedRoles) {
    return (user) => {
        if (!user || !user.role) {
            throw new Error(AuthError.UNAUTHORIZED);
        }

        if (!allowedRoles.includes(user.role)) {
            throw new Error(AuthError.INSUFFICIENT_PERMISSIONS);
        }

        return true;
    };
}

export function requirePermission(permission) {
    return (user) => {
        if (!user || !user.role) {
            throw new Error(AuthError.UNAUTHORIZED);
        }

        if (!hasPermission(user.role, permission)) {
            throw new Error(AuthError.INSUFFICIENT_PERMISSIONS);
        }

        return true;
    };
}
