import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁 thêm icon mắt
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

  // 👁 Trạng thái hiển thị/ẩn mật khẩu
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // So sánh mật khẩu realtime
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError("Confirmation password does not match!");
    } else {
      setPasswordError("");
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError("Confirmation password does not match!");
      return;
    }

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setMessage(res.data.message || "Reset password successfully!");
      setShowPopup(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "An error occurred!");
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
          {/* ===== New Password ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-400 outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-rose-600 focus:outline-none"
              >
                {showNewPassword ? (
                  <EyeOffIcon size={20} />
                ) : (
                  <EyeIcon size={20} />
                )}
              </button>
            </div>
          </div>

          {/* ===== Confirm Password ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg outline-none pr-10 focus:ring-2 ${
                  passwordError
                    ? "border-red-400 focus:ring-red-300"
                    : "focus:ring-rose-400"
                }`}
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-rose-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon size={20} />
                ) : (
                  <EyeIcon size={20} />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          {/* ===== Submit ===== */}
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
