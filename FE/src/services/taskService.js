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

  create(data) {
    // data should be a plain object; backend expects JSON
    return api.post(`/tasks/`, data);
  },

  // optional helpers
  getById(id) {
    return api.get(`/tasks/${id}`);
  },

  update(id, data) {
    return api.put(`/tasks/${id}`, data);
  },

  delete(id) {
    return api.delete(`/tasks/${id}`);
  },
};

export default TaskService;
