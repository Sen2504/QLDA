import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProject } from "../store/ProjectContext";
import CustomRoleManager from "../components/CustomRoleManager";
import PermissionsPanel from "../components/PermissionsPanel";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Loading State */}
        {isOwner === null && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Checking access permissions...</p>
            </div>
          </div>
        )}

        {/* Access Denied */}
        {isOwner === false && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl shadow-xl border-2 border-red-200 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Access Denied</h3>
                <p className="text-red-700">Only the Project Owner can access the Settings page.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Tabs & Panels */}
        {isOwner && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            
            {/* Modern Tabs */}
            <div className="flex gap-1 p-2 bg-gradient-to-r from-gray-100 to-slate-100 border-b border-gray-200">
              <button
                onClick={() => setTab("roles")}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  tab === "roles"
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md transform scale-[1.02]"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Roles Management
              </button>
              <button
                onClick={() => setTab("permissions")}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  tab === "permissions"
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md transform scale-[1.02]"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Permissions Matrix
              </button>
            </div>

            {/* Panel Content with Animation */}
            <div className="p-5 md:p-6 animate-fadeIn">
              {tab === "roles" && currentProject && (
                <CustomRoleManager projectId={currentProject.id} />
              )}
              {tab === "permissions" && (
                <PermissionsPanel />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
