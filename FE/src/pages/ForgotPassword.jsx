import { useState } from "react";
import api from "../services/api";
import Popup_message from "../components/Popup_message";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      setType("success");
      setShowPopup(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong");
      setType("error");
      setShowPopup(true);
    }
  };

  const handleConfirm = () => {
    setShowPopup(false);
    // Ở ForgotPassword chỉ cần đóng popup, chưa cần navigate
    // Nếu muốn redirect thì có thể thêm navigate("/login") ở đây
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-r from-yellow-100 to-orange-200">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center text-orange-700 mb-6">
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition"
          >
            Send reset link
          </button>
        </form>
      </div>

      {showPopup && (
        <Popup_message
          message={message}
          type={type}
          onClose={handleConfirm}
        />
      )}
    </div>
  );
}
