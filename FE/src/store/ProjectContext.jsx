import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const ProjectContext = createContext();
const STORAGE_KEY_BASE = "currentProject";

export function ProjectProvider({ children }) {
  // ✅ Xác định key theo user (nếu bạn có lưu user trong localStorage)
  const getStorageKey = useCallback(() => {
    try {
      const userRaw = localStorage.getItem("user"); // ví dụ bạn lưu user info khi login
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.id) return `${STORAGE_KEY_BASE}_${user.id}`;
      }
    } catch {
      /* ignore */
    }
    return STORAGE_KEY_BASE;
  }, []);

  const [storageKey, setStorageKey] = useState(getStorageKey);

  // Hydrate từ localStorage (lazy init)
  const [currentProject, setCurrentProjectState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // ✅ Memoize setCurrentProject để tránh tạo function mới mỗi render
  const setCurrentProject = useCallback((project) => {
    setCurrentProjectState(project);
  }, []);

  // ✅ Persist mỗi khi thay đổi currentProject
  useEffect(() => {
    if (currentProject) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentProject));
      } catch {
        /* ignore quota errors */
      }
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [currentProject, storageKey]);

  // ✅ Nếu user thay đổi (ví dụ login/logout) → cập nhật storage key và project tương ứng
  useEffect(() => {
    const handleStorageUpdate = () => {
      const newKey = getStorageKey();
      setStorageKey(newKey);
      try {
        const raw = localStorage.getItem(newKey);
        setCurrentProjectState(raw ? JSON.parse(raw) : null);
      } catch {
        setCurrentProjectState(null);
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("userChanged", handleStorageUpdate); // custom event nếu bạn muốn trigger từ login/logout
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("userChanged", handleStorageUpdate);
    };
  }, [getStorageKey]);

  // ✅ Memoize context value để tránh re-render children
  const value = useMemo(
    () => ({ currentProject, setCurrentProject }),
    [currentProject, setCurrentProject]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
