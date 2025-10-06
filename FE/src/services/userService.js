// src/services/userService.js
import api from "./api";

const UserService = {
  getProfile() {
    return api.get("/users/me");
  },

  updateProfile(data) {
    // data = { name, skillset }
    return api.put("/users/me", data);
  },

  uploadAvatar(formData) {
    // formData = new FormData(); formData.append("avatar", file);
    return api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  changePassword(data) {
    // data = { oldPassword, newPassword, confirmPassword }
    return api.put("/users/me/change-password", data);
  },
};

export default UserService;
