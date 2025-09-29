import api from "./api";

const TeamService = {
  getTeam: (projectId) => api.get(`/teams/${projectId}`),
  inviteUser: (projectId, data) =>
    api.post(`/teams/invite/${projectId}`, data),
  removeUser: (projectId, userId) =>
    api.delete(`/teams/remove/${projectId}/${userId}`),
};

export default TeamService;
