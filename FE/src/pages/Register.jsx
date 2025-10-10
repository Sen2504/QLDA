import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Popup_message from "../components/Popup_message";
import CreatableSelect from "react-select/creatable";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👈 icon mắt

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [skillset, setSkillset] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle pass
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 👈 toggle confirm pass
  const navigate = useNavigate();

  const skillOptions = [
    { value: "Python", label: "Python" },
    { value: "JavaScript", label: "JavaScript" },
    { value: "React", label: "React" },
    { value: "Node.js", label: "Node.js" },
    { value: "Flask", label: "Flask" },
    { value: "Django", label: "Django" },
    { value: "SQL", label: "SQL" },
    { value: "Java", label: "Java" },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setType("error");
      setShowPopup(true);
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        name,
        skillset,
      });
      setMessage(res.data.message);
      setType("success");
      setShowPopup(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "Register failed");
      setType("error");
      setShowPopup(true);
    }
  };

  const handleConfirm = () => {
    setShowPopup(false);
    if (type === "success") {
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-100 to-indigo-200">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* ===== Name ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
              required
            />
          </div>

          {/* ===== Skillset ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skillset
            </label>
            <CreatableSelect
              isMulti
              options={skillOptions}
              onChange={(selected) =>
                setSkillset(selected.map((s) => s.value).join(","))
              }
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Chọn hoặc gõ skill mới..."
            />
          </div>

          {/* ===== Email ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* ===== Password ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-emerald-600 focus:outline-none"
              >
                {showPassword ? (
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-emerald-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon size={20} />
                ) : (
                  <EyeIcon size={20} />
                )}
              </button>
            </div>
          </div>

          {/* ===== Register Button ===== */}
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Already have an account?{" "}
          <span
            className="text-emerald-600 font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>

      {showPopup && (
        <Popup_message
          message={message}
          type={type}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
