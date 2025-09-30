import { Link } from "react-router-dom";
import {
  Home,
  BadgeAlert,
  ClipboardList,
  Settings,
  LogOut,
  Users,
  BookMarked,
} from "lucide-react";
import { useProject } from "../store/ProjectContext";

export default function Sidebar() {
  const { currentProject } = useProject();

  return (
    <aside className="bg-white border-r border-gray-200 w-64 min-h-screen p-6">
      {/* Sidebar Header */}
      <h2 className="text-lg font-semibold text-green-600 mb-6">
        {currentProject ? currentProject.name : "Menu"}
      </h2>

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

        
        {/* Team chỉ hiển thị khi có project được chọn */}
        
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
