import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  const handleLogout = async () => {
    await api.post("/auth/logout");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-purple-100 to-pink-200">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl text-center">
        {user ? (
          <>
            <h2 className="text-3xl font-bold text-purple-700 mb-4">
              Hello, {user.email}
            </h2>
            <p className="text-gray-600 mb-6">
              Welcome to your dashboard ✨
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <p className="text-gray-500">Loading...</p>
        )}
      </div>
    </div>
  );
}
