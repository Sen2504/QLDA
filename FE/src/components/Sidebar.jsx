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
import { useEffect, useMemo, useState } from "react";
import ProjectService from "../services/projectService";
import api from "../services/api";
import SprintService from "../services/sprintService";
import dayjs from "dayjs";

export default function Sidebar() {
  const { currentProject, setCurrentProject } = useProject();
  const [projects, setProjects] = useState([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const location = useLocation();

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

  useEffect(() => {
    if (!projectsLoaded) return;
    if (!currentProject) {
      if (projects.length > 0) {
        setCurrentProject(projects[0]);
      }
      return;
    }
    if (!projects.some((proj) => proj.id === currentProject.id)) {
      setCurrentProject(null);
    }
  }, [projectsLoaded, projects, currentProject, setCurrentProject]);

  useEffect(() => {
    if (!currentProject?.id) {
      setSprints([]);
      return;
    }

    let ignore = false;
    setSprintsLoading(true);

    SprintService.getByProject(currentProject.id)
      .then((res) => {
        if (!ignore) {
          setSprints(res.data || []);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setCurrentProject(null);
          navigate("/login");
        } else {
          console.error("Error loading sprints", err);
        }
        if (!ignore) {
          setSprints([]);
        }
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

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Error logging out", err);
    } finally {
      setCurrentProject(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className="bg-white border-r border-gray-200 w-64 min-h-screen p-6">
      {/* Sidebar Header */}
      <div
        className="mb-2"
        tabIndex={0}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setDropdownOpen(false);
          }
        }}
      >
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 shadow hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <span className="truncate text-left">
            {currentProject ? currentProject.name : "Chọn project"}
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
                Bạn chưa có project nào.
              </li>
            )}
            {projects.map((proj) => {
              const selected = currentProject?.id === proj.id;
              return (
                <li key={proj.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentProject(proj);
                      setDropdownOpen(false);
                    }}
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

      {currentProject && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500 mb-2">
            <span>Sprints</span>
            {sprintsLoading && <span className="text-emerald-600">Đang tải...</span>}
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {!sprintsLoading && sprintLinks.length === 0 && (
              <div className="text-xs text-gray-400 px-2 py-1">
                Chưa có sprint nào.
              </div>
            )}

            {sprintLinks.map((sprint) => (
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
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <ul className="space-y-3">
        <li>
          <Link
            to="/"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 transition"
          >
            <Home className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Dashboard</span>
          </Link>
        </li>

        <li>
          <Link
            to="/projects"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 cursor-pointer transition"
          >
            <FolderKanban className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Projects</span>
          </Link>
        </li>

        <li>
          <Link
            to="/user-stories"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 transition"
          >
            <BookMarked className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">User Story</span>
          </Link>
        </li>

        <li>
          <Link
            to="/issues/list"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 transition"
          >
            <BadgeAlert className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Issue</span>
          </Link>
        </li>

        <li>
          <Link
            to="/tasks"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 transition"
          >
            <ClipboardList className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Tasks</span>
          </Link>
        </li>

        <li>
          <Link
            to="/settings"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 transition"
          >
            <Settings className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Settings</span>
          </Link>
        </li>

        {currentProject && (
          <li>
            <Link
              to={`/projects/${currentProject.id}/team`}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 transition"
            >
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Team</span>
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
    </aside>
  );
}
