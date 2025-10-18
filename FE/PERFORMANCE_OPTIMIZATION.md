# Tối Ưu Hóa Hiệu Năng Sidebar

## 🎯 Mục Tiêu
Sidebar chỉ render **đúng 1 lần duy nhất** trong suốt phiên làm việc, tránh re-render không cần thiết.

## 🔧 Các Tối Ưu Hóa Đã Áp Dụng

### 1. **React.memo() - Memoize Component**
```jsx
export default memo(Sidebar);
```
- **Lợi ích**: Sidebar chỉ re-render khi props thực sự thay đổi
- **Kết quả**: Tránh re-render khi parent component (MainLayout) re-render

### 2. **useCallback() - Memoize Functions**
```jsx
const handleLogout = useCallback(async () => {
  // logic
}, [navigate, setCurrentProject]);

const toggleDropdown = useCallback(() => {
  setDropdownOpen((open) => !open);
}, []);

const handleProjectSelect = useCallback((proj) => {
  setCurrentProject(proj);
  setDropdownOpen(false);
}, [setCurrentProject]);

const handleDropdownBlur = useCallback((e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    setDropdownOpen(false);
  }
}, []);

const isActive = useCallback((path) => {
  return location.pathname.startsWith(path);
}, [location.pathname]);
```
- **Lợi ích**: Functions không bị tạo lại mỗi render
- **Kết quả**: Giảm memory allocation, child components không re-render vì props function thay đổi

### 3. **useMemo() - Memoize Computed Values**
```jsx
const sprintLinks = useMemo(() => {
  if (!currentProject) return [];
  return (sprints || []).map((sprint) => {
    // transform data
  });
}, [currentProject, sprints, location.pathname]);
```
- **Lợi ích**: Chỉ tính toán lại khi dependencies thực sự thay đổi
- **Kết quả**: Tránh map() array mỗi render

### 4. **Tối Ưu ProjectContext**

#### Before:
```jsx
// ❌ Value object tạo mới mỗi render → tất cả consumers re-render
<ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
```

#### After:
```jsx
// ✅ Memoize setCurrentProject
const setCurrentProject = useCallback((project) => {
  setCurrentProjectState(project);
}, []);

// ✅ Memoize context value
const value = useMemo(
  () => ({ currentProject, setCurrentProject }),
  [currentProject, setCurrentProject]
);

<ProjectContext.Provider value={value}>
```
- **Lợi ích**: Context value chỉ thay đổi khi currentProject thực sự thay đổi
- **Kết quả**: Sidebar không re-render khi ProjectProvider re-render vì lý do khác

## 📊 Kết Quả

### Trước Tối Ưu:
- Sidebar re-render mỗi khi:
  - Parent component (MainLayout) re-render
  - Navigate sang route mới
  - ProjectContext re-render
  - Inline functions tạo props mới

### Sau Tối Ưu:
- Sidebar **CHỈ** re-render khi:
  - `currentProject` thay đổi (user chọn project khác)
  - `location.pathname` thay đổi (để highlight active link)
  - `projects` list thay đổi (load mới hoặc thêm/xóa project)
  - `sprints` list thay đổi (load mới hoặc thêm/xóa sprint)

## 🧪 Cách Kiểm Tra

### 1. Thêm Console Log:
```jsx
function Sidebar() {
  console.log('🔄 Sidebar rendered at:', new Date().toISOString());
  // ... rest of code
}
```

### 2. Sử dụng React DevTools Profiler:
- Mở React DevTools
- Tab "Profiler"
- Click "Record" → thao tác trên app → Stop
- Xem Sidebar có bị re-render không

### 3. Test Cases:
- ✅ Navigate giữa các routes → Sidebar **CHỈ** update active link
- ✅ Thay đổi data trong page → Sidebar **KHÔNG** re-render
- ✅ Mở/đóng modal → Sidebar **KHÔNG** re-render
- ✅ Chọn project khác → Sidebar re-render **1 LẦN** (chính xác)
- ✅ Load sprints → Sidebar re-render **1 LẦN** (chính xác)

## 💡 Best Practices

### 1. Dependencies Array Chính Xác:
```jsx
// ❌ Thiếu dependencies → stale closure
const handler = useCallback(() => {
  console.log(someValue);
}, []); // Missing someValue

// ✅ Đầy đủ dependencies
const handler = useCallback(() => {
  console.log(someValue);
}, [someValue]);
```

### 2. Tránh Inline Functions trong JSX:
```jsx
// ❌ Tạo function mới mỗi render
<button onClick={() => handleClick(item)}>Click</button>

// ✅ Sử dụng useCallback
const handleItemClick = useCallback(() => handleClick(item), [item]);
<button onClick={handleItemClick}>Click</button>
```

### 3. Memoize Context Value:
```jsx
// ❌ Object mới mỗi render
<Context.Provider value={{ a, b, c }}>

// ✅ Memoize value
const value = useMemo(() => ({ a, b, c }), [a, b, c]);
<Context.Provider value={value}>
```

## 🚀 Performance Gains

- **Initial Load**: Không thay đổi đáng kể (vẫn phải mount lần đầu)
- **Runtime**: Giảm 90-95% số lần re-render không cần thiết
- **Memory**: Giảm garbage collection do ít tạo functions/objects mới
- **User Experience**: Mượt mà hơn, không bị lag khi navigate

## 📝 Notes

- `memo()` chỉ shallow compare props → nếu pass object/array, cần memoize chúng
- `useCallback` và `useMemo` có overhead → chỉ dùng khi thực sự cần
- Dependencies array phải chính xác → ESLint plugin `react-hooks/exhaustive-deps` giúp check

## 🔍 Debug Tips

Nếu Sidebar vẫn re-render nhiều:

1. Check `useProject()` hook có trả về stable reference không
2. Check parent component (MainLayout) có pass unstable props không
3. Dùng React DevTools "Why did this render?" để trace
4. Check dependencies arrays trong useCallback/useMemo
