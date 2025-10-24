import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BadgeAlert,
  ClipboardList,
  Settings,
  Users,
  BookMarked,
  FolderKanban,
  ChevronDown,
  Check,
  Sparkles,
  Zap,
} from "lucide-react";
import { useProject } from "../store/ProjectContext";
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import ProjectService from "../services/projectService";
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

  // Toggle sidebar - mặc định luôn BẬT (false = bật, true = tắt)
  const [collapsed, setCollapsed] = useState(false);

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

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="relative flex-shrink-0">
      {/* Sidebar */}
      <aside
        className={`relative bg-gradient-to-b from-white via-emerald-50/30 to-teal-50/50 
          border-r border-emerald-100 transition-all duration-300 shadow-xl 
          flex flex-col justify-between ${collapsed ? "w-0" : "w-64"}`}
      >
        {/* Sidebar Content */}
        <div
          className={`h-full overflow-hidden transition-all duration-300 flex flex-col ${
            collapsed ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          {/* Main Content */}
          <div className="flex-shrink-0">
            <div className="p-3 space-y-3">
              {/* Project Selector */}
              <div className="mb-3" tabIndex={0} onBlur={handleDropdownBlur}>
                <label className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                  <FolderKanban className="w-3 h-3" />
                  <span>PROJECT</span>
                </label>
                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:shadow-md hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200"
                >
                  <span className="truncate text-left flex-1">
                    {currentProject ? currentProject.name : "Select project"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <ul className="mt-2 max-h-48 w-full overflow-y-auto rounded-lg border-2 border-emerald-200 bg-white shadow-xl focus:outline-none custom-scrollbar">
                    {projects.length === 0 && (
                      <li className="px-3 py-2 text-sm text-gray-500 text-center">
                        No projects available
                      </li>
                    )}
                    {projects.map((proj) => {
                      const selected = currentProject?.id === proj.id;
                      return (
                        <li key={proj.id}>
                          <button
                            type="button"
                            onClick={() => handleProjectSelect(proj)}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-all duration-200 ${
                              selected
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
                                : "hover:bg-emerald-50 text-gray-700"
                            }`}
                          >
                            <span className="truncate">{proj.name}</span>
                            {selected && (
                              <Check className="h-3.5 w-3.5 flex-shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>NAVIGATION</span>
                </div>

                <Link
                  to="/"
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/") && location.pathname === "/"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : "hover:bg-emerald-50 text-gray-700"
                  }`}
                >
                  <Home
                    className={`w-4 h-4 ${
                      isActive("/") && location.pathname === "/"
                        ? "text-white"
                        : "text-emerald-600"
                    }`}
                  />
                  <span className="font-medium text-sm">Dashboard</span>
                </Link>

                <Link
                  to="/projects"
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/projects") && !isActive("/projects/")
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : "hover:bg-emerald-50 text-gray-700"
                  }`}
                >
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-sm">Projects</span>
                </Link>

                <Link
                  to="/user-stories"
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/user-stories")
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                      : "hover:bg-blue-50 text-gray-700"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">User Stories</span>
                </Link>

                <Link
                  to="/issues/list"
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/issues")
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                      : "hover:bg-amber-50 text-gray-700"
                  }`}
                >
                  <BadgeAlert className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-sm">Issues</span>
                </Link>

                <Link
                  to="/tasks"
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/tasks")
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "hover:bg-purple-50 text-gray-700"
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">Tasks</span>
                </Link>

                {currentProject && (
                  <Link
                    to={`/projects/${currentProject.id}/team`}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                      isActive(`/projects/${currentProject.id}/team`)
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                        : "hover:bg-teal-50 text-gray-700"
                    }`}
                  >
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="font-medium text-sm">Team</span>
                  </Link>
                )}

                <Link
                  to="/settings"
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive("/settings")
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-sm">Settings</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Sprints Section */}
          {currentProject && (
            <div className="border-t border-emerald-100 bg-white/50 flex-1 flex flex-col min-h-0">
              <div className="p-3 flex flex-col h-full">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2 px-2 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3 h-3" />
                    SPRINTS
                  </span>
                  {sprintsLoading && (
                    <span className="text-emerald-600 animate-pulse">•••</span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                  {sprintsLoading ? (
                    <>
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="block rounded-lg px-2 py-2 border-2 border-transparent animate-pulse"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-10"></div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : sprintLinks.length === 0 ? (
                    <div className="text-xs text-gray-400 px-2 py-2 text-center rounded-lg bg-gray-50">
                      No sprints yet
                    </div>
                  ) : (
                    sprintLinks.map((sprint) => {
                      const isPast =
                        sprint.deadline &&
                        dayjs(sprint.deadline).isBefore(dayjs(), "day");
                      return (
                        <Link
                          key={sprint.id}
                          to={sprint.path}
                          className={`group block rounded-lg px-2 py-2 text-sm transition-all duration-200 border-2 ${
                            sprint.active
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-md"
                              : "border-transparent hover:bg-emerald-50 hover:border-emerald-200 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium text-xs">
                              {sprint.name}
                            </span>
                            {sprint.deadline && (
                              <span
                                className={`text-xs whitespace-nowrap px-1.5 py-0.5 rounded-full ${
                                  sprint.active
                                    ? "bg-white/20 text-white"
                                    : isPast
                                    ? "bg-red-100 text-red-600"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {dayjs(sprint.deadline).format("DD/MM")}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nút toggle dính vào sidebar và canh giữa nội dung */}
        <div className="absolute inset-y-0 right-0 flex items-center justify-center">
          <button
            onClick={toggleSidebar}
            className="translate-x-1/2 p-2 rounded-r-md bg-gradient-to-br from-emerald-500 to-teal-500 text-white 
              shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            title={collapsed ? "Open Sidebar" : "Close Sidebar"}
          >
            <span className="text-sm font-bold">{collapsed ? "<<" : ">>"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default memo(Sidebar);
