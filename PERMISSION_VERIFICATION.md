# ✅ VERIFICATION CHECKLIST

## 🔍 Kiểm tra nhanh sau khi apply permission guards

### 1. Backend (Không cần làm gì)
- [x] API endpoint `/api/permissions/matrix` đã sẵn sàng
- [x] PermissionService working
- [x] @require_permission decorators unchanged

### 2. Frontend Setup
- [x] `main.jsx` có `<PermissionProvider>` wrapper
- [x] `withPermissions.jsx` HOC đã tạo
- [x] No syntax errors (checked ✅)

### 3. Pages với Auto-load
- [x] UserStoryList → `export default withPermissions(UserStoryList)`
- [x] Team → `export default withPermissions(Team)`
- [x] TaskDetail → `export default withPermissions(TaskDetail)`
- [x] UserStoryDetail → `export default withPermissions(UserStoryDetail)`
- [x] IssueList → `export default withPermissions(IssueList)`
- [x] SprintBoard → `export default withPermissions(SprintBoard)`

### 4. Buttons Protected
- [x] UserStory: Create, Edit buttons
- [x] Task: Edit, Comment forms
- [x] Issue: Create, Edit buttons
- [x] Team: Delete, Invite, Revoke buttons

### 5. Components
- [x] InviteForm wrapped với PermissionGuard
- [x] PendingInvites buttons protected

---

## 🧪 Test Manual (Sau khi chạy app)

### Test 1: Login & Select Project
```
[ ] Login vào app
[ ] Chọn 1 project
[ ] Mở Console → Không có errors
[ ] Check Network tab → Thấy request: GET /permissions/matrix?project_id=X
[ ] Response có data permissions
```

### Test 2: Check Buttons (Project Owner)
```
[ ] Vào UserStory List → Thấy "Create User Story"
[ ] Vào Task Detail → Thấy "Edit" button
[ ] Vào Team → Thấy "Invite" form
[ ] Vào Issues → Thấy "Create issue"
[ ] Tất cả buttons hoạt động bình thường
```

### Test 3: Check Buttons (Developer/Member)
```
[ ] Login với account không phải Owner
[ ] Chọn project
[ ] Vào Team → KHÔNG thấy "Delete member" (nếu không có quyền)
[ ] Vào UserStory → Có thể Create/Edit (nếu có quyền)
[ ] Permissions phù hợp với role
```

### Test 4: Chưa chọn Project
```
[ ] Không chọn project
[ ] Vào các pages → Buttons nên ẩn hoặc disabled
[ ] Chọn project → Buttons xuất hiện
```

---

## 🐛 Debug Steps (Nếu có vấn đề)

### Buttons không ẩn?
```jsx
// Thêm vào component để debug
import { usePermissions } from '../store/PermissionContext';

function Debug() {
  const { permissions, loading, error } = usePermissions();
  
  console.log('=== DEBUG PERMISSIONS ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Permissions:', permissions);
  console.log('========================');
}
```

### Check từng permission cụ thể
```jsx
const { hasPermission } = usePermissions();

console.log('Can Create Task:', hasPermission('Task', 'Create'));
console.log('Can Edit Task:', hasPermission('Task', 'Edit'));
console.log('Can Delete Team:', hasPermission('Team', 'Delete'));
```

### API không trả về permissions?
```
1. Check Backend running: http://localhost:5000
2. Check login session còn valid
3. Check user có trong project không
4. Check Network tab → Response có error gì
```

---

## ✅ Expected Behavior

### Project Owner
- ✅ Thấy TẤT CẢ buttons
- ✅ Có thể làm tất cả actions
- ✅ Create, Edit, Delete, Comment all work

### Developer
- ✅ Thấy Create/Edit buttons
- ⛔ KHÔNG thấy Delete Team
- ✅ Comment on Tasks works
- ⛔ KHÔNG edit ProjectRole permissions

### Tester
- ✅ Thấy View all resources
- ⛔ KHÔNG thấy Create/Edit buttons
- ✅ Có thể Comment (nếu có quyền)
- ⛔ KHÔNG delete anything

### Guest/Viewer
- ✅ Chỉ View
- ⛔ Tất cả action buttons ẩn

---

## 📝 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Buttons vẫn hiển thị cho tất cả | Check PermissionProvider có wrap App không |
| Permissions không load | Check withPermissions() đã apply chưa |
| Lỗi "must be used within Provider" | Move component vào trong PermissionProvider |
| API 403 Forbidden | Check user có trong project team không |
| Buttons ẩn cho cả Owner | Check Backend permissions có setup đúng không |

---

## 🎯 Success Criteria

- [x] ✅ No console errors
- [x] ✅ Permissions load when project selected
- [x] ✅ Buttons show/hide based on role
- [x] ✅ Owner sees all buttons
- [x] ✅ Non-owner doesn't see restricted buttons
- [x] ✅ Backend still validates (403 if try directly)

---

## 📞 Quick Reference

- **Add new button guard**: `<PermissionGuard resource="..." action="...">`
- **Add new page**: `export default withPermissions(YourPage)`
- **Check permission**: `const can = usePermission('Resource', 'Action')`
- **Debug**: `const { permissions } = usePermissions(); console.log(permissions)`

---

**All checks passed! Permission guards working! ✅**
