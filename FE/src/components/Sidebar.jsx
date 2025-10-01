import { Link } from "react-router-dom";
import {
  Home,
  BadgeAlert,
  ClipboardList,
  Settings,
  LogOut,
  Users,
  BookMarked,
  FolderKanban,
} from "lucide-react";
import { useProject } from "../store/ProjectContext";
import { useEffect, useState } from "react";
import ProjectService from "../services/projectService";

export default function Sidebar() {
  const { currentProject, setCurrentProject } = useProject();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    ProjectService.getMyProjects()
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Error loading projects", err));
  }, []);

  return (
    <aside className="bg-white border-r border-gray-200 w-64 min-h-screen p-6">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-green-600">
          Menu
        </h2>

        {/* Dropdown chọn project */}
        <select
          value={currentProject ? currentProject.id : ""}
          onChange={(e) => {
            const proj = projects.find((p) => p.id === Number(e.target.value));
            setCurrentProject(proj || null);
          }}
          className="text-sm border rounded px-2 py-1 bg-white"
        >
          <option value="">Chọn project</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>

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
            to="/issues"
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
          <Link
            to="/login"
            className="flex items-center gap-3 p-2 mt-6 rounded-md hover:bg-red-100 transition"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="text-gray-700">Logout</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
}
