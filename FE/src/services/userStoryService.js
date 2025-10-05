import api from "./api";

const UserStoryService = {
  create(data) {
    return api.post("/user_stories/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAll() {
    return api.get("/user_stories/");
  },
  getById(id) {
    return api.get(`/user_stories/${id}`);
  },
  update(id, data) {
    return api.put(`/user_stories/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete(id) {
    return api.delete(`/user_stories/${id}`);
  },
  download(id) {
    return api.get(`/user_stories/${id}/download`, { responseType: "blob" });
  },

  // load dropdown trạng thái
  async getStatuses() {
    try {
      const res = await api.get("/workflow_status/");
      return res.data; // [{id, name}]
    } catch {
      return [{ id: 0, name: "New" }]; // fallback
    }
  },

  // load danh sách Role để chọn điểm
  async getComplexityOptions() {
    try {
      const res = await api.get("/complexity_points/options");
      return res.data; // [{ name: "Front End", points: [0,1,2,3,5,8] }, ...]
    } catch (err) {
      console.error("Error loading complexity options:", err);
      return [];
    }
  }
}

export default UserStoryService;
