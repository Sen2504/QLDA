import api from "./api";

const PermissionService = {
  getMatrix(projectId) {
    return api.get(`/permissions/project/${projectId}`);
  },

  getUserPermissions(projectId) {
    return api.get(`/permissions/matrix?project_id=${projectId}`);
  },

  updateRole(projectId, projroleId, updates) {
    return api.put(`/permissions/project/${projectId}/role/${projroleId}`, { updates });
  },
};

export default PermissionService;
