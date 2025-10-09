import api from "./api";

const TaskCommentService = {
  list(taskId) {
    return api.get(`/tasks/${taskId}/comments`);
  },

  create(taskId, data) {
    return api.post(`/tasks/${taskId}/comments`, data);
  },

  delete(taskId, commentId) {
    return api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};

export default TaskCommentService;
