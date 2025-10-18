# Quick Start: Permission System

## 🚀 Cài đặt nhanh (5 phút)

### 1. Setup Providers (1 lần duy nhất)

```jsx
// FE/src/main.jsx
import { ProjectProvider } from './store/ProjectContext';
import { PermissionProvider } from './store/PermissionContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ProjectProvider>
    <PermissionProvider>
      <App />
    </PermissionProvider>
  </ProjectProvider>
);
```

### 2. Tự động load permissions với Wrapper

**Cách 1: Dùng ProjectPermissionLoader (Khuyến nghị - Đơn giản nhất)**

```jsx
import ProjectPermissionLoader from './components/ProjectPermissionLoader';

function ProjectPage() {
  return (
    <ProjectPermissionLoader>
      <YourProjectContent />
    </ProjectPermissionLoader>
  );
}
```

**Cách 2: Manual load trong component**

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

  // Your code...
}
```

## 💡 Sử dụng cơ bản

### A. Ẩn/Hiện button

```jsx
import PermissionGuard from './components/PermissionGuard';

// Ẩn hoàn toàn nếu không có quyền
<PermissionGuard resource="Task" action="Create">
  <button>Create Task</button>
</PermissionGuard>
```

### B. Disable button

```jsx
// Disable thay vì ẩn
<PermissionGuard resource="Task" action="Edit" mode="disable">
  <button>Edit Task</button>
</PermissionGuard>
```

### C. Check trong code

```jsx
import { usePermission } from './store/PermissionContext';

function MyComponent() {
  const canCreate = usePermission('Task', 'Create');
  const canDelete = usePermission('Task', 'Delete');

  return (
    <div>
      {canCreate && <button>Create</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

### D. Sử dụng custom hooks

```jsx
import { useProjectWithPermissions } from './hooks/usePermissions';

function MyComponent() {
  const { 
    currentProject,      // From ProjectContext
    hasPermission,       // From PermissionContext
    roleName,            // User's role name
    permissionLoading    // Loading state
  } = useProjectWithPermissions();

  if (permissionLoading) return <Loading />;

  return (
    <div>
      <h1>{currentProject.name}</h1>
      <p>Your role: {roleName}</p>
      
      {hasPermission('Task', 'Create') && (
        <button>Create Task</button>
      )}
    </div>
  );
}
```

## 📋 Resource & Action Reference

### Resources (Tài nguyên)
- `Task` - Công việc
- `UserStory` - User Story
- `Sprint` - Sprint
- `Issue` - Vấn đề/Bug
- `Team` - Thành viên team
- `ProjectRole` - Vai trò trong project

### Actions (Hành động)
- `View` - Xem
- `Create` - Tạo mới
- `Edit` - Sửa
- `Delete` - Xóa
- `Comment` - Bình luận (chỉ Task)

## 🎯 Ví dụ thực tế

### Task List với permissions

```jsx
import PermissionGuard from './components/PermissionGuard';
import { usePermission } from './store/PermissionContext';

function TaskList({ tasks }) {
  const canEdit = usePermission('Task', 'Edit');
  const canDelete = usePermission('Task', 'Delete');

  return (
    <div>
      <PermissionGuard resource="Task" action="Create">
        <button className="btn-primary">+ New Task</button>
      </PermissionGuard>

      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <h3>{task.title}</h3>
          
          <div className="actions">
            {canEdit && (
              <button onClick={() => editTask(task)}>Edit</button>
            )}
            
            {canDelete && (
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Navigation Menu

```jsx
import PermissionGuard from './components/PermissionGuard';

function ProjectNav() {
  return (
    <nav>
      <PermissionGuard resource="UserStory" action="View">
        <a href="/user-stories">User Stories</a>
      </PermissionGuard>

      <PermissionGuard resource="Task" action="View">
        <a href="/tasks">Tasks</a>
      </PermissionGuard>

      <PermissionGuard resource="Sprint" action="View">
        <a href="/sprints">Sprints</a>
      </PermissionGuard>

      <PermissionGuard resource="Team" action="View">
        <a href="/team">Team</a>
      </PermissionGuard>

      <PermissionGuard resource="ProjectRole" action="Edit">
        <a href="/settings">⚙️ Settings</a>
      </PermissionGuard>
    </nav>
  );
}
```

### Form với conditional submit

```jsx
function TaskForm({ task, onSubmit }) {
  const canEdit = usePermission('Task', 'Edit');
  const canCreate = usePermission('Task', 'Create');
  const isNew = !task?.id;

  const canSubmit = isNew ? canCreate : canEdit;

  if (!canSubmit) {
    return <div>You don't have permission to {isNew ? 'create' : 'edit'} tasks</div>;
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="title" defaultValue={task?.title} />
      <textarea name="description" defaultValue={task?.description} />
      
      <button type="submit" disabled={!canSubmit}>
        {isNew ? 'Create' : 'Save'} Task
      </button>

      <PermissionGuard resource="Task" action="Delete">
        <button type="button" onClick={handleDelete}>
          Delete
        </button>
      </PermissionGuard>
    </form>
  );
}
```

### Advanced: Multiple permissions

```jsx
import { useHasAnyPermission, useHasAllPermissions } from './hooks/usePermissions';

function AdminPanel() {
  // Check if user has ANY admin permission
  const hasAnyAdmin = useHasAnyPermission([
    { resource: 'Team', action: 'Edit' },
    { resource: 'ProjectRole', action: 'Edit' }
  ]);

  // Check if user has ALL required permissions
  const isFullAdmin = useHasAllPermissions([
    { resource: 'Team', action: 'Edit' },
    { resource: 'ProjectRole', action: 'Edit' },
    { resource: 'Sprint', action: 'Delete' }
  ]);

  if (!hasAnyAdmin) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      
      {isFullAdmin && (
        <div className="danger-zone">
          <button>Delete Project</button>
        </div>
      )}
    </div>
  );
}
```

## ⚠️ Lưu ý quan trọng

### ✅ DO

1. **Luôn validate ở Backend**
   ```python
   @require_permission("Task", "Create")
   def create_task():
       # Safe!
   ```

2. **Load permissions khi chọn project**
   ```jsx
   useEffect(() => {
     if (currentProject?.id) {
       loadPermissions(currentProject.id);
     }
   }, [currentProject?.id]);
   ```

3. **Clear permissions khi logout**
   ```jsx
   const logout = () => {
     clearPermissions();
     // ... other logout
   };
   ```

### ❌ DON'T

1. **Không tin tưởng 100% FE permissions**
   - FE chỉ là UX improvement
   - BE là source of truth

2. **Không hardcode role names**
   ```jsx
   // ❌ Bad
   if (roleName === "Project Owner") { }
   
   // ✅ Good
   if (hasPermission("ProjectRole", "Edit")) { }
   ```

3. **Không skip loading state**
   ```jsx
   // ❌ Bad - Flash of wrong content
   const canCreate = usePermission('Task', 'Create');
   
   // ✅ Good
   const { loading, hasPermission } = usePermissions();
   if (loading) return <Skeleton />;
   const canCreate = hasPermission('Task', 'Create');
   ```

## 🐛 Troubleshooting

### Permissions luôn false?
```jsx
// Kiểm tra đã load chưa
const { permissions, loading, error } = usePermissions();
console.log({ permissions, loading, error });

// Kiểm tra project ID
const { currentProject } = useProject();
console.log('Project:', currentProject);
```

### UI không update?
```jsx
// Force reload permissions
const { loadPermissions } = usePermissions();
loadPermissions(currentProject.id);
```

### Lỗi "must be used within Provider"?
```jsx
// Đảm bảo wrap App
<PermissionProvider>
  <YourComponent />  {/* ✅ OK */}
</PermissionProvider>

<YourComponent />  {/* ❌ Error! */}
```

## 📚 Tài liệu đầy đủ

Xem thêm:
- `FE/PERMISSION_GUIDE.md` - Chi tiết đầy đủ
- `PERMISSION_IMPLEMENTATION.md` - Technical implementation
- `FE/src/components/ProjectDashboardExample.jsx` - Full example

## 🎓 Ví dụ hoàn chỉnh

Xem file: `FE/src/components/ProjectDashboardExample.jsx`

Chạy thử:
```jsx
import ProjectDashboardExample from './components/ProjectDashboardExample';

<ProjectDashboardExample />
```
