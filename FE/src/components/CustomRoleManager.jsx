import { useEffect, useState } from "react";
import TeamService from "../services/teamService";

export default function CustomRoleManager({ projectId }) {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    if (projectId) {
      TeamService.getProjectRoles(projectId)
        .then((res) => setRoles(res.data))
        .catch(() => alert("Không thể tải danh sách roles"));
    }
  }, [projectId]);

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;

    try {
      const res = await TeamService.createCustomRole(projectId, newRole);
      setRoles([...roles, res.data]);
      setNewRole("");
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi khi tạo role mới");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Vai trò trong Project</h3>

      {/* Form thêm role */}
      <form onSubmit={handleAddRole} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Tên vai trò mới"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Thêm
        </button>
      </form>

      {/* Danh sách role */}
      <ul className="space-y-2">
        {roles.map((r) => {
          const linkedRoleId = r.role_id ?? r.id_role;
          const isCustom = linkedRoleId == null;

          return (
            <li
              key={r.id}
              className="flex justify-between items-center p-3 border rounded-md"
            >
              <span>{r.name}</span>
              <span className="text-sm text-gray-500">
                {isCustom ? "Custom" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
