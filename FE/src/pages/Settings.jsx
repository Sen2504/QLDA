import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProject } from "../store/ProjectContext";
import CustomRoleManager from "../components/CustomRoleManager";
import PermissionsPanel from "../components/PermissionsPanel";
import MainLayout from "../layouts/MainLayout";
import TeamService from "../services/teamService";
import UserService from "../services/userService";

export default function Settings() {
  const { currentProject } = useProject();
  const location = useLocation();
  const [tab, setTab] = useState("roles");
  const [isOwner, setIsOwner] = useState(null); // null = loading, true/false = resolved

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!currentProject) return;
      try {
        const [meRes, summaryRes] = await Promise.all([
          UserService.getProfile(),
          TeamService.getTeamSummary(currentProject.id),
        ]);
        const me = meRes.data;
        const { members } = summaryRes.data || {};
        const myself = me && members?.find((m) => String(m.user_id) === String(me.id));
        const owner = myself && ((myself.role_name || myself.name_role) === "Project Owner");
        if (!cancelled) setIsOwner(!!owner);
      } catch (e) {
        if (!cancelled) setIsOwner(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentProject]);

  // Allow deep-linking (?tab=permissions)
  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const t = search.get("tab");
    if (t === "permissions") setTab("permissions");
    else if (t === "roles") setTab("roles");
  }, [location.search]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-green-700">
          Cài đặt Project {currentProject?.name}
        </h2>

        {isOwner === null && (
          <div className="text-gray-500">Đang kiểm tra quyền truy cập...</div>
        )}
        {isOwner === false && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
            Chỉ Project Owner mới có quyền truy cập trang Cài đặt.
          </div>
        )}
        {isOwner && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setTab("roles")}
                className={`px-4 py-2 -mb-px border-b-2 ${tab === "roles" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-600"}`}
              >
                Roles
              </button>
              <button
                onClick={() => setTab("permissions")}
                className={`px-4 py-2 -mb-px border-b-2 ${tab === "permissions" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-600"}`}
              >
                Permissions
              </button>
            </div>

            {/* Panels */}
            {tab === "roles" && currentProject && (
              <CustomRoleManager projectId={currentProject.id} />
            )}
            {tab === "permissions" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <PermissionsPanel />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
