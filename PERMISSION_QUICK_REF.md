# 🚀 Quick Reference: Permission Guards in Your Project

## ✅ Đã hoàn thành

Permission guards đã được áp dụng cho tất cả buttons quan trọng trong project!

## 🎯 Cách sử dụng

### 1. Buttons tự động ẩn/hiện theo quyền

Không cần làm gì thêm! Các buttons đã được bảo vệ:

#### UserStory List
- ✅ "Create User Story" - Chỉ hiện nếu có quyền Create
- ✅ "Edit" buttons - Chỉ hiện nếu có quyền Edit

#### Task Detail
- ✅ "Edit" button - Ẩn nếu không có quyền
- ✅ Comment form - Chỉ hiện nếu có quyền Comment

#### Issue List
- ✅ "Create issue" - Theo quyền Create
- ✅ "Edit" buttons - Theo quyền Edit

#### Team Management
- ✅ "Invite" form - Chỉ hiện với Team.Edit
- ✅ "Delete member" - Chỉ hiện với Team.Delete
- ✅ "Revoke invite" - Chỉ hiện với Team.Edit

## 🔍 Test các scenarios

### Test 1: Project Owner
```
1. Login với account Project Owner
2. Chọn project
3. → Thấy TẤT CẢ buttons (full access)
```

### Test 2: Developer
```
1. Login với account Developer
2. Chọn project
3. → Thấy: Create/Edit UserStory, Task
4. → KHÔNG thấy: Delete Team, ProjectRole settings
```

### Test 3: Tester
```
1. Login với account Tester
2. Chọn project
3. → Thấy: View all, Comment
4. → KHÔNG thấy: Create/Edit/Delete buttons
```

## 🛠️ Thêm permission guards cho button mới

### Cách 1: Dùng PermissionGuard Component (Khuyến nghị)

```jsx
import PermissionGuard from '../components/PermissionGuard';

<PermissionGuard resource="Task" action="Create">
  <button onClick={createTask}>Create Task</button>
</PermissionGuard>
```

### Cách 2: Dùng usePermission Hook

```jsx
import { usePermission } from '../store/PermissionContext';

function MyComponent() {
  const canDelete = usePermission('Task', 'Delete');
  
  return (
    <>
      {canDelete && (
        <button onClick={deleteTask}>Delete</button>
      )}
    </>
  );
}
```

### Cách 3: Dùng usePermissions Context (Advanced)

```jsx
import { usePermissions } from '../store/PermissionContext';

function MyComponent() {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) return <Loading />;
  
  return (
    <>
      {hasPermission('Sprint', 'Create') && (
        <button>Create Sprint</button>
      )}
      
      {hasPermission('Sprint', 'Delete') && (
        <button>Delete Sprint</button>
      )}
    </>
  );
}
```

## 📋 Available Resources & Actions

### Resources
- `Task`
- `UserStory`
- `Sprint`
- `Issue`
- `Team`
- `ProjectRole`

### Actions
- `View` - Xem (luôn có cho UserStory, Sprint, Issue)
- `Create` - Tạo mới
- `Edit` - Chỉnh sửa
- `Delete` - Xóa
- `Comment` - Bình luận (chỉ Task)

## 🎨 UI Patterns

### Pattern 1: Ẩn button hoàn toàn
```jsx
<PermissionGuard resource="Task" action="Delete">
  <button>Delete</button>
</PermissionGuard>
// Không có quyền → Button hoàn toàn không hiển thị
```

### Pattern 2: Disable button
```jsx
<PermissionGuard resource="Task" action="Edit" mode="disable">
  <button>Edit</button>
</PermissionGuard>
// Không có quyền → Button hiện nhưng disabled
```

### Pattern 3: Với fallback
```jsx
<PermissionGuard 
  resource="Task" 
  action="Create"
  fallback={<span className="text-gray-400">No permission</span>}
>
  <button>Create</button>
</PermissionGuard>
// Không có quyền → Hiện text "No permission"
```

## 🔄 Auto-load Permissions

Các pages đã được setup auto-load:

```jsx
// Mỗi page được wrap với withPermissions()
export default withPermissions(UserStoryList);

// Khi user chọn project:
// 1. Tự động gọi API: /permissions/matrix?project_id=X
// 2. Lưu permissions vào context
// 3. UI tự động update
```

## ⚠️ Lưu ý quan trọng

### ✅ DO

1. **Luôn dùng PermissionGuard cho buttons mới**
   ```jsx
   <PermissionGuard resource="..." action="...">
     <button>...</button>
   </PermissionGuard>
   ```

2. **Backend vẫn phải validate**
   ```python
   @require_permission("Task", "Create")
   def create_task():
       # Backend kiểm tra lại
   ```

3. **Wrap new pages với withPermissions**
   ```jsx
   export default withPermissions(NewPage);
   ```

### ❌ DON'T

1. **KHÔNG tin tưởng 100% Frontend**
   - FE chỉ là UX improvement
   - BE mới là security layer

2. **KHÔNG hardcode role names**
   ```jsx
   // ❌ Bad
   if (roleName === "Project Owner") { }
   
   // ✅ Good
   if (hasPermission("ProjectRole", "Edit")) { }
   ```

3. **KHÔNG skip auto-load**
   - Luôn wrap pages với `withPermissions()`

## 🐛 Debug

### Buttons không ẩn?

```jsx
// Check permissions
import { usePermissions } from '../store/PermissionContext';

function Debug() {
  const { permissions, loading, error } = usePermissions();
  
  console.log('Permissions:', permissions);
  console.log('Loading:', loading);
  console.log('Error:', error);
}
```

### Check từng permission

```jsx
const { hasPermission } = usePermissions();

console.log('Can Create Task:', hasPermission('Task', 'Create'));
console.log('Can Delete Task:', hasPermission('Task', 'Delete'));
console.log('Can Edit Team:', hasPermission('Team', 'Edit'));
```

### Xem toàn bộ permissions

```jsx
const { permissions } = usePermissions();

// In console
console.log('All permissions:', permissions?.permissions);
// Output:
// {
//   "Task": { "View": true, "Create": true, ... },
//   "UserStory": { "View": true, "Create": false, ... }
// }
```

## 📞 Quick Help

### Thêm permission cho button mới?
→ Dùng `<PermissionGuard resource="..." action="...">`

### Tạo page mới?
→ Wrap với `export default withPermissions(YourPage)`

### Check nhiều permissions cùng lúc?
→ Dùng hook `useMultiplePermissions()` trong `hooks/usePermissions.js`

### Button hiện sai?
→ Check Backend đã setup permissions cho role đó chưa

---

## 📚 Tài liệu đầy đủ

- **Quick Start**: `QUICK_START_PERMISSIONS.md`
- **Full Guide**: `FE/PERMISSION_GUIDE.md`
- **Implementation**: `PERMISSION_IMPLEMENTATION.md`
- **Applied List**: `PERMISSION_GUARDS_APPLIED.md`

---

**Hệ thống hoạt động tự động! Chỉ cần login và chọn project.** 🎉
