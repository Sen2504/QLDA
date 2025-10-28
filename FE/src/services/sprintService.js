import api from "./api";

const SprintService = {
  create(data) {
    return api.post("/sprints/", data);
  },
  getByProject(projectId) {
    return api.get(`/sprints/project/${projectId}`);
  },
  addUserStory(sprintId, userStoryId) {
    return api.put(`/sprints/${sprintId}/add_user_story/${userStoryId}`);
  },
  removeUserStory(userStoryId) {
    return api.put(`/sprints/remove_user_story/${userStoryId}`);
  },
  delete(sprintId) {
    return api.delete(`/sprints/${sprintId}`);
  },
};

export default SprintService;
