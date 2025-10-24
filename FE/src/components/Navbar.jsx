import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserCircle, 
  Mail, 
  BellRing, 
  Check, 
  X,
  Sparkles,
  ChevronDown,
  LogOut
} from "lucide-react";
import api from "../services/api";
import TeamService from "../services/teamService";
import PopupMessage from "../components/Popup_message";
import { useProject } from "../store/ProjectContext";

// Invite dropdown tách riêng -> tránh render lại Navbar mỗi khi toggle
const InviteDropdown = memo(({ invites, onAccept, onReject }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)} 
        className="relative p-2 rounded-xl hover:bg-white/10 transition-all duration-200 focus:outline-none group"
        title="Invitations"
      >
        <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        {invites.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-lg animate-pulse">
            {invites.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white text-lg">Invitations</h3>
              </div>
              {invites.length > 0 && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {invites.length} new
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          {invites.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto custom-scrollbar">
              {invites.map((i, index) => (
                <li
                  key={i.id}
                  className={`p-4 hover:bg-emerald-50 transition-all duration-200 ${
                    index !== invites.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                        <p className="font-bold text-gray-900 truncate">
                          {i.project_name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          <Sparkles className="w-3 h-3" />
                          {i.role_name}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onAccept(i.id)}
                        className="group p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-200"
                        title="Accept"
                      >
                        <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => onReject(i.id)}
                        className="group p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200"
                        title="Reject"
                      >
                        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No new invitations</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

function Navbar() {
  const [user, setUser] = useState(null);
  const [invites, setInvites] = useState([]);
  const [popup, setPopup] = useState({ message: "", type: "", visible: false });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userFetchedRef = useRef(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { setCurrentProject } = useProject();

  // popup tiện ích
  const showPopup = useCallback((message, type = "success") => {
    setPopup({ message, type, visible: true });
    setTimeout(() => setPopup({ message: "", type: "", visible: false }), 3000);
  }, []);

  // Close user menu khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // ✅ Chỉ 1 useEffect cho tất cả API call
  useEffect(() => {
    if (userFetchedRef.current) return;
    userFetchedRef.current = true;


    Promise.all([api.get("/auth/me"), TeamService.getMyInvites()])
      .then(([userRes, invitesRes]) => {
        setUser(userRes.data);
        setInvites(invitesRes.data || []);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setCurrentProject(null);
          navigate("/login");
        } else {
          showPopup("Unable to load data", "error");
        }
      });
  }, []);
  
  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Error logging out", err);
    } finally {
      setCurrentProject(null);
      navigate("/login", { replace: true });
    }
  }, [navigate, setCurrentProject]);

  const handleAccept = async (inviteId) => {
    try {
      await TeamService.acceptInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showPopup("You have successfully joined the project! 🎉", "success");
    } catch (err) {
      showPopup(err.response?.data?.error || "Error accept invite", "error");
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await TeamService.rejectInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showPopup("You have declined the invitation.", "warning");
    } catch (err) {
      showPopup(err.response?.data?.error || "Error reject invite", "error");
    }
  };

  return (
    <>
      <header className=" top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Left - Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-auto flex items-center">
                <img
                  src="/images/logo.png"
                  alt="QLDA Logo"
                  className="max-h-10 w-auto object-contain"
                  style={{
                    objectFit: "contain",
                    transform: "scale(4.0)", // phóng to hợp lý mà ko vỡ
                    marginLeft: "90px",
                  }}
                />
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Invitations */}
              <InviteDropdown invites={invites} onAccept={handleAccept} onReject={handleReject} />

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-200 border-2 border-transparent hover:border-emerald-200"
                >
                  <div className="text-right hidden md:block">
                    <span className="block">{user ? user.name : "Loading..."}</span>
                    <span className="block">{user?.email || ""}</span>
                  </div>

                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-md text-base">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                  
                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{user?.name || "User"}</p>
                          <p className="text-xs text-white/80 truncate">{user?.email || ""}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-all duration-200 text-gray-700 hover:text-emerald-700"
                      >
                        <UserCircle className="w-5 h-5" />
                        <span className="font-medium">View Profile</span>
                      </button>

                      <div className="my-2 border-t border-gray-100"></div>

                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all duration-200 text-gray-700 hover:text-red-600"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

export default memo(Navbar);
