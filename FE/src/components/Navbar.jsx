import { UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 shadow-md flex justify-between items-center">
      {/* Logo */}
      <h1 className="text-xl font-bold tracking-wide">QLDA</h1>

      {/* User info */}
      <div className="flex items-center space-x-3">
        <span className="font-medium">Xin chào, User</span>
        <UserCircle className="w-8 h-8" />
      </div>
    </header>
  );
}
