// components/InviteForm.jsx
import { useState } from "react";
import TeamService from "../services/teamService";

export default function InviteForm({ projectId, roles, onInvited, onError }) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!projectId) {
      onError?.("Unable to identify current project. Please choose a project before inviting.");
      return;
    }
    try {
      const res = await TeamService.inviteUser({
        project_id: Number(projectId),
        email,
        projrole_id: Number(roleId),
      });
      onInvited(res.data); // báo về parent
      setEmail("");
      setRoleId("");
    } catch (err) {
      onError?.(err.response?.data?.error || "Error when inviting members");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Invite member</h3>
      <form onSubmit={handleInvite} className="space-y-4">
        <input
          type="email"
          placeholder="User email"
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
          <option value="">-- Select role --</option>
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
          Invite
        </button>
      </form>
    </div>
  );
}
