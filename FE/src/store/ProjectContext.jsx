import { createContext, useContext, useState, useEffect } from "react";

const ProjectContext = createContext();
const STORAGE_KEY_BASE = "currentProject";

export function ProjectProvider({ children }) {
  // ✅ Xác định key theo user (nếu bạn có lưu user trong localStorage)
  const getStorageKey = () => {
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
  };

  const [storageKey, setStorageKey] = useState(getStorageKey);

  // ✅ Hydrate từ localStorage (lazy init)
  const [currentProject, setCurrentProject] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

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
        setCurrentProject(raw ? JSON.parse(raw) : null);
      } catch {
        setCurrentProject(null);
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("userChanged", handleStorageUpdate); // custom event nếu bạn muốn trigger từ login/logout
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("userChanged", handleStorageUpdate);
    };
  }, []);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
