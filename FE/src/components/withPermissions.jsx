import { useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { usePermissions } from '../store/PermissionContext';

/**
 * HOC to automatically load permissions when project changes
 */
export default function withPermissions(Component) {
  return function WrappedComponent(props) {
    const { currentProject } = useProject();
    const { loadPermissions, clearPermissions } = usePermissions();

    useEffect(() => {
      if (currentProject?.id) {
        loadPermissions(currentProject.id);
      } else {
        clearPermissions();
      }
    }, [currentProject?.id, loadPermissions, clearPermissions]);

    return <Component {...props} />;
  };
}
