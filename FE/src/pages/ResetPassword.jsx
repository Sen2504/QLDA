import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import Popup_message from "../components/Popup_message";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // So sánh mật khẩu realtime
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp!");
    } else {
      setPasswordError("");
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setMessage(res.data.message || "Đặt lại mật khẩu thành công!");
      setShowPopup(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "Có lỗi xảy ra!");
      setShowPopup(true);
    }
  };

  const handleConfirm = () => {
    setShowPopup(false);
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-r from-pink-100 to-rose-200">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center text-rose-700 mb-6">
          Reset Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mật khẩu mới */}
          <div>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-400 outline-none"
              required
            />
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${
                passwordError
                  ? "border-red-400 focus:ring-red-300"
                  : "focus:ring-rose-400"
              }`}
              required
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!!passwordError}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              passwordError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            Reset Password
          </button>
        </form>
      </div>

      {showPopup && (
        <Popup_message message={message} onClose={handleConfirm} />
      )}
    </div>
  );
}
