import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response, // Nếu OK (200/201/204) thì trả qua luôn
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "error_unknown";

    // 🔹 Nếu có message chứa "successfully" hoặc "created" => không hiển thị toast.error
    if (typeof message === "string" && /(successfully|created)/i.test(message)) {
      console.warn(" Backend returned 400 but message sounds like success:", message);
      return Promise.reject(error);
    }

    // Chỉ hiển thị thật sự khi là lỗi
    if (status === 400) {
      toast.error(message || "Request are not valid.");
    } else if (status === 401) {
      toast.error(message || "You are not authorized. Please log in.");
    } else if (status === 403) {
      const method = error?.config?.method?.toUpperCase?.();
      if (method && method !== "GET") {
        toast.error("You do not have permission to perform this action.");
      }
    } else if (status === 404) {
      toast.error(message || "Resource not found.");
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default api;
