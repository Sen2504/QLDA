import {
  Home,
  FolderKanban,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="bg-white border-r border-gray-200 w-64 min-h-screen p-6">
      {/* Sidebar Header */}
      <h2 className="text-lg font-semibold text-green-600 mb-6">Menu</h2>

      {/* Navigation */}
      <ul className="space-y-3">
        <li className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 cursor-pointer transition">
          <Home className="w-5 h-5 text-green-600" />
          <span className="text-gray-700">Dashboard</span>
        </li>
        <li className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 cursor-pointer transition">
          <FolderKanban className="w-5 h-5 text-green-600" />
          <span className="text-gray-700">Projects</span>
        </li>
        <li className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 cursor-pointer transition">
          <ClipboardList className="w-5 h-5 text-green-600" />
          <span className="text-gray-700">Tasks</span>
        </li>
        <li className="flex items-center gap-3 p-2 rounded-md hover:bg-green-100 cursor-pointer transition">
          <Settings className="w-5 h-5 text-green-600" />
          <span className="text-gray-700">Settings</span>
        </li>
        <li className="flex items-center gap-3 p-2 mt-6 rounded-md hover:bg-red-100 cursor-pointer transition">
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="text-gray-700">Logout</span>
        </li>
      </ul>
    </aside>
  );
}
