import { createContext, useContext, useState, useEffect, useCallback } from "react";
import PermissionService from "../services/permissionService";

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  /**
   * Load permissions for a specific project
   * @param {number} projectId - The project ID to load permissions for
   */
  const loadPermissions = useCallback(async (projectId) => {
    if (!projectId) {
      setPermissions(null);
      setCurrentProjectId(null);
      return;
    }

    // If already loaded for this project, skip
    if (currentProjectId === projectId && permissions !== null) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PermissionService.getUserPermissions(projectId);
      setPermissions(response.data);
      setCurrentProjectId(projectId);
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setError(err.response?.data?.error || "Failed to load permissions");
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, permissions]);

  /**
   * Check if user has a specific permission
   * @param {string} resource - Resource name (e.g., "Task", "UserStory")
   * @param {string} action - Action name (e.g., "Create", "Edit", "Delete", "View")
   * @returns {boolean} - true if user has permission, false otherwise
   */
  const hasPermission = useCallback((resource, action) => {
    if (!permissions || !permissions.permissions) {
      return false;
    }

    const resourcePerms = permissions.permissions[resource];
    if (!resourcePerms) {
      return false;
    }

    return resourcePerms[action] === true;
  }, [permissions]);

  /**
   * Clear all permissions (e.g., when user logs out or switches projects)
   */
  const clearPermissions = useCallback(() => {
    setPermissions(null);
    setCurrentProjectId(null);
    setError(null);
  }, []);

  const value = {
    permissions,
    loading,
    error,
    loadPermissions,
    hasPermission,
    clearPermissions,
    roleId: permissions?.role_id,
    roleName: permissions?.role_name,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 * @returns {Object} Permission context value
 */
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

/**
 * Hook to check a specific permission
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {boolean} - true if user has permission
 */
export function usePermission(resource, action) {
  const { hasPermission } = usePermissions();
  return hasPermission(resource, action);
}
