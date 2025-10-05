import api from "./api";

const UserService = {
  getProfile() {
    return api.get("/users/me");
  },
  updateProfile(data) {
    return api.put("/users/me", data);
  },
  changePassword(data) {
    return api.put("/users/me/change-password", data);
  },
};

export default UserService;
