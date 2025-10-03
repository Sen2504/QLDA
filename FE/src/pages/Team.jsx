// pages/Team.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeamService from "../services/teamService";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import InviteForm from "../components/InviteForm";
import PendingInvites from "../components/PendingInvites";
import PopupMessage from "../components/Popup_message";
import api from "../services/api";

export default function Team() {
  const { projectId } = useParams();
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [currentUser, setCurrentUser] = useState(null);

  const [popup, setPopup] = useState({ message: "", type: "", visible: false });

  useEffect(() => {
    api.get("/auth/me")
      .then(res => setCurrentUser(res.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  const showPopup = (message, type = "success") => {
    setPopup({ message, type, visible: true });

    // Auto close sau 3s
    setTimeout(() => {
      setPopup({ message: "", type: "", visible: false });
    }, 3000);
  };

  useEffect(() => {
    if (currentProject) {
      TeamService.getTeamSummary(currentProject.id)
        .then((res) => {
          setMembers(res.data.members);
          setPending(res.data.pending_invites);
        })
        .catch((err) => {
          console.error("Lỗi load team:", err);
          showPopup("Không thể tải team. Vui lòng thử lại!", "warning");
          if (err.response?.status === 401) {
            navigate("/login");
          }
        });

      TeamService.getProjectRoles(currentProject.id)   // 👈 đổi chỗ này
        .then((res) => setRoles(res.data))
        .catch(() => showPopup("Không thể tải danh sách roles!", "warning"));
    }
  }, [currentProject, navigate]);

  const handleRemove = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await TeamService.removeUser(projectId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
      showPopup("Xóa thành viên thành công!", "success");
    } catch (err) {
      showPopup(err.response?.data?.error || "Lỗi khi xóa user", "error");
    }
  };

  return (
    <>
      <MainLayout>
        <div className="p-6 space-y-8">
          <h2 className="text-2xl font-bold text-green-700">
            Team của project{" "}
            {currentProject ? currentProject.name : `#${projectId}`}
          </h2>

          {/* Form mời thành viên */}
          <InviteForm
            projectId={projectId}
            roles={roles}
            onInvited={(invite) => {
              setPending([...pending, invite]);
              showPopup("Đã gửi lời mời thành công!", "success");
            }}
          />

          {/* Danh sách thành viên */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Danh sách thành viên</h3>
            {members.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className={`flex justify-between items-center p-4 rounded shadow transition 
                      ${
                        m.role_name === "Project Owner"
                          ? "bg-yellow-100 border border-yellow-400"
                          : "bg-white"
                      }`}
                  >
                    <div>
                      <p
                        className={`font-bold ${
                          m.role_name === "Project Owner"
                            ? "text-yellow-800"
                            : "text-gray-900"
                        }`}
                      >
                        
                      </p>
                      <p className="text-sm text-gray-700">
                        Email: {m.user_email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Vai trò: {m.role_name}
                      </p>
                    </div>

                    {/* Ẩn nút Remove với Project Owner */}
                    {currentProject?.role_name === "Project Owner" &&
                    m.role_name !== "Project Owner" &&
                    m.user_id !== currentUser?.id && (
                      <button
                        onClick={() => handleRemove(m.user_id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                      >
                        Xóa
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Chưa có thành viên nào.</p>
            )}
          </div>

          {/* Danh sách lời mời đang chờ */}
          <PendingInvites
            pending={pending}
            onRevoked={(inviteId) => {
              setPending(pending.filter((i) => i.id !== inviteId));
              showPopup("Đã thu hồi lời mời!", "warning");
            }}
          />
        </div>
      </MainLayout>

      {/* Popup hiển thị thông báo */}
      {popup.visible && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, visible: false })}
        />
      )}
    </>
  );
}
