# Migration Checklist: Permission System

## ✅ Các files đã tạo/cập nhật

### Backend
- ✅ `BE/flask_api/routes/permission_routes.py` - Added `/matrix` endpoint
- ✅ `BE/flask_api/services/permission_service.py` - Added `get_user_permissions_in_project()`
- ✅ `BE/tests/test_permission_api.py` - Test cases

### Frontend
- ✅ `FE/src/services/permissionService.js` - Added `getUserPermissions()`
- ✅ `FE/src/store/PermissionContext.jsx` - **NEW** - Context & hooks
- ✅ `FE/src/components/PermissionGuard.jsx` - **NEW** - Guard component
- ✅ `FE/src/components/ProjectPermissionLoader.jsx` - **NEW** - Auto-loader wrapper
- ✅ `FE/src/components/ProjectDashboardExample.jsx` - **NEW** - Full example
- ✅ `FE/src/hooks/usePermissions.js` - **NEW** - Custom hooks

### Documentation
- ✅ `PERMISSION_IMPLEMENTATION.md` - Technical implementation guide
- ✅ `FE/PERMISSION_GUIDE.md` - Comprehensive usage guide
- ✅ `QUICK_START_PERMISSIONS.md` - Quick reference

## 🔧 Cần làm để áp dụng

### 1. Backend (Không cần thay đổi gì)
Backend đã sẵn sàng. API endpoint `/api/permissions/matrix?project_id=X` hoạt động ngay.

### 2. Frontend - Bắt buộc

#### Step 1: Wrap App với Providers

**File: `FE/src/main.jsx`**

```jsx
import { ProjectProvider } from './store/ProjectContext';
import { PermissionProvider } from './store/PermissionContext';  // ← ADD THIS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <PermissionProvider>  {/* ← ADD THIS */}
          <App />
        </PermissionProvider>  {/* ← ADD THIS */}
      </ProjectProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 3. Frontend - Tùy chọn (Migrate từng trang)

Bạn có thể migrate từng trang một, hoặc wrap toàn bộ project layout:

#### Option A: Wrap project layout (Recommended)

**File: `FE/src/layouts/ProjectLayout.jsx`** (hoặc tương tự)

```jsx
import ProjectPermissionLoader from '../components/ProjectPermissionLoader';

function ProjectLayout({ children }) {
  return (
    <ProjectPermissionLoader>
      <div className="project-layout">
        <Sidebar />
        <main>
          {children}
        </main>
      </div>
    </ProjectPermissionLoader>
  );
}
```

#### Option B: Load manually trong từng page

```jsx
import { useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { usePermissions } from '../store/PermissionContext';

function YourPage() {
  const { currentProject } = useProject();
  const { loadPermissions, clearPermissions } = usePermissions();

  useEffect(() => {
    if (currentProject?.id) {
      loadPermissions(currentProject.id);
    } else {
      clearPermissions();
    }
  }, [currentProject?.id, loadPermissions, clearPermissions]);

  // Rest of your component...
}
```

### 4. Thêm Permission Guards vào UI

Migrate từng component một khi cần:

**Before:**
```jsx
<button onClick={createTask}>Create Task</button>
<button onClick={deleteTask}>Delete Task</button>
```

**After:**
```jsx
import PermissionGuard from '../components/PermissionGuard';

<PermissionGuard resource="Task" action="Create">
  <button onClick={createTask}>Create Task</button>
</PermissionGuard>

<PermissionGuard resource="Task" action="Delete">
  <button onClick={deleteTask}>Delete Task</button>
</PermissionGuard>
```

## 🎯 Ưu tiên migrate

### High Priority (Nên làm ngay)

1. **Create buttons** - Ẩn khi user không có quyền Create
   ```jsx
   <PermissionGuard resource="Task" action="Create">
     <button>+ New Task</button>
   </PermissionGuard>
   ```

2. **Delete buttons** - Ẩn khi user không có quyền Delete
   ```jsx
   <PermissionGuard resource="Task" action="Delete">
     <button>Delete</button>
   </PermissionGuard>
   ```

3. **Forms** - Disable hoặc redirect khi không có quyền
   ```jsx
   function TaskForm() {
     const canEdit = usePermission('Task', 'Edit');
     if (!canEdit) return <Navigate to="/access-denied" />;
     // ...
   }
   ```

### Medium Priority

4. **Navigation menus** - Ẩn menu items
   ```jsx
   <PermissionGuard resource="Team" action="View">
     <NavLink to="/team">Team</NavLink>
   </PermissionGuard>
   ```

5. **Settings/Admin pages** - Protect entire pages
   ```jsx
   <PermissionGuard resource="ProjectRole" action="Edit">
     <SettingsPage />
   </PermissionGuard>
   ```

### Low Priority

6. **Nice-to-have UI hints** - Tooltips, badges, etc.

## 📝 Example Migration: Task List

### Before

```jsx
function TaskList({ tasks }) {
  return (
    <div>
      <button onClick={handleCreate}>+ New Task</button>
      
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <button onClick={() => handleEdit(task)}>Edit</button>
          <button onClick={() => handleDelete(task)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### After

```jsx
import PermissionGuard from '../components/PermissionGuard';
import { usePermission } from '../store/PermissionContext';

function TaskList({ tasks }) {
  const canEdit = usePermission('Task', 'Edit');
  const canDelete = usePermission('Task', 'Delete');

  return (
    <div>
      <PermissionGuard resource="Task" action="Create">
        <button onClick={handleCreate}>+ New Task</button>
      </PermissionGuard>
      
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          
          {canEdit && (
            <button onClick={() => handleEdit(task)}>Edit</button>
          )}
          
          {canDelete && (
            <button onClick={() => handleDelete(task)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Testing Checklist

### Backend
- [ ] Test API endpoint: `GET /api/permissions/matrix?project_id=1`
- [ ] Verify response structure
- [ ] Test with different roles (Owner, Developer, Tester, etc.)
- [ ] Test error cases (not member, invalid project, etc.)

### Frontend
- [ ] Test PermissionContext loads permissions
- [ ] Test PermissionGuard hides/shows elements correctly
- [ ] Test permission hooks return correct values
- [ ] Test ProjectPermissionLoader auto-loads on project change
- [ ] Test clearing permissions on logout

### Integration
- [ ] User with Create permission can see Create button
- [ ] User without Delete permission cannot see Delete button
- [ ] Project Owner has all permissions
- [ ] View permissions work for UserStory, Sprint, Issue
- [ ] Comment permission only applies to Task

## 🚀 Rollout Strategy

### Phase 1: Setup (Day 1)
1. Add PermissionProvider to App
2. Test basic permission loading
3. Verify API works

### Phase 2: Critical Features (Day 2-3)
1. Protect Create/Delete buttons
2. Add guards to important forms
3. Test with real users

### Phase 3: Full Coverage (Day 4-7)
1. Migrate all components gradually
2. Update navigation menus
3. Add permission checks to all actions

### Phase 4: Polish (Day 8+)
1. Add loading states
2. Improve error handling
3. Add UX improvements (tooltips, etc.)

## 🐛 Known Issues & Fixes

### Issue: Permissions don't load
**Fix:** Ensure `loadPermissions(projectId)` is called after project selection

### Issue: UI doesn't update after permission change
**Fix:** Call `loadPermissions(projectId)` again or reload page

### Issue: "usePermissions must be used within Provider"
**Fix:** Ensure component is inside `<PermissionProvider>`

## 📞 Support

- **Full Guide:** `FE/PERMISSION_GUIDE.md`
- **Quick Start:** `QUICK_START_PERMISSIONS.md`
- **Example:** `FE/src/components/ProjectDashboardExample.jsx`
- **Technical:** `PERMISSION_IMPLEMENTATION.md`

## ✨ Benefits

### Before
- User fills entire form
- Clicks Submit
- Gets error "No permission"
- Frustrating UX ❌

### After
- User sees form is disabled
- Or Create button is hidden
- Knows immediately they don't have access
- Professional UX ✅

Backend still validates everything for security! 🔒
