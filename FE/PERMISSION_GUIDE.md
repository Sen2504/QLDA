# Permission System - Frontend Integration Guide

## Tổng quan

Hệ thống permission giúp kiểm tra quyền của user trên Frontend để cải thiện UX, trong khi vẫn đảm bảo bảo mật tuyệt đối ở Backend.

### Flow hoạt động:

1. **Backend**: Luôn kiểm tra permission bằng `@require_permission` decorator
2. **Frontend**: Ẩn/disable UI elements sớm để tránh thao tác vô ích

## Setup

### 1. Wrap App với PermissionProvider

```jsx
// main.jsx hoặc App.jsx
import { PermissionProvider } from './store/PermissionContext';
import { ProjectProvider } from './store/ProjectContext';

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

### 2. Load permissions khi user chọn project

```jsx
import { useProject } from './store/ProjectContext';
import { usePermissions } from './store/PermissionContext';
import { useEffect } from 'react';

function ProjectLayout() {
  const { currentProject } = useProject();
  const { loadPermissions, clearPermissions } = usePermissions();

  useEffect(() => {
    if (currentProject?.id) {
      loadPermissions(currentProject.id);
    } else {
      clearPermissions();
    }
  }, [currentProject?.id, loadPermissions, clearPermissions]);

  return (
    <div>
      {/* Your project content */}
    </div>
  );
}
```

## Cách sử dụng

### 1. Sử dụng Hook `usePermission`

Kiểm tra permission đơn giản trong component:

```jsx
import { usePermission } from './store/PermissionContext';

function TaskList() {
  const canCreateTask = usePermission('Task', 'Create');
  const canEditTask = usePermission('Task', 'Edit');
  const canDeleteTask = usePermission('Task', 'Delete');

  return (
    <div>
      {canCreateTask && (
        <button onClick={handleCreate}>Create Task</button>
      )}
      
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.title}</span>
          {canEditTask && <button onClick={() => handleEdit(task)}>Edit</button>}
          {canDeleteTask && <button onClick={() => handleDelete(task)}>Delete</button>}
        </div>
      ))}
    </div>
  );
}
```

### 2. Sử dụng Component `PermissionGuard`

#### Ẩn hoàn toàn (mode: hide)

```jsx
import PermissionGuard from './components/PermissionGuard';

function TaskActions() {
  return (
    <div>
      <PermissionGuard resource="Task" action="Create">
        <button>Create Task</button>
      </PermissionGuard>

      <PermissionGuard resource="Task" action="Delete">
        <button className="danger">Delete Task</button>
      </PermissionGuard>
    </div>
  );
}
```

#### Disable thay vì ẩn (mode: disable)

```jsx
<PermissionGuard resource="Task" action="Edit" mode="disable">
  <button>Edit Task</button>
</PermissionGuard>
```

#### Với fallback UI

```jsx
<PermissionGuard 
  resource="Task" 
  action="Create"
  fallback={<span className="text-gray-400">No permission</span>}
>
  <button>Create Task</button>
</PermissionGuard>
```

### 3. Sử dụng Context trực tiếp

Khi cần nhiều thông tin hơn:

```jsx
import { usePermissions } from './store/PermissionContext';

function ProjectHeader() {
  const { 
    permissions, 
    loading, 
    error, 
    hasPermission,
    roleId,
    roleName 
  } = usePermissions();

  if (loading) return <div>Loading permissions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Project Dashboard</h1>
      <p>Your role: {roleName}</p>
      
      {hasPermission('UserStory', 'Create') && (
        <button>Create User Story</button>
      )}
    </div>
  );
}
```

## Resources và Actions

### Resources (Tài nguyên):
- `Task`
- `UserStory`
- `Sprint`
- `Issue`
- `Team`
- `ProjectRole`
- ... (xem thêm trong database)

### Actions (Hành động):
- `View` - Xem
- `Create` - Tạo mới
- `Edit` - Chỉnh sửa
- `Delete` - Xóa
- `Comment` - Bình luận (chỉ áp dụng cho Task)

## Ví dụ thực tế

### Task Management

```jsx
function TaskCard({ task }) {
  const canEdit = usePermission('Task', 'Edit');
  const canDelete = usePermission('Task', 'Delete');
  const canComment = usePermission('Task', 'Comment');

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>

      <div className="actions">
        <PermissionGuard resource="Task" action="Edit">
          <button onClick={() => openEditModal(task)}>
            <EditIcon /> Edit
          </button>
        </PermissionGuard>

        <PermissionGuard resource="Task" action="Delete">
          <button onClick={() => handleDelete(task.id)} className="danger">
            <DeleteIcon /> Delete
          </button>
        </PermissionGuard>
      </div>

      {canComment && (
        <div className="comments">
          <CommentForm taskId={task.id} />
        </div>
      )}
    </div>
  );
}
```

### Form với conditional fields

```jsx
function UserStoryForm({ userStory }) {
  const canEdit = usePermission('UserStory', 'Edit');
  const canDelete = usePermission('UserStory', 'Delete');
  const isNewStory = !userStory?.id;
  const canCreate = usePermission('UserStory', 'Create');

  // Redirect nếu không có quyền
  if (!isNewStory && !canEdit) {
    return <Navigate to="/access-denied" />;
  }
  
  if (isNewStory && !canCreate) {
    return <Navigate to="/access-denied" />;
  }

  return (
    <form>
      <input 
        name="title" 
        disabled={!canEdit && !isNewStory} 
      />
      <textarea 
        name="description" 
        disabled={!canEdit && !isNewStory}
      />
      
      <div className="form-actions">
        <button type="submit" disabled={!canEdit && !canCreate}>
          Save
        </button>
        
        <PermissionGuard resource="UserStory" action="Delete">
          <button type="button" onClick={handleDelete} className="danger">
            Delete
          </button>
        </PermissionGuard>
      </div>
    </form>
  );
}
```

### Navigation Menu

```jsx
function ProjectMenu() {
  return (
    <nav>
      <PermissionGuard resource="UserStory" action="View">
        <NavLink to="/user-stories">User Stories</NavLink>
      </PermissionGuard>

      <PermissionGuard resource="Sprint" action="View">
        <NavLink to="/sprints">Sprints</NavLink>
      </PermissionGuard>

      <PermissionGuard resource="Task" action="View">
        <NavLink to="/tasks">Tasks</NavLink>
      </PermissionGuard>

      <PermissionGuard resource="Team" action="View">
        <NavLink to="/team">Team Members</NavLink>
      </PermissionGuard>

      <PermissionGuard resource="ProjectRole" action="Edit">
        <NavLink to="/permissions">Permissions</NavLink>
      </PermissionGuard>
    </nav>
  );
}
```

## Best Practices

### ✅ DO:

1. **Luôn load permissions khi chọn project**
   ```jsx
   useEffect(() => {
     if (currentProject?.id) {
       loadPermissions(currentProject.id);
     }
   }, [currentProject?.id]);
   ```

2. **Clear permissions khi logout hoặc switch project**
   ```jsx
   const handleLogout = () => {
     clearPermissions();
     // ... other logout logic
   };
   ```

3. **Sử dụng PermissionGuard cho UI elements**
   ```jsx
   <PermissionGuard resource="Task" action="Create">
     <CreateButton />
   </PermissionGuard>
   ```

4. **Backend LUÔN validate lại**
   ```python
   @require_permission("Task", "Create")
   def create_task():
       # ...
   ```

### ❌ DON'T:

1. **Không tin tưởng 100% vào FE permission**
   - Frontend chỉ là UX improvement
   - Backend mới là source of truth

2. **Không hardcode role names**
   ```jsx
   // ❌ Bad
   if (roleName === "Project Owner") { ... }
   
   // ✅ Good
   if (hasPermission("ProjectRole", "Edit")) { ... }
   ```

3. **Không skip loading state**
   ```jsx
   // ❌ Bad
   const canCreate = usePermission('Task', 'Create');
   
   // ✅ Good
   const { loading, hasPermission } = usePermissions();
   if (loading) return <Skeleton />;
   const canCreate = hasPermission('Task', 'Create');
   ```

## API Response Structure

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
    },
    "Sprint": {
      "View": true,
      "Create": false,
      "Edit": false,
      "Delete": false
    }
  }
}
```

## Troubleshooting

### Permission luôn trả về false?
- Kiểm tra đã gọi `loadPermissions(projectId)` chưa
- Xem console có lỗi API không
- Verify user có trong project không

### UI không update sau khi permission thay đổi?
- Gọi lại `loadPermissions(projectId)` để refresh
- Hoặc reload trang

### Lỗi "usePermissions must be used within PermissionProvider"?
- Đảm bảo component nằm trong `<PermissionProvider>`
- Kiểm tra import đúng context

## Integration với ProjectContext

```jsx
// Recommended: Tích hợp vào ProjectContext
import { useProject } from './store/ProjectContext';
import { usePermissions } from './store/PermissionContext';

export function useProjectWithPermissions() {
  const projectContext = useProject();
  const permissionContext = usePermissions();

  return {
    ...projectContext,
    ...permissionContext,
  };
}

// Usage
function MyComponent() {
  const { 
    currentProject, 
    hasPermission, 
    loading 
  } = useProjectWithPermissions();

  if (!currentProject) return <SelectProject />;
  if (loading) return <Loading />;

  return (
    <div>
      <h1>{currentProject.name}</h1>
      {hasPermission('Task', 'Create') && (
        <CreateTaskButton />
      )}
    </div>
  );
}
```
