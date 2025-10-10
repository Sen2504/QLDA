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
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    message: "",
    tasks: [],
    onConfirm: null,
  });

  const [popup, setPopup] = useState({ message: "", type: "", visible: false });

  useEffect(() => {
    api.get("/auth/me")
      .then(res => setCurrentUser(res.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  const showPopup = (message, type = "success") => {
    setPopup({ message, type, visible: true });
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
          if (err.response?.status === 401) navigate("/login");
        });

      TeamService.getProjectRoles(currentProject.id)
        .then((res) => setRoles(res.data))
        .catch(() => showPopup("Không thể tải danh sách roles!", "warning"));
    }
  }, [currentProject, navigate]);

  const handleRemove = async (userId) => {
    try {
      // Thử xóa lần đầu (không force)
      await TeamService.removeUser(projectId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
      showPopup("Xóa thành viên thành công!", "success");
    } catch (err) {
      // Nếu lỗi 409 -> có task đang phân công
      if (err.response?.status === 409) {
        const data = err.response.data;
        const taskList = data.tasks || [];
        
        // Hiển thị dialog xác nhận với danh sách task
        setConfirmDialog({
          visible: true,
          message: data.message,
          tasks: taskList,
          onConfirm: async () => {
            setConfirmDialog({ visible: false, message: "", tasks: [], onConfirm: null });
            try {
              await TeamService.removeUser(projectId, userId, true);
              setMembers(members.filter((m) => m.user_id !== userId));
              showPopup("Đã xóa thành viên và hủy phân công task!", "success");
            } catch (forceErr) {
              showPopup(forceErr.response?.data?.error || "Lỗi khi xóa user", "error");
            }
          },
        });
      } else {
        showPopup(err.response?.data?.error || "Lỗi khi xóa user", "error");
      }
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
            onError={(errorMsg) => {
              showPopup(errorMsg, "error");
            }}
          />

          {/* Danh sách thành viên */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Danh sách thành viên</h3>
            {members.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((m) => {
                  const isOwner = m.role_name === "Project Owner";
                  const isCurrentUser = m.user_id === currentUser?.id;

                  const liClass = [
                    "flex justify-between items-center p-3 rounded-lg shadow-sm border text-sm transition",
                    isOwner
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200",
                    isCurrentUser ? "ring-2 ring-green-400 bg-green-50" : ""
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const nameClass = [
                    "font-semibold",
                    isOwner ? "text-yellow-800" : "text-gray-800",
                    isCurrentUser ? "text-green-700 font-bold" : ""
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <li key={m.id} className={liClass}>
                      <div>
                        <p className={nameClass}>
                          {m.user_name || "(Chưa có tên)"}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                              Bạn
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {m.user_email}
                        </p>
                        <p className="text-xs text-gray-500 italic">
                          {m.role_name}
                        </p>
                      </div>

                      {currentProject?.role_name === "Project Owner" &&
                        m.role_name !== "Project Owner" &&
                        m.user_id !== currentUser?.id && (
                          <button
                            onClick={() => handleRemove(m.user_id)}
                            className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition"
                          >
                            Xóa
                          </button>
                        )}
                    </li>
                  );
                })}
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

      {popup.visible && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, visible: false })}
        />
      )}

      {/* Dialog xác nhận xóa thành viên có task */}
      {confirmDialog.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Cảnh báo</h3>
            <p className="text-gray-700 mb-4">{confirmDialog.message}</p>
            
            <div className="mb-6 max-h-64 overflow-y-auto">
              <ul className="space-y-2">
                {confirmDialog.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="font-semibold text-sm text-gray-800">
                      #{task.id} {task.name}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa thành viên này? <br />
              <span className="font-semibold text-red-600">
                Tất cả phân công task sẽ bị hủy!
              </span>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setConfirmDialog({
                    visible: false,
                    message: "",
                    tasks: [],
                    onConfirm: null,
                  })
                }
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
