// src/services/userService.js
import api from "./api";

const UserService = {
  getProfile() {
    return api.get("/users/me");
  },

  updateProfile(data) {
    return api.put("/users/me", data);
  },

  changePassword(data) {
    return api.put("/users/me/password", data);
  },

  uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default UserService;
