import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BadgeAlert,
  ClipboardList,
  Settings,
  LogOut,
  Users,
  BookMarked,
  FolderKanban,
  ChevronDown,
  Check,
} from "lucide-react";
import { useProject } from "../store/ProjectContext";
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import ProjectService from "../services/projectService";
import api from "../services/api";
import SprintService from "../services/sprintService";
import dayjs from "dayjs";

function Sidebar() {
  const { currentProject, setCurrentProject } = useProject();
  const [projects, setProjects] = useState([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const location = useLocation();

  // --- NEW STATE for collapse ---
  const [collapsed, setCollapsed] = useState(true);

  // Load projects
  useEffect(() => {
    let ignore = false;
    ProjectService.getMyProjects()
      .then((res) => {
        if (!ignore) {
          setProjects(res.data);
          setProjectsLoaded(true);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setCurrentProject(null);
          navigate("/login");
        } else {
          console.error("Error loading projects", err);
        }
        if (!ignore) {
          setProjectsLoaded(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, [navigate, setCurrentProject]);

  // Restore last project
  useEffect(() => {
    if (!projectsLoaded) return;

    const stored = localStorage.getItem("currentProject");
    if (stored) {
      try {
        const saved = JSON.parse(stored);
        const match = projects.find((p) => p.id === saved.id);
        if (match) {
          setCurrentProject(match);
          return;
        }
      } catch (e) {
        console.error("Error reading project from localStorage:", e);
      }
    }
    if (!currentProject && projects.length > 0) {
      setCurrentProject(projects[0]);
    }
  }, [projectsLoaded, projects]);

  // Load sprints
  useEffect(() => {
    if (!currentProject?.id) {
      setSprints([]);
      return;
    }

    let ignore = false;
    setSprintsLoading(true);

    SprintService.getByProject(currentProject.id)
      .then((res) => {
        if (!ignore) setSprints(res.data || []);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setCurrentProject(null);
          navigate("/login");
        } else {
          console.error("Error loading sprints", err);
        }
        if (!ignore) setSprints([]);
      })
      .finally(() => {
        if (!ignore) setSprintsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentProject?.id, navigate, setCurrentProject]);

  const sprintLinks = useMemo(() => {
    if (!currentProject) return [];
    return (sprints || []).map((sprint) => {
      const path = `/projects/${currentProject.id}/sprints/${sprint.id}/taskboard`;
      const active = location.pathname.startsWith(path);
      return {
        id: sprint.id,
        name: sprint.name || sprint.title || `Sprint #${sprint.id}`,
        deadline: sprint.deadline,
        path,
        active,
      };
    });
  }, [currentProject, sprints, location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Error logging out", err);
    } finally {
      setCurrentProject(null);
      navigate("/login", { replace: true });
    }
  }, [navigate, setCurrentProject]);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((open) => !open);
  }, []);

  const handleProjectSelect = useCallback(
    (proj) => {
      setCurrentProject(proj);
      setDropdownOpen(false);
    },
    [setCurrentProject]
  );

  const handleDropdownBlur = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropdownOpen(false);
    }
  }, []);

  const isActive = useCallback(
    (path) => location.pathname.startsWith(path),
    [location.pathname]
  );

  // --- Hover Behavior ---
  const handleMouseEnter = () => setCollapsed(false);
  const handleMouseLeave = () => setCollapsed(true);

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 sticky top-0 
        ${collapsed ? "w-[70px]" : "w-64"} min-h-screen overflow-hidden`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`p-6 transition-opacity duration-300 ${
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Sidebar Header */}
        <div className="mb-2" tabIndex={0} onBlur={handleDropdownBlur}>
          <button
            type="button"
            onClick={toggleDropdown}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 shadow hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <span className="truncate text-left">
              {currentProject ? currentProject.name : "Select project"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <ul className="mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-green-100 bg-white shadow-lg focus:outline-none">
              {projects.length === 0 && (
                <li className="px-4 py-3 text-sm text-gray-500">
                  You don't have any projects yet.
                </li>
              )}
              {projects.map((proj) => {
                const selected = currentProject?.id === proj.id;
                return (
                  <li key={proj.id}>
                    <button
                      type="button"
                      onClick={() => handleProjectSelect(proj)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-sm transition ${
                        selected
                          ? "bg-green-100 text-green-700 font-semibold"
                          : "hover:bg-green-50 text-gray-700"
                      }`}
                    >
                      <span className="truncate">{proj.name}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Navigation */}
        <ul className="space-y-3 mt-4">
          <li>
            <Link
              to="/"
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive("/") && location.pathname === "/"
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "hover:bg-green-50 text-gray-700"
              }`}
            >
              <Home className="w-5 h-5 text-green-600" />
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              to="/projects"
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive("/projects") && !isActive("/projects/")
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "hover:bg-green-50 text-gray-700"
              }`}
            >
              <FolderKanban className="w-5 h-5 text-green-600" />
              <span>Projects</span>
            </Link>
          </li>

          <li>
            <Link
              to="/user-stories"
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive("/user-stories")
                  ? "bg-emerald-100 text-emerald-700 font-semibold"
                  : "hover:bg-emerald-50 text-gray-700"
              }`}
            >
              <BookMarked className="w-5 h-5 text-green-600" />
              <span>User Story</span>
            </Link>
          </li>

          <li>
            <Link
              to="/issues/list"
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive("/issues")
                  ? "bg-amber-100 text-amber-700 font-semibold"
                  : "hover:bg-amber-50 text-gray-700"
              }`}
            >
              <BadgeAlert className="w-5 h-5 text-amber-500" />
              <span>Issue</span>
            </Link>
          </li>

          <li>
            <Link
              to="/tasks"
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive("/tasks")
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-blue-50 text-gray-700"
              }`}
            >
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span>Tasks</span>
            </Link>
          </li>

          <li>
            <Link
              to="/settings"
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive("/settings")
                  ? "bg-gray-200 text-gray-900 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Settings className="w-5 h-5 text-gray-700" />
              <span>Settings</span>
            </Link>
          </li>

          {currentProject && (
            <li>
              <Link
                to={`/projects/${currentProject.id}/team`}
                className={`flex items-center gap-3 p-2 rounded-md transition ${
                  isActive(`/projects/${currentProject.id}/team`)
                    ? "bg-teal-100 text-teal-700 font-semibold"
                    : "hover:bg-teal-50 text-gray-700"
                }`}
              >
                <Users className="w-5 h-5 text-teal-600" />
                <span>Team</span>
              </Link>
            </li>
          )}

          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 p-2 mt-6 rounded-md hover:bg-red-100 transition"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-gray-700">Logout</span>
            </button>
          </li>
        </ul>

        {currentProject && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500 mb-2">
              <span>Sprints</span>
              {sprintsLoading && (
                <span className="text-emerald-600">Loading...</span>
              )}
            </div>

            <div className="space-y-1 min-h-[120px] max-h-48 overflow-y-auto pr-1">
              {sprintsLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="block rounded-lg px-3 py-2 border border-transparent animate-pulse"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : sprintLinks.length === 0 ? (
                <div className="text-xs text-gray-400 px-2 py-1">
                  No sprints yet.
                </div>
              ) : (
                sprintLinks.map((sprint) => (
                  <Link
                    key={sprint.id}
                    to={sprint.path}
                    className={`block rounded-lg px-3 py-2 text-sm transition border ${
                      sprint.active
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold"
                        : "border-transparent hover:bg-emerald-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{sprint.name}</span>
                      {sprint.deadline && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {dayjs(sprint.deadline).format("DD/MM")}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default memo(Sidebar);
