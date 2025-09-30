import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks"; // <-- placeholder
import Team from "./pages/Team";
import ProjectDashboard from "./pages/ProjectDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} /> {/* <-- placeholder */}
        <Route path="/projects/:projectId/team" element={<Team />} />
        <Route path="/projects/:projectId/dashboard" element={<ProjectDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}
