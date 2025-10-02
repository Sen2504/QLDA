import api from "./api";

const ProjectService = {
  getAll: () => api.get("/projects/"),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects/create", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMyProjects: () => api.get("/projects/my-projects"),
  archive: (id) => api.put(`/projects/${id}/archive`),
  restore: (id) => api.put(`/projects/${id}/restore`),
};

export default ProjectService;
