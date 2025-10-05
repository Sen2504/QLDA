// pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import api from "../services/api";
import ProjectService from "../services/projectService";

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { setCurrentProject } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/login"));

    ProjectService.getMyProjects()
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Lỗi load projects:", err));

    api
      .get("/tasks/my-tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => console.error("Lỗi load tasks:", err));
  }, [navigate]);

  const handleSelectProject = (proj) => {
    setCurrentProject(proj);
    navigate(`/projects/${proj.id}/dashboard`);
  };

  const handleArchive = async (projId) => {
    try {
      await ProjectService.archive(projId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projId ? { ...p, status: "archived" } : p))
      );
    } catch (err) {
      console.error("Archive lỗi:", err);
    }
  };

  const handleRestore = async (projId) => {
    try {
      await ProjectService.restore(projId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projId ? { ...p, status: "active" } : p))
      );
    } catch (err) {
      console.error("Restore lỗi:", err);
    }
  };

  const handleLogout = async () => {
    await api.post("/auth/logout");
    navigate("/login");
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {user && (
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-green-700">
              Xin chào, {user.name}
            </h2>
            
          </div>
        )}

        {/* Projects */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Projects Dashboard
          </h3>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`bg-white p-4 rounded-lg shadow transition`}
                  onClick = {() => handleSelectProject(proj)}
                >
                  <h4 className="font-semibold text-green-600">{proj.name}</h4>
                  <p className="text-gray-600 text-sm">{proj.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Trạng thái:{" "}
                    <span
                      className={`${
                        proj.status === "archived"
                          ? "text-yellow-600"
                          : "text-green-600"
                      } font-semibold`}
                    >
                      {proj.status}
                    </span>
                  </p>

                  <div className="flex gap-2 mt-3">
                    

                    {/* Chỉ Project Owner mới thấy các nút này */}
                    {proj.role_name === "Project Owner" && (
                      <>
                        {proj.status === "active" && (
                          <button
                            onClick={() => handleArchive(proj.id)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                          >
                            Lưu trữ
                          </button>
                        )}
                        {proj.status === "archived" && (
                          <button
                            onClick={() => handleRestore(proj.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                          >
                            Khôi phục
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Bạn chưa tham gia project nào.</p>
          )}
        </section>

        {/* Tasks */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tasks</h3>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                  <p className="text-sm text-gray-600">
                    Trạng thái:{" "}
                    <span className="font-semibold text-green-600">
                      {task.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Bạn chưa có task nào.</p>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
