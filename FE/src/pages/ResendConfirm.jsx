import { useState } from "react";
import api from "../services/api";
import Popup_message from "../components/Popup_message";
import { MailIcon } from "lucide-react";

export default function ResendConfirm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/resend-confirm", { email });
      setMessage(
        res.data.message === "already confirmed"
          ? "This account has been previously confirmed"
          : "A new confirmation email has been sent. Please check your mailbox"
      );
      setType("success");
    } catch (err) {
      setMessage(err.response?.data?.error || "Unable to resend the confirmation email");
      setType("error");
    } finally {
      setShowPopup(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-emerald-50 to-emerald-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">
          Resend Confirmation Email
        </h2>

        <form onSubmit={handleResend} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registered email
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Sending..." : "Resend confirmation link"}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Email confirmed?{" "}
          <a
            href="/login"
            className="text-emerald-600 font-medium hover:underline"
          >
            Sign in now
          </a>
        </p>
      </div>

      {showPopup && (
        <Popup_message
          message={message}
          type={type}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
