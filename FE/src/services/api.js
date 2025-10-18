import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend Flask
  withCredentials: true, // để cookie session Flask tự động gửi
});

// Global response interceptor for permission and common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
  const status = error?.response?.status;
    const message = error?.response?.data?.error || error?.response?.data?.message;
    if (status === 401) {
      toast.error(message || "Bạn cần đăng nhập để tiếp tục.");
    } else if (status === 403) {
      // Show unified message only for non-GET (actions), stay silent on pure GET views
      const method = error?.config?.method?.toUpperCase?.();
      if (method && method !== "GET") {
        toast.error("Your role is not allowed for this action");
      }
    } else if (status === 404) {
      // Avoid noisy toasts for normal not-found navigations, but show for actions
      const method = error?.config?.method?.toUpperCase?.();
      if (method && method !== "GET") {
        toast.error(message || "Không tìm thấy tài nguyên.");
      }
    } else if (status >= 500) {
      toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
    }
    return Promise.reject(error);
  }
);

export default api;