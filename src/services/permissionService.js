/**
 * Permission Service - Role-based access control for Glossa platform
 * Handles user permissions, role checks, and access control
 */

export const USER_ROLES = {
    ADMIN: 'Agencies',
    REVIEWER: 'Reviewer', 
    TRANSLATOR: 'Freelance Translator',
    TRANSLATOR_ALT: 'Translator'
};

export const PERMISSIONS = {
    // User Management
    VIEW_ALL_USERS: 'view_all_users',
    CREATE_USERS: 'create_users',
    EDIT_USERS: 'edit_users',
    DELETE_USERS: 'delete_users',
    
    // Project Management
    CREATE_PROJECTS: 'create_projects',
    ASSIGN_PROJECTS: 'assign_projects',
    DELETE_PROJECTS: 'delete_projects',
    VIEW_ALL_PROJECTS: 'view_all_projects',
    
    // Translation & Review
    TRANSLATE_SEGMENTS: 'translate_segments',
    REVIEW_TRANSLATIONS: 'review_translations',
    APPROVE_TRANSLATIONS: 'approve_translations',
    
    // Analytics & Reports
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',
    VIEW_PERFORMANCE_METRICS: 'view_performance_metrics',
    
    // System Administration
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_TM: 'manage_tm',
    MANAGE_BILLING: 'manage_billing'
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: [
        // Full access to everything
        ...Object.values(PERMISSIONS)
    ],
    
    [USER_ROLES.REVIEWER]: [
        PERMISSIONS.VIEW_ALL_PROJECTS,
        PERMISSIONS.REVIEW_TRANSLATIONS,
        PERMISSIONS.APPROVE_TRANSLATIONS,
        PERMISSIONS.VIEW_PERFORMANCE_METRICS,
        PERMISSIONS.VIEW_ANALYTICS
    ],
    
    [USER_ROLES.TRANSLATOR]: [
        PERMISSIONS.TRANSLATE_SEGMENTS,
        PERMISSIONS.VIEW_PERFORMANCE_METRICS
    ],
    
    [USER_ROLES.TRANSLATOR_ALT]: [
        PERMISSIONS.TRANSLATE_SEGMENTS,
        PERMISSIONS.VIEW_PERFORMANCE_METRICS
    ]
};

export class PermissionService {
    /**
     * Check if user has specific permission
     */
    static hasPermission(user, permission) {
        if (!user) return false;
        
        const userRole = user.user_metadata?.user_type || user.user_type;
        const isHardcodedAdmin = user.email === 'rmali@live.com';
        
        // Hardcoded admin has all permissions
        if (isHardcodedAdmin) return true;
        
        const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
        return rolePermissions.includes(permission);
    }

    /**
     * Check if user has any of the specified permissions
     */
    static hasAnyPermission(user, permissions) {
        return permissions.some(permission => this.hasPermission(user, permission));
    }

    /**
     * Check if user has all specified permissions
     */
    static hasAllPermissions(user, permissions) {
        return permissions.every(permission => this.hasPermission(user, permission));
    }

    /**
     * Get all permissions for a user
     */
    static getUserPermissions(user) {
        if (!user) return [];
        
        const userRole = user.user_metadata?.user_type || user.user_type;
        const isHardcodedAdmin = user.email === 'rmali@live.com';
        
        if (isHardcodedAdmin) return Object.values(PERMISSIONS);
        
        return ROLE_PERMISSIONS[userRole] || [];
    }

    /**
     * Check if user is admin
     */
    static isAdmin(user) {
        return this.hasPermission(user, PERMISSIONS.MANAGE_SETTINGS);
    }

    /**
     * Check if user is reviewer
     */
    static isReviewer(user) {
        return this.hasPermission(user, PERMISSIONS.REVIEW_TRANSLATIONS);
    }

    /**
     * Check if user is translator
     */
    static isTranslator(user) {
        return this.hasPermission(user, PERMISSIONS.TRANSLATE_SEGMENTS);
    }

    /**
     * Check if user can access project
     */
    static canAccessProject(user, project) {
        if (!user || !project) return false;
        
        // Admin can access all projects
        if (this.isAdmin(user)) return true;
        
        // Check if user is assigned to project
        return project.translator_id === user.id ||
               project.reviewer_id === user.id ||
               project.created_by === user.id;
    }

    /**
     * Check if user can edit project
     */
    static canEditProject(user, project) {
        if (!user || !project) return false;
        
        // Admin can edit all projects
        if (this.isAdmin(user)) return true;
        
        // Project creator can edit
        return project.created_by === user.id;
    }

    /**
     * Check if user can delete project
     */
    static canDeleteProject(user, project) {
        if (!user || !project) return false;
        
        // Only admin can delete projects
        return this.hasPermission(user, PERMISSIONS.DELETE_PROJECTS);
    }

    /**
     * Get user role display name
     */
    static getRoleDisplayName(userType) {
        switch (userType) {
            case USER_ROLES.ADMIN: return 'Administrator';
            case USER_ROLES.REVIEWER: return 'Reviewer';
            case USER_ROLES.TRANSLATOR: return 'Translator';
            case USER_ROLES.TRANSLATOR_ALT: return 'Translator';
            default: return 'User';
        }
    }

    /**
     * Get role color for UI
     */
    static getRoleColor(userType) {
        switch (userType) {
            case USER_ROLES.ADMIN: return '#10b981';
            case USER_ROLES.REVIEWER: return '#3b82f6';
            case USER_ROLES.TRANSLATOR: return '#f59e0b';
            case USER_ROLES.TRANSLATOR_ALT: return '#f59e0b';
            default: return '#6b7280';
        }
    }
}

export default PermissionService;