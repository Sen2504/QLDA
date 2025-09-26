import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle } from "lucide-react";
import api from "../services/api";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/login")); // nếu chưa login thì quay về login
  }, [navigate]);

  return (
    <header className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 shadow-md flex justify-between items-center">
      {/* Logo */}
      <h1 className="text-xl font-bold tracking-wide">QLDA</h1>

      {/* User info */}
      <div className="flex items-center space-x-3">
        <span className="font-medium">
          {user ? `Xin chào, ${user.email}` : "Loading..."}
        </span>
        <UserCircle className="w-8 h-8" />
      </div>
    </header>
  );
}
