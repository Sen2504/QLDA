// components/InviteForm.jsx
import { useState } from "react";
import TeamService from "../services/teamService";
import PermissionGuard from "./PermissionGuard";

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
      <div >
        <form
          onSubmit={handleInvite}
          className="space-y-4 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-teal-100"
        >
          <h3 className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent mb-3">
            Invite Member
          </h3>

          {/* Email input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">User Email</label>
            <input
              type="email"
              placeholder="e.g. user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {/* Role select */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition"
              required
            >
              <option value="">-- Select role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition duration-300"
          >
            Invite
          </button>
        </form>
      </div>
  );
}
