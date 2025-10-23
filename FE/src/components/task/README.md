# 📦 Reusable Task Components Documentation

## Components Location
`src/components/task/`

## Available Components

### 1. **GradientCard.jsx**
Card container với gradient background và border tùy chỉnh.

**Props:**
```jsx
{
  children: ReactNode,
  className?: string,
  gradient?: string,      // default: 'from-emerald-50 to-teal-50'
  borderColor?: string    // default: 'border-emerald-200'
}
```

**Usage:**
```jsx
<GradientCard gradient="from-blue-50 to-cyan-50" borderColor="border-blue-200">
  <p>Your content here</p>
</GradientCard>
```

---

### 2. **SectionHeader.jsx**
Header cho các sections với icon và gradient text.

**Props:**
```jsx
{
  icon: LucideIcon,       // Icon component from lucide-react
  title: string,
  badge?: ReactNode,      // Optional badge element
  gradient?: string       // default: 'from-emerald-600 to-teal-600'
}
```

**Usage:**
```jsx
<SectionHeader 
  icon={FileText} 
  title="Description"
  gradient="from-blue-600 to-cyan-600"
/>
```

---

### 3. **CommentItem.jsx**
Compact comment card với author, timestamp và delete button.

**Props:**
```jsx
{
  comment: {
    id: number,
    content: string,
    created_at: string,
    author_name?: string,
    user?: { id: number, name: string }
  },
  currentUser: { id: number } | null,
  isDone: boolean,
  onDelete: (commentId: number) => void,
  isDeleting: boolean
}
```

**Usage:**
```jsx
<CommentItem
  comment={comment}
  currentUser={currentUser}
  isDone={false}
  onDelete={handleDeleteComment}
  isDeleting={commentSubmitting}
/>
```

---

### 4. **HashtagBadge.jsx**
Badge hiển thị hashtag với icon và optional remove button.

**Props:**
```jsx
{
  tag: { id: number, name: string },
  onRemove?: (tagId: number) => void,
  editable?: boolean      // default: false
}
```

**Usage:**
```jsx
// Read-only
<HashtagBadge tag={{ id: 1, name: 'bug' }} />

// Editable with remove
<HashtagBadge 
  tag={{ id: 1, name: 'feature' }} 
  editable={true}
  onRemove={handleRemoveTag}
/>
```

---

### 5. **AssigneeItem.jsx**
Compact assignee item với role information.

**Props:**
```jsx
{
  assignee: {
    user_name?: string,
    name?: string,
    user_email?: string,
    email?: string,
    role_name?: string
  },
  editable?: boolean      // default: false (for future use)
}
```

**Usage:**
```jsx
<AssigneeItem 
  assignee={{
    user_name: "John Doe",
    role_name: "Developer"
  }}
/>
```

---

## 🎨 Color Schemes

### Gradient Presets
```jsx
// Emerald/Teal (Primary)
gradient="from-emerald-50 to-teal-50"
borderColor="border-emerald-200"

// Blue/Cyan
gradient="from-blue-50 to-cyan-50"
borderColor="border-blue-200"

// Amber/Orange
gradient="from-amber-50 to-orange-50"
borderColor="border-amber-200"

// Purple/Pink
gradient="from-purple-50 to-pink-50"
borderColor="border-purple-200"
```

### Text Gradients
```jsx
// Emerald/Teal
gradient="from-emerald-600 to-teal-600"

// Blue/Cyan
gradient="from-blue-600 to-cyan-600"

// Amber/Orange
gradient="from-amber-600 to-orange-600"
```

---

## 🚀 Usage Examples

### Example 1: Info Card
```jsx
<GradientCard gradient="from-emerald-50 to-teal-50" borderColor="border-emerald-200">
  <SectionHeader icon={FileText} title="Description" />
  <p className="text-gray-700 text-xs leading-relaxed">
    Your description content here
  </p>
</GradientCard>
```

### Example 2: Date Card
```jsx
<GradientCard gradient="from-blue-50 to-cyan-50" borderColor="border-blue-200">
  <SectionHeader icon={Calendar} title="Due Date" gradient="from-blue-600 to-cyan-600" />
  <div className="text-gray-800 font-semibold text-xs">
    {dueDate}
  </div>
</GradientCard>
```

### Example 3: Comments Section
```jsx
<GradientCard gradient="from-emerald-50 via-teal-50 to-green-50" borderColor="border-emerald-200">
  <SectionHeader 
    icon={MessageCircle} 
    title="Comments"
    badge={
      <span className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
        {comments.length}
      </span>
    }
  />
  
  <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
    {comments.map(comment => (
      <CommentItem
        key={comment.id}
        comment={comment}
        currentUser={currentUser}
        isDone={false}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    ))}
  </div>
</GradientCard>
```

---

## 📏 Responsive Guidelines

### Spacing
- Card padding: `p-3` (12px)
- Section spacing: `space-y-3` (12px)
- Grid gap: `gap-3` (12px)

### Font Sizes
- Headers: `text-xs` (0.75rem)
- Content: `text-xs` (0.75rem)
- Small text: `text-[10px]` (10px)

### Icon Sizes
- Section headers: `w-4 h-4` (16px)
- Small icons: `w-3 h-3` (12px)
- Tiny icons: `w-3.5 h-3.5` (14px)

### Grid Layouts
```jsx
// Desktop: 1/3 sidebar | 2/3 main
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  <div className="space-y-3">{/* Sidebar */}</div>
  <div className="lg:col-span-2">{/* Main content */}</div>
</div>

// Two columns in sidebar
<div className="grid grid-cols-2 gap-2">
  <GradientCard>...</GradientCard>
  <GradientCard>...</GradientCard>
</div>
```

---

## 🎯 Best Practices

1. **Consistent Gradients**: Use emerald/teal as primary theme
2. **Compact Spacing**: Use `gap-3`, `space-y-3` for tight layouts
3. **Custom Scrollbar**: Apply `.custom-scrollbar` class to scrollable areas
4. **Above the Fold**: Use `max-h-[calc(100vh-420px)]` for content areas
5. **Icon Library**: Always use lucide-react icons
6. **Transitions**: Components have built-in smooth transitions

---

## 🔄 Pages Using These Components

- ✅ **TaskDetail.jsx** - Full implementation
- ✅ **IssueDetail.jsx** - Full implementation
- 🎯 Can be used in:
  - UserStoryDetail
  - ProjectDetail
  - SprintDetail
  - Any detail/view pages

---

## 📦 Required Dependencies

```json
{
  "lucide-react": "^0.x.x",
  "react": "^18.x.x",
  "dayjs": "^1.x.x"
}
```

## 🎨 Required CSS

Add to `src/index.css`:
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: linear-gradient(to bottom, #d1fae5, #a7f3d0);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #10b981, #14b8a6);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #059669, #0d9488);
}
```
