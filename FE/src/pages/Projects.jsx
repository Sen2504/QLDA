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
      setProjects([...projects, res.data]);
      setName("");
      setDescription("");
    } catch (err) {
      alert(err.response?.data?.error || "Error creating project");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa project này?")) return;
    try {
      await ProjectService.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting project");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Form tạo project */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Tạo Project mới
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Tên project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
            <textarea
              placeholder="Mô tả"
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
            Dự án của tôi
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/projects/${proj.id}/team`)} // navigate đến Team
                >
                  <h3 className="font-semibold text-green-600">
                    {proj.name_project}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {proj.description || "Không có mô tả"}
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn click card
                        handleDelete(proj.id);
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Bạn chưa tham gia project nào.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
