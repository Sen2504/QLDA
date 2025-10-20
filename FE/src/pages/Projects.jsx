import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProjectService from "../services/projectService";
import { useProject } from "../store/ProjectContext";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { setCurrentProject } = useProject();
  
  // useRef để chặn duplicate API calls
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Chặn cứng - chỉ fetch 1 lần
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    ProjectService.getMyProjects()
      .then((res) => {
        setProjects(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate("/login");
      });
  }, []); // Empty deps - chỉ chạy on mount

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // gọi API tạo project
      const res = await ProjectService.create({
        name_project: name,
        description,
      });

      const newProject = res.data;

      // thêm vào danh sách tạm
      setProjects((prev) => [...prev, newProject]);

      // đặt project mới làm currentProject (sidebar auto chọn)
      setCurrentProject(newProject);

      // reset form
      setName("");
      setDescription("");

      // điều hướng sang dashboard
      navigate("/");

      // gọi lại API để sidebar cập nhật danh sách mới
      setTimeout(async () => {
        try {
          const list = await ProjectService.getMyProjects();
          setProjects(list.data);
        } catch (err) {
          console.error("Reload project list failed", err);
        }
      }, 500);
    } catch (err) {
      alert(err.response?.data?.error || "Error creating project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Lưu trữ project này?")) return;
    try {
      await ProjectService.archive(id);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Error archiving project");
    }
  };

  const handleRestore = async (id) => {
    try {
      await ProjectService.restore(id);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "active" } : p))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Error restoring project");
    }
  };

  return (
    <>
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
              disabled={isCreating}
              className={`${
                isCreating
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white px-6 py-2 rounded-lg transition`}
            >
              {isCreating ? "Đang tạo..." : "Tạo"}
            </button>
          </form>
        </div>

        {/* Danh sách project */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            My projects
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/projects/${proj.id}/team`)}
                >
                  <h3 className="font-semibold text-green-600">{proj.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {proj.description || "Không có mô tả"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status:{" "}
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

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    {proj.role_name === "Project Owner" && (
                      <>
                        {proj.status === "active" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(proj.id);
                            }}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                          >
                            Storage
                          </button>
                        )}
                        {proj.status === "archived" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(proj.id);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                          >
                            Restore
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You have not participated in any projects yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
