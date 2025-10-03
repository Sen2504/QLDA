// components/InviteForm.jsx
import { useState } from "react";
import TeamService from "../services/teamService";

export default function InviteForm({ projectId, roles, onInvited }) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await TeamService.inviteUser({
        project_id: projectId,
        email,
        projrole_id: roleId,
      });
      onInvited(res.data); // báo về parent
      setEmail("");
      setRoleId("");
    } catch (err) {
      alert(err.response?.data?.error || "Error inviting user");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Mời thành viên</h3>
      <form onSubmit={handleInvite} className="space-y-4">
        <input
          type="email"
          placeholder="Email người dùng"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          required
        />

        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          required
        >
          <option value="">-- Chọn vai trò --</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Mời
        </button>
      </form>
    </div>
  );
}
