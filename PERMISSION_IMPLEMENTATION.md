# Permission System Implementation

## Tổng quan

Hệ thống phân quyền 2 lớp:
- **Backend**: Bảo mật tuyệt đối với `@require_permission` decorator
- **Frontend**: UX improvement - ẩn/disable UI elements sớm để tránh thao tác vô ích

## Backend Changes

### 1. New API Endpoint

**GET** `/api/permissions/matrix?project_id=X`

Trả về permissions của user hiện tại trong project:

```json
{
  "role_id": 1,
  "role_name": "Developer",
  "permissions": {
    "Task": {
      "View": true,
      "Create": true,
      "Edit": true,
      "Delete": false,
      "Comment": true
    },
    "UserStory": {
      "View": true,
      "Create": true,
      "Edit": true,
      "Delete": false
    }
  }
}
```

### 2. New Service Method

```python
# flask_api/services/permission_service.py
PermissionService.get_user_permissions_in_project(user_id, project_id)
```

### 3. Updated Files

- ✅ `BE/flask_api/routes/permission_routes.py` - Added `/matrix` endpoint
- ✅ `BE/flask_api/services/permission_service.py` - Added `get_user_permissions_in_project()`

## Frontend Changes

### 1. New Context

**`FE/src/store/PermissionContext.jsx`**

Provider để quản lý permissions trong app:

```jsx
import { PermissionProvider, usePermissions, usePermission } from './store/PermissionContext';
```

### 2. New Component

**`FE/src/components/PermissionGuard.jsx`**

Component để wrap UI elements cần permission:

```jsx
import PermissionGuard from './components/PermissionGuard';

<PermissionGuard resource="Task" action="Create">
  <button>Create Task</button>
</PermissionGuard>
```

### 3. Updated Service

**`FE/src/services/permissionService.js`**

Added method:
```javascript
PermissionService.getUserPermissions(projectId)
```

### 4. New Files

- ✅ `FE/src/store/PermissionContext.jsx` - Permission context & hooks
- ✅ `FE/src/components/PermissionGuard.jsx` - Guard component
- ✅ `FE/src/components/ProjectDashboardExample.jsx` - Example implementation
- ✅ `FE/PERMISSION_GUIDE.md` - Comprehensive usage guide

## Setup Instructions

### Backend

No additional setup required. The new endpoint is ready to use.

### Frontend

#### Step 1: Wrap App with Providers

```jsx
// FE/src/main.jsx or App.jsx
import { ProjectProvider } from './store/ProjectContext';
import { PermissionProvider } from './store/PermissionContext';

function App() {
  return (
    <ProjectProvider>
      <PermissionProvider>
        {/* Your app components */}
      </PermissionProvider>
    </ProjectProvider>
  );
}
```

#### Step 2: Load Permissions on Project Change

```jsx
import { useEffect } from 'react';
import { useProject } from './store/ProjectContext';
import { usePermissions } from './store/PermissionContext';

function YourComponent() {
  const { currentProject } = useProject();
  const { loadPermissions, clearPermissions } = usePermissions();

  useEffect(() => {
    if (currentProject?.id) {
      loadPermissions(currentProject.id);
    } else {
      clearPermissions();
    }
  }, [currentProject?.id, loadPermissions, clearPermissions]);

  // Your component code...
}
```

#### Step 3: Use Permissions

```jsx
import { usePermission } from './store/PermissionContext';
import PermissionGuard from './components/PermissionGuard';

function TaskList() {
  const canCreateTask = usePermission('Task', 'Create');

  return (
    <div>
      {/* Method 1: Using hook */}
      {canCreateTask && (
        <button>Create Task</button>
      )}

      {/* Method 2: Using PermissionGuard */}
      <PermissionGuard resource="Task" action="Edit">
        <button>Edit Task</button>
      </PermissionGuard>

      {/* Method 3: Disable instead of hide */}
      <PermissionGuard resource="Task" action="Delete" mode="disable">
        <button>Delete Task</button>
      </PermissionGuard>
    </div>
  );
}
```

## Usage Examples

### Simple Permission Check

```jsx
const canEdit = usePermission('Task', 'Edit');
if (canEdit) {
  // Show edit button
}
```

### Hide UI Element

```jsx
<PermissionGuard resource="Task" action="Delete">
  <button className="danger">Delete</button>
</PermissionGuard>
```

### Disable UI Element

```jsx
<PermissionGuard resource="Task" action="Edit" mode="disable">
  <input type="text" name="title" />
</PermissionGuard>
```

### With Fallback

```jsx
<PermissionGuard 
  resource="Sprint" 
  action="Create"
  fallback={<span className="text-gray-400">No permission</span>}
>
  <button>Create Sprint</button>
</PermissionGuard>
```

### Multiple Permissions

```jsx
const { hasPermission } = usePermissions();

const canManageProject = 
  hasPermission('Team', 'Edit') && 
  hasPermission('ProjectRole', 'Edit');

if (canManageProject) {
  // Show admin panel
}
```

## Available Resources & Actions

### Resources
- `Task`
- `UserStory`
- `Sprint`
- `Issue`
- `Team`
- `ProjectRole`
- (và các resources khác trong DB)

### Actions
- `View` - Xem
- `Create` - Tạo mới
- `Edit` - Chỉnh sửa
- `Delete` - Xóa
- `Comment` - Bình luận (chỉ cho Task)

## Important Notes

### ✅ Best Practices

1. **Always validate on Backend**
   - Frontend permission checks are for UX only
   - Backend `@require_permission` is the source of truth

2. **Load permissions early**
   - Load when user selects/changes project
   - Clear when user logs out

3. **Handle loading state**
   ```jsx
   const { loading } = usePermissions();
   if (loading) return <Skeleton />;
   ```

4. **Clear on logout**
   ```jsx
   const handleLogout = () => {
     clearPermissions();
     // ... other logout logic
   };
   ```

### ❌ Common Mistakes

1. **Don't trust Frontend permissions for security**
   - Always re-check on Backend
   
2. **Don't hardcode role names**
   ```jsx
   // ❌ Bad
   if (roleName === "Project Owner") { ... }
   
   // ✅ Good
   if (hasPermission("ProjectRole", "Edit")) { ... }
   ```

3. **Don't skip permission loading**
   - Must call `loadPermissions(projectId)` after selecting project

## Testing

### Backend API Test

```bash
curl -X GET "http://localhost:5000/api/permissions/matrix?project_id=1" \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

Expected response:
```json
{
  "role_id": 1,
  "role_name": "Developer",
  "permissions": { ... }
}
```

### Frontend Test

1. Open DevTools Console
2. Check permission context:
   ```javascript
   // Should see permissions loaded
   console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
   ```

3. Verify UI elements show/hide based on permissions

## Migration Guide

### Updating Existing Components

Before:
```jsx
function TaskActions() {
  return (
    <div>
      <button>Create Task</button>
      <button>Edit Task</button>
      <button>Delete Task</button>
    </div>
  );
}
```

After:
```jsx
import PermissionGuard from './components/PermissionGuard';

function TaskActions() {
  return (
    <div>
      <PermissionGuard resource="Task" action="Create">
        <button>Create Task</button>
      </PermissionGuard>
      
      <PermissionGuard resource="Task" action="Edit">
        <button>Edit Task</button>
      </PermissionGuard>
      
      <PermissionGuard resource="Task" action="Delete">
        <button>Delete Task</button>
      </PermissionGuard>
    </div>
  );
}
```

## Troubleshooting

### Permissions always return false
- ✅ Check if `loadPermissions(projectId)` was called
- ✅ Verify user is member of the project
- ✅ Check API response in Network tab

### UI doesn't update after permission change
- ✅ Call `loadPermissions(projectId)` again to refresh
- ✅ Or reload the page

### "usePermissions must be used within PermissionProvider" error
- ✅ Ensure component is wrapped in `<PermissionProvider>`
- ✅ Check import path is correct

## Documentation

See **`FE/PERMISSION_GUIDE.md`** for comprehensive usage guide with more examples.

## Example Component

See **`FE/src/components/ProjectDashboardExample.jsx`** for a full working example.
