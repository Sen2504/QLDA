import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

/**
 * Persistent Layout - Navbar, Sidebar, Footer chỉ mount 1 lần duy nhất
 * Chỉ có <Outlet /> (page content) thay đổi khi navigate
 * 
 * Lợi ích:
 * - Navbar không re-render khi chuyển page
 * - API calls chỉ gọi 1 lần duy nhất trong session
 * - Performance tối ưu nhất
 */
export default function PersistentLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Outlet = nơi render page content */}
          <Outlet />
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
