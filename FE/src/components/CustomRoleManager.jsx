import { useEffect, useState, useMemo } from "react";
import TeamService from "../services/teamService";

export default function CustomRoleManager({ projectId }) {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!projectId) return;
    TeamService.getProjectRoles(projectId)
      .then((res) => setRoles(res.data || []))
      .catch(() => alert("Could not load roles list"));
  }, [projectId]);

  const handleAddRole = async (e) => {
    e.preventDefault();
    const name = newRole.trim();
    if (!name) return;
    try {
      const res = await TeamService.createCustomRole(projectId, name);
      setRoles((prev) => [...prev, res.data]);
      setNewRole("");
    } catch (err) {
      alert(err.response?.data?.error || "Error when creating new role");
    }
  };

  const handleDeleteRole = async (role) => {
    const ok = window.confirm(`Xóa vai trò "${role.name}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;
    try {
      await TeamService.deleteProjectRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi khi xóa vai trò");
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name?.toLowerCase().includes(q));
  }, [roles, filter]);

  return (
    <div className="space-y-4">
      {/* Header (compact, above the fold) */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">
            Project Roles
          </h3>
          <p className="text-xs md:text-sm text-gray-600">Create and manage custom roles for your project team</p>
        </div>
        <span className="text-xs text-gray-500">Total: {roles.length}</span>
      </div>

      {/* Add role (compact bar) */}
      <form onSubmit={handleAddRole} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter new role name…"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-300 px-10 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5l7 7-7 7-7-7V7a4 4 0 014-4z" />
          </svg>
        </div>
        <button
          type="submit"
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium shadow-md hover:from-gray-700 hover:to-gray-800 hover:shadow-lg transition"
        >
          Add
        </button>
      </form>


      {/* LIST VIEW */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Sticky header */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
          <div className="grid grid-cols-12 text-xs md:text-sm font-semibold text-gray-600">
            <div className="col-span-6 md:col-span-6 px-3 py-2">Role name</div>
            <div className="col-span-3 hidden md:block px-3 py-2">Type</div>
            <div className="col-span-3 px-3 py-2 text-right">Actions</div>
          </div>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-gray-200 max-h-[54vh] overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((r) => {
              const linkedRoleId = r.role_id ?? r.id_role;
              const isCustom = linkedRoleId == null;
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-12 items-center hover:bg-gray-50/80 transition"
                >
                  {/* Name */}
                  <div className="col-span-6 md:col-span-6 px-3 py-3 flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex h-8 w-8 rounded-md items-center justify-center text-white
                      ${isCustom
                        ? "bg-gradient-to-r from-gray-600 to-gray-700"
                        : "bg-gradient-to-r from-gray-500 to-gray-600"}`}
                      aria-hidden
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21a7 7 0 0114 0H5z" />
                      </svg>
                    </span>
                    <span className="truncate font-medium text-gray-800">{r.name}</span>
                  </div>

                  {/* Type */}
                  <div className="col-span-3 hidden md:flex px-3 py-3">
                    {isCustom ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.38 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Custom
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gray-300 text-gray-800">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M2 7a10 10 0 1116 7.746A10 10 0 012 7zm12.707 1.293a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                        </svg>
                        System
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isCustom ? (
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="h-8 px-3 rounded-md bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-medium shadow hover:from-red-600 hover:to-rose-600 transition"
                          title="Delete role"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Protected</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-8 text-center text-sm text-gray-600">No roles found</li>
          )}
        </ul>
      </div>
    </div>
  );
}
