import { useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { usePermissions } from '../store/PermissionContext';

/**
 * Wrapper component that automatically loads permissions when project changes
 * Use this to wrap your project-specific pages
 * 
 * @example
 * <ProjectPermissionLoader>
 *   <YourProjectPage />
 * </ProjectPermissionLoader>
 */
export default function ProjectPermissionLoader({ children, fallback = null, loadingComponent = null }) {
  const { currentProject } = useProject();
  const { loadPermissions, clearPermissions, loading, error } = usePermissions();

  useEffect(() => {
    if (currentProject?.id) {
      loadPermissions(currentProject.id);
    } else {
      clearPermissions();
    }
  }, [currentProject?.id, loadPermissions, clearPermissions]);

  // No project selected
  if (!currentProject) {
    return fallback || (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Please select a project</h2>
        <p className="text-gray-500 mt-2">Choose a project from the sidebar to continue</p>
      </div>
    );
  }

  // Loading permissions
  if (loading) {
    return loadingComponent || (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading permissions...</p>
      </div>
    );
  }

  // Error loading permissions
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Permissions</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => loadPermissions(currentProject.id)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success - render children
  return children;
}
