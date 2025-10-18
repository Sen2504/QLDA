import TeamService from "../services/teamService";
import { useProject } from "../store/ProjectContext";

export default function PendingInvites({ pending, onRevoked }) {
  const { currentProject } = useProject();

  const handleRevoke = async (inviteId) => {
    if (!window.confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      await TeamService.revokeInvite(inviteId);
      onRevoked(inviteId);
    } catch (err) {
      alert(err.response?.data?.error || "Error revoking invite");
    }
  };

  // Check if current user is Project Owner
  const isProjectOwner = currentProject?.role_name === "Project Owner";

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Invitation awaits</h3>
      {pending.length > 0 ? (
        <ul className="space-y-3">
          {pending.map((i) => (
            <li
              key={i.id}
              className="flex justify-between items-center bg-yellow-50 p-4 rounded shadow"
            >
              <div>
                <p className="font-medium">{i.email}</p>
                <p className="text-sm text-gray-500">Role: {i.role_name}</p>
              </div>

              {/* Chỉ Project Owner mới có thể revoke invite, và không thể revoke invite cho Project Owner role */}
              {isProjectOwner && i.role_name !== "Project Owner" && (
                <button
                  onClick={() => handleRevoke(i.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">There are no invitations pending.</p>
      )}
    </div>
  );
}
