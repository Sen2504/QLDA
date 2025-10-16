import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import ProjectService from "../services/projectService";
import TaskService from "../services/taskService";
import UserStoryService from "../services/userStoryService";

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const [userStories, setUserStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const jobs = [];

      // Project info (only if not loaded)
      if (!currentProject) {
        jobs.push(
          api.get(`/projects/${projectId}`)
            .then((res) => { if (!cancelled) setCurrentProject(res.data); })
            .catch(() => { if (!cancelled) navigate("/projects"); })
        );
      }

      // User stories: run project-specific + fallback all in parallel, pick fastest valid
      const userStoriesJob = (async () => {
        try {
          const byProjectRes = await UserStoryService.getByProject(projectId);
          if (!cancelled) setUserStories(byProjectRes.data || []);
        } catch (e) {
          console.error('User stories load error:', e);
          if (!cancelled) setUserStories([]);
        }
      })();
      jobs.push(userStoriesJob);

      // Tasks & Sprints in parallel
      jobs.push(
        api.get(`/tasks/project/${projectId}`)
          .then((res) => { if (!cancelled) setTasks(res.data); })
          .catch((err) => console.error('Tasks error:', err))
      );
      jobs.push(
        api.get(`/sprints/project/${projectId}`)
          .then((res) => { if (!cancelled) setSprints(res.data); })
          .catch((err) => console.error('Sprints error:', err))
      );

      // Wait all (errors already handled individually)
      await Promise.allSettled(jobs);
    };

    load();
    return () => { cancelled = true; };
  }, [projectId, currentProject, navigate, setCurrentProject]);

  const handleArchive = async () => {
    try {
      await ProjectService.archive(projectId);
      setCurrentProject({ ...currentProject, status: "archived" });
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  const handleRestore = async () => {
    try {
      await ProjectService.restore(projectId);
      setCurrentProject({ ...currentProject, status: "active" });
    } catch (err) {
      console.error("Restore error:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-700">
            {currentProject ? currentProject.name : "Project Dashboard"}
          </h2>

          {/* Nếu là Owner thì show nút */}
          {currentProject?.role_name === "Project Owner" && (
            <div className="flex gap-2">
              {currentProject.status === "active" && (
                <button
                  onClick={handleArchive}
                  className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                >
                  Lưu trữ
                </button>
              )}
              {currentProject.status === "archived" && (
                <button
                  onClick={handleRestore}
                  className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                >
                  Khôi phục
                </button>
              )}
            </div>
          )}
        </div>

        {currentProject && (
          <p className="text-gray-600">
            {currentProject.description}{" "}
            <span className="ml-2 text-sm text-gray-500">
              (Status: {currentProject.status})
            </span>
          </p>
        )}

        {/* User Stories */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">User Stories</h3>
          {userStories.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userStories.map((us) => (
                <li
                  key={us.id}
                  onClick={() => navigate(`/user-stories/${us.id}`)}
                  className="bg-white p-4 rounded-2xl shadow cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <h4 className="font-semibold text-green-700">{us.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">{us.description}</p>

                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>ID: {us.id}</span>
                    <span className="hover:text-green-600 font-medium">Xem chi tiết →</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có user story nào.</p>
          )}
        </section>
        {/* Tasks */}
      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tasks</h3>

        {tasks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-2xl shadow hover:shadow-md hover:-translate-y-1 transition-all border-l-4 border-green-500"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {t.title || t.name}
                  </h4>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      t.status === "Done"
                        ? "bg-green-100 text-green-700"
                        : t.status === "In Progress"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t.status || "New"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3">
                  {t.description || "Không có mô tả."}
                </p>

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span>
                    {t.assignee?.user_email
                      ? `Giao cho: ${t.assignee.user_email}`
                      : "Chưa phân công"}
                  </span>
                  <span>#ID {t.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Chưa có task nào.</p>
        )}
      </section>


        {/* Sprints */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Sprints</h3>
          {sprints.length > 0 ? (
            <ul className="space-y-3">
              {sprints.map((s) => (
                <li key={s.id} className="bg-white p-4 rounded shadow">
                  <h4 className="font-medium">{s.name}</h4>
                  <p className="text-sm text-gray-600">
                    {s.start_date} - {s.end_date}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có sprint nào.</p>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
