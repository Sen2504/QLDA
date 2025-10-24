import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeamService from "../services/teamService";
import { useProject } from "../store/ProjectContext";
import InviteForm from "../components/InviteForm";
import PendingInvites from "../components/PendingInvites";
import PopupMessage from "../components/Popup_message";
import PermissionGuard from "../components/PermissionGuard";
import withPermissions from "../components/withPermissions";
import api from "../services/api";

function Team() {
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
          console.error("Error load team:", err);
          showPopup("Unable to load team. Please try again!", "warning");
          if (err.response?.status === 401) navigate("/login");
        });

      TeamService.getProjectRoles(currentProject.id)
        .then((res) => setRoles(res.data))
        .catch(() => showPopup("Could not load roles list!", "warning"));
    }
  }, [currentProject, navigate]);

  const handleRemove = async (userId) => {
    try {
      // Thử xóa lần đầu (không force)
      await TeamService.removeUser(projectId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
      showPopup("Member deleted successfully!", "success");
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
              showPopup("Deleted members and canceled task assignments!", "success");
            } catch (forceErr) {
              showPopup(forceErr.response?.data?.error || "Error while deleting user", "error");
            }
          },
        });
      } else {
        showPopup(err.response?.data?.error || "Error while deleting user", "error");
      }
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      await TeamService.revokeInvite(inviteId);
      setPending(pending.filter((inv) => inv.id !== inviteId));
      showPopup("Invitation revoked successfully!", "success");
    } catch (err) {
      showPopup(err.response?.data?.error || "Error revoking invitation", "error");
    }
  };

  return (
    <>
      {/* Main Container with Gradient Background */}
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-5">

                <p className="text-sm text-gray-600 mt-1">
                  Project: <span className="font-semibold text-blue-700">
                    {currentProject ? currentProject.name : `#${projectId}`}
                  </span>
                </p>

          {/* Two Column Layout for Above the Fold */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left Column: Invite Form */}
            <div className="lg:col-span-1">
              <InviteForm
                projectId={projectId}
                roles={roles}
                onInvited={(invite) => {
                  setPending([...pending, invite]);
                  showPopup("Invitation sent successfully!", "success");
                }}
                onError={(errorMsg) => {
                  showPopup(errorMsg, "error");
                }}
              />
              {/* Pending Invites Section */}
              <div className="pt-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent mb-3">
                  Invitation Awaits
                </h3>

                {pending.length > 0 ? (
                  <div className="space-y-3">
                    {pending.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between bg-white/90 backdrop-blur-sm border border-teal-100 rounded-2xl shadow-sm px-4 py-3 hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                      >
                        {/* Left section: Avatar + info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center font-semibold shadow-md">
                            {(invite.user_name || invite.email || "?").charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">
                              {invite.user_name || "(No name)"}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{invite.email}</p>

                            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700">
                              {invite.role_name || "Pending Role"}
                            </span>
                          </div>
                        </div>

                        {/* Right: Revoke button */}
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md hover:from-red-600 hover:to-rose-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white/80 border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        No pending invitations
                      </p>
                      <p className="text-xs text-gray-400">
                        Invite someone to join your project
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Member List */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent mb-3">
                    Team Members
                  </h3>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-full shadow-md">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-sm font-semibold">{members.length} Members</span>
                  </div>
                </div>

                {/* Members List */}
                {members.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {members.map((m) => {
                      const isOwner = m.role_name === "Project Owner";
                      const isCurrentUser = m.user_id === currentUser?.id;

                      return (
                      <li
                      key={m.id}
                      className={`flex items-center justify-between p-2 transition-all duration-200 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 rounded-xl`}
                    >
                          {/* Left side - avatar + info */}
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md ${
                                isOwner
                                  ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                                  : isCurrentUser
                                  ? "bg-gradient-to-br from-emerald-400 to-teal-600"
                                  : "bg-gradient-to-br from-teal-500 to-cyan-500"
                              }`}
                            >
                              {(m.user_name || "?").charAt(0).toUpperCase()}
                            </div>

                            {/* User info */}
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`font-bold text-sm truncate ${
                                    isOwner
                                      ? "text-amber-700"
                                      : isCurrentUser
                                      ? "text-emerald-700"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {m.user_name || "(No name)"}
                                <span
                                  className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-full ${
                                    isOwner
                                      ? "bg-amber-200 text-amber-800"
                                      : "bg-teal-100 text-teal-700"
                                  }`}
                                >
                                  {m.role_name}
                                </span>
                                                                {isCurrentUser && (
                                  <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                                    YOU
                                  </span>
                                )}
                                </p>

                                {isOwner && (
                                  <svg
                                    className="w-4 h-4 text-amber-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>

                              <p
                                className="text-xs text-gray-600 truncate"
                                title={m.user_email}
                              >
                                {m.user_email}
                              </p>
                            </div>
                          </div>

                          {/* Remove button */}
                          {currentProject?.role_name === "Project Owner" &&
                            m.role_name !== "Project Owner" &&
                            m.user_id !== currentUser?.id && (
                              <button
                                onClick={() => handleRemove(m.user_id)}
                                className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                title="Remove member"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No members yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Start by inviting team members
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Invites Section */}

        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
      `}</style>

      {popup.visible && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, visible: false })}
        />
      )}

      {/* Dialog xác nhận xóa thành viên có task - Modern Gradient Style */}
      {confirmDialog.visible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-slideUp">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Warning!</h3>
                  <p className="text-sm text-white/90 mt-0.5">Member has assigned tasks</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4 leading-relaxed">{confirmDialog.message}</p>
              
              {/* Task List */}
              <div className="mb-5 max-h-64 overflow-y-auto custom-scrollbar">
                <p className="text-sm font-semibold text-gray-600 mb-3">Affected Tasks:</p>
                <ul className="space-y-2">
                  {confirmDialog.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border-2 border-red-100 hover:border-red-200 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-red-500 to-rose-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                          {task.id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">
                            {task.name}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to remove this member?
                </p>
                <p className="text-sm font-bold text-red-600 mt-2">
                  ⚠️ All task assignments will be permanently canceled!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmDialog({
                      visible: false,
                      message: "",
                      tasks: [],
                      onConfirm: null,
                    })
                  }
                  className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 font-medium text-gray-700 transition-all hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all hover:scale-[1.02]"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default withPermissions(Team);
