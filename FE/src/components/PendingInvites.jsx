// components/PendingInvites.jsx
import TeamService from "../services/teamService";

export default function PendingInvites({ pending, onRevoked }) {
  const handleRevoke = async (inviteId) => {
    if (!window.confirm("Bạn có chắc muốn thu hồi lời mời này?")) return;
    try {
      await TeamService.revokeInvite(inviteId);
      onRevoked(inviteId);
    } catch (err) {
      alert(err.response?.data?.error || "Error revoking invite");
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Lời mời đang chờ</h3>
      {pending.length > 0 ? (
        <ul className="space-y-3">
          {pending.map((i) => (
            <li
              key={i.id}
              className="flex justify-between items-center bg-yellow-50 p-4 rounded shadow"
            >
              <div>
                <p className="font-medium">{i.email}</p>
                <p className="text-sm text-gray-500">Vai trò: {i.role_name}</p>
              </div>
              <button
                onClick={() => handleRevoke(i.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Không có lời mời nào đang chờ.</p>
      )}
    </div>
  );
}
