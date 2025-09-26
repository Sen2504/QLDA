import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProjectService from "../services/projectService";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    ProjectService.getMyProjects()
      .then((res) => setProjects(res.data))
      .catch((err) => {
        if (err.response?.status === 401) navigate("/login");
      });
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await ProjectService.create({
        name_project: name,
        description,
      });
      setProjects([...projects, res.data]); // thêm project mới vào list
      setName("");
      setDescription("");
    } catch (err) {
      alert(err.response?.data?.error || "Error creating project");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Form tạo project */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Create New Project
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Create
            </button>
          </form>
        </div>

        {/* Danh sách project */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            My Projects
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-green-600">
                    {proj.name_project}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {proj.description || "No description"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Bạn chưa có project nào.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
