import { useProject } from '../store/ProjectContext';
import { usePermissions } from '../store/PermissionContext';

/**
 * Combined hook for Project + Permission context
 * Auto-loads permissions when project changes
 * 
 * @returns {Object} Combined project and permission context
 */
export function useProjectWithPermissions() {
  const projectContext = useProject();
  const permissionContext = usePermissions();

  return {
    // Project context
    currentProject: projectContext.currentProject,
    setCurrentProject: projectContext.setCurrentProject,
    
    // Permission context
    permissions: permissionContext.permissions,
    permissionLoading: permissionContext.loading,
    permissionError: permissionContext.error,
    loadPermissions: permissionContext.loadPermissions,
    hasPermission: permissionContext.hasPermission,
    clearPermissions: permissionContext.clearPermissions,
    roleId: permissionContext.roleId,
    roleName: permissionContext.roleName,
  };
}

/**
 * Hook to check multiple permissions at once
 * 
 * @param {Array<{resource: string, action: string}>} permissions - Array of permissions to check
 * @returns {Object} Map of permission results
 * 
 * @example
 * const perms = useMultiplePermissions([
 *   { resource: 'Task', action: 'Create' },
 *   { resource: 'Task', action: 'Edit' },
 *   { resource: 'UserStory', action: 'Delete' }
 * ]);
 * // perms = { 'Task.Create': true, 'Task.Edit': true, 'UserStory.Delete': false }
 */
export function useMultiplePermissions(permissionsList) {
  const { hasPermission } = usePermissions();

  return permissionsList.reduce((acc, { resource, action }) => {
    const key = `${resource}.${action}`;
    acc[key] = hasPermission(resource, action);
    return acc;
  }, {});
}

/**
 * Hook to check if user has ANY of the specified permissions
 * 
 * @param {Array<{resource: string, action: string}>} permissions - Array of permissions
 * @returns {boolean} True if user has at least one permission
 * 
 * @example
 * const canManage = useHasAnyPermission([
 *   { resource: 'Team', action: 'Edit' },
 *   { resource: 'ProjectRole', action: 'Edit' }
 * ]);
 */
export function useHasAnyPermission(permissionsList) {
  const { hasPermission } = usePermissions();

  return permissionsList.some(({ resource, action }) => 
    hasPermission(resource, action)
  );
}

/**
 * Hook to check if user has ALL of the specified permissions
 * 
 * @param {Array<{resource: string, action: string}>} permissions - Array of permissions
 * @returns {boolean} True if user has all permissions
 * 
 * @example
 * const isAdmin = useHasAllPermissions([
 *   { resource: 'Team', action: 'Edit' },
 *   { resource: 'ProjectRole', action: 'Edit' },
 *   { resource: 'Sprint', action: 'Delete' }
 * ]);
 */
export function useHasAllPermissions(permissionsList) {
  const { hasPermission } = usePermissions();

  return permissionsList.every(({ resource, action }) => 
    hasPermission(resource, action)
  );
}

/**
 * Hook to get all permissions for a specific resource
 * 
 * @param {string} resource - Resource name
 * @returns {Object} Map of actions to boolean values
 * 
 * @example
 * const taskPerms = useResourcePermissions('Task');
 * // taskPerms = { View: true, Create: true, Edit: false, Delete: false, Comment: true }
 */
export function useResourcePermissions(resource) {
  const { permissions } = usePermissions();

  if (!permissions || !permissions.permissions || !permissions.permissions[resource]) {
    return {};
  }

  return permissions.permissions[resource];
}

/**
 * Hook to check if user is Project Owner
 * (Has all permissions in ProjectRole resource)
 * 
 * @returns {boolean} True if user is Project Owner
 */
export function useIsProjectOwner() {
  const { roleName } = usePermissions();
  return roleName === 'Project Owner';
}
