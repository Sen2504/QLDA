import api from "./api";

const TaskService = {
  getByProject(projectId) {
    return api.get(`/tasks/project/${projectId}`);
  },

  getMineByProject(projectId) {
    return api.get(`/tasks/project/${projectId}/mine`);
  },

  getByUserStory(userStoryId) {
    return api.get(`/tasks/user-story/${userStoryId}`);
  },

  getMyTasks() {
    return api.get(`/tasks/my-tasks`);
  },

  async create(data) {
    try {
      const res = await api.post(`/tasks/`, data);
      // backend của bạn (TaskService.create) trả về dạng (task, error)
      // Nếu backend trả về object { data, error } thì ta xử lý ở đây
      if (res.data?.error) {
        return { error: res.data.error };
      }
      return { data: res.data, message: "Task created successfully!" };
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to create task.";
      return { error: msg };
    }
  },

  getById(id) {
    return api.get(`/tasks/${id}`);
  },

  async update(id, data) {
    return api.put(`/tasks/${id}`, data);
  },

  async delete(id) {
    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.data?.error) {
        return { error: res.data.error };
      }
      return { message: "Task deleted successfully!" };
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to delete task.";
      return { error: msg };
    }
  },

  async updateAssignees(id, team_ids) {
    try {
      const res = await api.put(`/tasks/${id}/assignees`, { team_ids });
      if (res.data?.error) {
        return { error: res.data.error };
      }
      return { data: res.data, message: "Assignees updated successfully!" };
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update assignees.";
      return { error: msg };
    }
  },
};

export default TaskService;
