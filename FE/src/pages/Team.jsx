import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeamService from "../services/teamService";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";


export default function Team() {
  const { projectId } = useParams();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const navigate = useNavigate();
  const { currentProject } = useProject();

  useEffect(() => {
    if (currentProject) {
      TeamService.getTeam(currentProject.id)
        .then((res) => setMembers(res.data))
        .catch((err) => {
          console.error("Lỗi load team:", err);
          if (err.response?.status === 401) {
            navigate("/login");
          }
        });
    }
  }, [currentProject, navigate]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await TeamService.inviteUser(projectId, {
        email,
        role_id: roleId,
      });
      setMembers([...members, res.data]);
      setEmail("");
      setRoleId("");
    } catch (err) {
      alert(err.response?.data?.error || "Error inviting user");
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await TeamService.removeUser(projectId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || "Error removing user");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold text-green-700">
          Team của Project {currentProject ? currentProject.name : `#${projectId}`}        
        </h2>
        {/* Invite form */}
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
            <input
              type="number"
              placeholder="Role ID (ví dụ: UX)"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Invite
            </button>
          </form>
        </div>

        {/* Team members list */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Danh sách thành viên</h3>
          {members.length > 0 ? (
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center bg-white p-4 rounded shadow"
                >
                  <div>
                    <p className="font-medium">{m.user_email}</p>
                    <p className="text-sm text-gray-500">Role: {m.role_name}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có thành viên nào.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
