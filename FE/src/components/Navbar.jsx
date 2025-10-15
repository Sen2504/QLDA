import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle, Mail } from "lucide-react";
import api from "../services/api";
import TeamService from "../services/teamService";
import PopupMessage from "../components/Popup_message";
import { useProject } from "../store/ProjectContext";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [invites, setInvites] = useState([]);
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "", visible: false });
  const navigate = useNavigate();
  const { setCurrentProject } = useProject();

  const showPopup = useCallback((message, type = "success") => {
    setPopup({ message, type, visible: true });
    setTimeout(() => {
      setPopup({ message: "", type: "", visible: false });
    }, 3000);
  }, []);

  useEffect(() => {
    let ignore = false;

    api
      .get("/auth/me")
      .then((res) => {
        if (!ignore) setUser(res.data);
      })
      .catch(() => {
        setCurrentProject(null);
        navigate("/login");
      });

    return () => {
      ignore = true;
    };
  }, [navigate, setCurrentProject]);

  useEffect(() => {
    let ignore = false;

    TeamService.getMyInvites()
      .then((res) => {
        if (!ignore) setInvites(res.data);
      })
      .catch((err) => {
        if (!ignore && err.response?.status !== 401) {
          showPopup("Unable to download invitation!", "error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [showPopup]);

  const handleAccept = async (inviteId) => {
    try {
      await TeamService.acceptInvite(inviteId);
      setInvites(invites.filter((i) => i.id !== inviteId));
      showPopup("You have successfully joined the project!", "success");
    } catch (err) {
      showPopup(err.response?.data?.error || "Error accept invite", "error");
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await TeamService.rejectInvite(inviteId);
      setInvites(invites.filter((i) => i.id !== inviteId));
      showPopup("You have declined the invitation.", "warning");
    } catch (err) {
      showPopup(err.response?.data?.error || "Error reject invite", "error");
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 shadow-md flex justify-between items-center relative">
        {/* Logo */}
        <h1 className="text-xl font-bold tracking-wide">QLDA</h1>

        <div className="flex items-center space-x-6 relative">
          {/* Dropdown Invites */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative focus:outline-none"
            >
              <Mail className="w-6 h-6" />
              {invites.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs font-bold rounded-full px-1.5">
                  {invites.length}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded shadow-lg z-50">
                <div className="p-3 border-b font-semibold">My invitation</div>
                {invites.length > 0 ? (
                  <ul className="max-h-64 overflow-y-auto">
                    {invites.map((i) => (
                      <li
                        key={i.id}
                        className="p-3 border-b last:border-none flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">Project #{i.project_name}</p>
                          <p className="text-sm text-gray-600">
                            Role: {i.role_name}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleAccept(i.id)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleReject(i.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-gray-500">There are no invitations</div>
                )}
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <span className="font-medium">
              {user ? `Welcome, ${user.name}` : "Loading..."}
            </span>
            <UserCircle
              className="w-8 h-8 cursor-pointer hover:text-green-300"
              onClick={() => navigate("/profile")}
              title="Xem & chỉnh sửa Profile"
            />
          </div>
        </div>
      </header>

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
