import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const [userStories, setUserStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();

  useEffect(() => {
    // load project info nếu chưa có
    if (!currentProject) {
      api.get(`/projects/${projectId}`)
        .then((res) => setCurrentProject(res.data))
        .catch(() => navigate("/projects"));
    }

    // lấy user stories
    api.get(`/user-stories/project/${projectId}`)
      .then((res) => setUserStories(res.data))
      .catch((err) => console.error("User Stories error:", err));

    // lấy tasks
    api.get(`/tasks/project/${projectId}`)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error("Tasks error:", err));

    // lấy sprints
    api.get(`/sprints/project/${projectId}`)
      .then((res) => setSprints(res.data))
      .catch((err) => console.error("Sprints error:", err));
  }, [projectId, currentProject, navigate, setCurrentProject]);

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold text-green-700 mb-6">
          {currentProject ? currentProject.name : "Project Dashboard"}
        </h2>

        {/* User Stories */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">User Stories</h3>
          {userStories.length > 0 ? (
            <ul className="space-y-3">
              {userStories.map((us) => (
                <li key={us.id} className="bg-white p-4 rounded shadow">
                  <h4 className="font-medium">{us.name}</h4>
                  <p className="text-sm text-gray-600">{us.description}</p>
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
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.id} className="bg-white p-4 rounded shadow">
                  <h4 className="font-medium">{t.title}</h4>
                  <p className="text-sm text-gray-600">Status: {t.status}</p>
                </li>
              ))}
            </ul>
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
