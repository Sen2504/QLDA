import api from "./api";

const RoleService = {
  getAll: () => api.get("/roles/"), 
};

export default RoleService;