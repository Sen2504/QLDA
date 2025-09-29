import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import Popup_message from "../components/Popup_message";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // lấy token từ URL
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setMessage(res.data.message);
      setShowPopup(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
      setShowPopup(true);
    }
  };

  const handleConfirm = () => {
    setShowPopup(false);
    navigate("/login"); // sau khi nhấn OK thì về login
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-r from-pink-100 to-rose-200">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center text-rose-700 mb-6">
          Reset Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-400 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition"
          >
            Reset Password
          </button>
        </form>
      </div>

      {showPopup && (
        <Popup_message message={message} onConfirm={handleConfirm} />
      )}
    </div>
  );
}
