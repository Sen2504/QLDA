import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import ProjectDashboard from "./pages/ProjectDashboard";
import ProjectPermissions from "./pages/ProjectPermissions";
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
import TaskDetail from "./pages/TaskDetail";
import IssueDetail from "./pages/IssueDetail";
import ResendConfirm from "./pages/ResendConfirm";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop theme="colored" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} /> 
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/projects/:projectId/team" element={<Team />} />
        <Route path="/projects/:projectId/dashboard" element={<ProjectDashboard />} />
        <Route path="/projects/:projectId/permissions" element={<ProjectPermissions />} />
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
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/resend-confirm" element={<ResendConfirm />} />
      </Routes>
    </BrowserRouter>
  );
}
