import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar - full height */}
      <Sidebar className="w-64 bg-white border-r border-gray-200" />

      {/* Phần bên phải gồm Navbar, Content, Footer */}
      <div className="flex flex-col flex-1">
        {/* Navbar */}
        <Navbar className="h-16 border-b border-gray-200 bg-white shadow-sm" />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 to-green-100 p-6">
          {children}
        </main>

        {/* Footer */}
        <Footer className="h-12 border-t border-gray-200 bg-white" />
      </div>
    </div>
  );
}
