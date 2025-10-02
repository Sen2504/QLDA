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

  // load dropdown trạng thái (gợi ý route: /workflow_statuses/)
  async getStatuses() {
    try {
      const res = await api.get("/workflow_statuses/");
      return res.data; // [{id, name}]
    } catch {
      return [{ id: 0, name: "New" }]; // fallback
    }
  },


  async getComplexityOptions() {
    // code cứng danh sách vị trí + điểm
    return [
      { name: "UX", points: [0, 1, 2, 3, 5, 8] },
      { name: "Design", points: [0, 1, 2, 3, 5, 8] },
      { name: "FE", points: [0, 1, 2, 3, 5, 8] },
      { name: "BE", points: [0, 1, 2, 3, 5, 8] }
    ];
  },
};

export default UserStoryService;
