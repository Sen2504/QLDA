import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import ProjectDashboard from "./pages/ProjectDashboard";
import MyInvites from "./pages/MyInvites";
import UserStoryList from "./pages/UserStoryList";
import UserStory from "./pages/UserStory";
import UserStoryEdit from "./pages/UserStoryEdit";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Issue from "./pages/Issue";
import IssueEdit from "./pages/IssueEdit";
import UserStoryDetail from "./pages/UserStoryDetail";
import SprintBoard from "./pages/SprintBoard";
import IssueList from "./pages/IssueList";

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
        <Route path="/my-invites" element={<MyInvites />} />
        <Route path="/user-stories" element={<UserStoryList />} />
        <Route path="/user-stories/new" element={<UserStory />} />
        <Route path="/user-stories/:id/edit" element={<UserStoryEdit />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user-stories/:userStoryId" element={<UserStoryDetail />} />
        <Route path="/projects/:projectId/sprints/:sprintId/taskboard" element={<SprintBoard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/issues" element={<Issue />} />
        <Route path="/issues/:id/edit" element={<IssueEdit />} />
        <Route path="/issues/list" element={<IssueList />} />
      </Routes>
    </BrowserRouter>
  );
}
