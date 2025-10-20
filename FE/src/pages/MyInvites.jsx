// components/MyInvites.jsx
import { useEffect, useState } from "react";
import TeamService from "../services/teamService";

export default function MyInvites() {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    TeamService.getMyInvites()
      .then((res) => setInvites(res.data))
      .catch((err) => console.error("Error loading my invites:", err));
  }, []);

  const handleAccept = async (inviteId) => {
    try {
      await TeamService.acceptInvite(inviteId);
      setInvites(invites.filter((i) => i.id !== inviteId));
      alert("You have successfully joined the project!");
    } catch (err) {
      alert(err.response?.data?.error || "Error accepting invite");
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await TeamService.rejectInvite(inviteId);
      setInvites(invites.filter((i) => i.id !== inviteId));
    } catch (err) {
      alert(err.response?.data?.error || "Error rejecting invite");
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-green-700">My invitation</h2>
        {invites.length > 0 ? (
          <ul className="space-y-3">
            {invites.map((i) => (
              <li
                key={i.id}
                className="flex justify-between items-center bg-white p-4 rounded shadow"
              >
                <div>
                  <p className="font-medium">
                    Project #{i.project_id} - Role: {i.role_name}
                  </p>
                  <p className="text-sm text-gray-500">Email: {i.email}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleAccept(i.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                  >
                    Acceot
                  </button>
                  <button
                    onClick={() => handleReject(i.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">You don't have any invitations.</p>
        )}
      </div>
    </>
  );
}
