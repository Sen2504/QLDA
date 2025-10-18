import { usePermissions } from "../store/PermissionContext";

/**
 * Component wrapper to conditionally render children based on permissions
 * 
 * Usage:
 * <PermissionGuard resource="Task" action="Create">
 *   <button>Create Task</button>
 * </PermissionGuard>
 * 
 * Or with fallback:
 * <PermissionGuard resource="Task" action="Delete" fallback={<span>No access</span>}>
 *   <button>Delete Task</button>
 * </PermissionGuard>
 * 
 * Or to disable instead of hide:
 * <PermissionGuard resource="Task" action="Edit" mode="disable">
 *   <button>Edit Task</button>
 * </PermissionGuard>
 */
export default function PermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback = null,
  mode = "hide" // "hide" | "disable"
}) {
  const { hasPermission, loading } = usePermissions();

  // While loading, you can show skeleton or nothing
  if (loading) {
    return mode === "hide" ? fallback : children;
  }

  const allowed = hasPermission(resource, action);

  if (mode === "disable") {
    // Clone children and add disabled prop
    if (!allowed && children?.props) {
      return (
        <>
          {typeof children === "function" 
            ? children({ disabled: true })
            : children.type 
              ? { ...children, props: { ...children.props, disabled: true } }
              : children
          }
        </>
      );
    }
    return children;
  }

  // Default "hide" mode
  return allowed ? children : fallback;
}

/**
 * Higher-order component version
 * 
 * Usage:
 * const ProtectedButton = withPermission("Task", "Create")(MyButton);
 */
export function withPermission(resource, action, options = {}) {
  return function (Component) {
    return function PermissionWrappedComponent(props) {
      const { hasPermission } = usePermissions();
      const allowed = hasPermission(resource, action);

      if (!allowed) {
        return options.fallback || null;
      }

      return <Component {...props} />;
    };
  };
}
