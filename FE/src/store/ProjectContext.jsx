import { createContext, useContext, useState, useEffect } from "react";

const ProjectContext = createContext();
const STORAGE_KEY = "currentProject";

export function ProjectProvider({ children }) {
  // Hydrate từ localStorage (lazy init để chỉ chạy 1 lần)
  const [currentProject, setCurrentProject] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Persist mỗi khi thay đổi
  useEffect(() => {
    if (currentProject) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProject));
      } catch {
        /* ignore quota errors */
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentProject]);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}