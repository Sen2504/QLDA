// file: services/teamService.js
import api from "./api";

const TeamService = {
  // --- TEAM ---
  getTeamSummary(projectId) {
    // lấy cả members + pending_invites
    return api.get(`/team_invites/project/${projectId}/summary`);
  },
    getByProjectId(projectId) {
    // lấy danh sách thành viên trong project
    return api.get(`/teams/${projectId}`);
  },

  removeUser(projectId, userId, force = false) {
    return api.delete(`/teams/${projectId}/remove/${userId}`, {
      data: { force }
    });
  },
  
  // --- TEAM_INVITE ---
  inviteUser(data) {
 
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

  // --- PROJECT ROLES ---
  getProjectRoles(projectId) {
    return api.get(`/project_roles/project/${projectId}`);
  },

  createCustomRole(projectId, name_role) {
    return api.post("/project_roles/custom", {project_id: projectId,name_role,});
  },
  

};

export default TeamService;
