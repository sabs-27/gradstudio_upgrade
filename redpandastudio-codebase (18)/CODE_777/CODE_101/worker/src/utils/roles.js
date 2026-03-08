export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};

export const PERMISSIONS = {
    [ROLES.ADMIN]: [
        'manage_categories',
        'manage_courses',
        'manage_sections',
        'manage_topics',
        'manage_users', // Role changes
        'upload_files',
        'view_content',
        'comment',
        'bookmark',
        'manage_comments', // Delete/Moderate
        'like_dislike'
    ],
    [ROLES.USER]: [
        'view_content',
        'comment',
        'bookmark',
        'like_dislike'
    ]
};

export function hasPermission(role, permission) {
    const rolePermissions = PERMISSIONS[role];
    if (!rolePermissions) return false;
    return rolePermissions.includes(permission);
}
