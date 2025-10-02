// file: services/teamService.js
import api from "./api";

const TeamService = {
  // --- TEAM ---
  getTeamSummary(projectId) {
    // lấy cả members + pending_invites
    return api.get(`/team_invites/project/${projectId}/summary`);
  },

  removeUser(projectId, userId) {
    return api.delete(`/teams/${projectId}/remove/${userId}`);
  },
  
  // --- TEAM_INVITE ---
  inviteUser(data) {
    // { project_id, role_id, email }
    return api.post("/team_invites/invite", data);
  },

  revokeInvite(inviteId) {
    return api.delete(`/team_invites/revoke/${inviteId}`);
  },

  getMyInvites() {
    return api.get("/team_invites/my-invites");
  },

  acceptInvite(inviteId) {
    return api.post(`/team_invites/accept/${inviteId}`);
  },

  rejectInvite(inviteId) {
    return api.post(`/team_invites/reject/${inviteId}`);
  },

  // --- ROLES ---
  getRoles() {
    return api.get("/roles/");
  },
  
};

export default TeamService;
