import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProjectService from "../services/projectService";
import { useProject } from "../store/ProjectContext";
import {
  PlusCircle,
  FolderKanban,
  Rocket,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { setCurrentProject } = useProject();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    ProjectService.getMyProjects()
      .then((res) => setProjects(res.data || []))
      .catch((err) => {
        if (err.response?.status === 401) navigate("/login");
      });
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const res = await ProjectService.create({
        name_project: name,
        description,
      });
      const newProject = res.data;
      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);
      setName("");
      setDescription("");
      navigate("/");
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 flex flex-col items-center">

      {/* Two-column layout */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Form Create (Left) */}
        <div
          id="create-section"
          className="bg-white/90 backdrop-blur-sm border border-emerald-200/60 rounded-xl shadow-md p-5 h-fit"
        >
          <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-3 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-600" />
            Create Project
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50 focus:bg-white transition"
                placeholder="Enter project name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-400 outline-none text-sm bg-gray-50 focus:bg-white transition h-[80px]"
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className={`px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all shadow-md flex items-center gap-2 ${
                  isCreating
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>

        {/* Project List (Right – spans 2 columns) */}
        <div className="md:col-span-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-md p-5 min-h-[60vh]">
          <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Projects Overview
          </h2>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No projects yet
              </h3>
              <p className="text-gray-500 text-xs">
                Create your first project to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="group bg-white border border-gray-100 hover:border-emerald-300 rounded-lg shadow-sm hover:shadow-md p-4 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/projects/${proj.id}/team`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-100 to-teal-100">
                        <FolderKanban className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-800 group-hover:text-emerald-700 transition">
                        {proj.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        proj.status === "archived"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                    {proj.description || "No description provided."}
                  </p>
                  {proj.role_name === "Project Owner" && (
                    <div className="flex gap-2 justify-end">
                      {proj.status === "active" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(proj.id);
                          }}
                          className="text-[11px] font-medium text-white bg-gradient-to-r from-yellow-500 to-amber-500 px-2 py-0.5 rounded-md hover:from-yellow-600 hover:to-amber-600"
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(proj.id);
                          }}
                          className="text-[11px] font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 rounded-md hover:from-blue-600 hover:to-indigo-600"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
