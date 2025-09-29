import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin user
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/login"));

    // Gọi API lấy project user tham gia
    api.get("/projects/my-projects")
      .then((res) => setProjects(res.data))
      .catch((err) => console.error(err));

    // Gọi API lấy task user tham gia
    api.get("/tasks/my-tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, [navigate]);

  const handleLogout = async () => {
    await api.post("/auth/logout");
    navigate("/login");
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Chào user */}
        {user && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-green-700">
              Welcome, {user.email}
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
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <h4 className="font-semibold text-green-600">{proj.name}</h4>
                  <p className="text-gray-600 text-sm">{proj.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Bạn chưa tham gia project nào.</p>
          )}
        </section>

        {/* Tasks */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            My Tasks
          </h3>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                  <p className="text-sm text-gray-600">
                    Status:{" "}
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
