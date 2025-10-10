import api from "./api";

const IssueService = {
  getAll() {
    return api.get("/issues/");
  },

  getByProject(projectId) {
    return api.get(`/issues/project/${projectId}`);
  },

  getById(id) {
    return api.get(`/issues/${id}`);
  },

  create(formData) {
    // multipart/form-data upload
    return api.post("/issues/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update(id, data) {
    return api.put(`/issues/${id}`, data);
  },
  
  delete(id) {
    return api.delete(`/issues/${id}`);
  },
};

export default IssueService;
