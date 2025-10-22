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
      "Đã xảy ra lỗi không xác định.";

    // 🔹 Nếu có message chứa "successfully" hoặc "created" => không hiển thị toast.error
    if (typeof message === "string" && /(successfully|created)/i.test(message)) {
      console.warn(" Backend returned 400 but message sounds like success:", message);
      return Promise.reject(error);
    }

    // Chỉ hiển thị thật sự khi là lỗi
    if (status === 400) {
      toast.error(message || "Yêu cầu không hợp lệ.");
    } else if (status === 401) {
      toast.error(message || "Bạn cần đăng nhập để tiếp tục.");
    } else if (status === 403) {
      const method = error?.config?.method?.toUpperCase?.();
      if (method && method !== "GET") {
        toast.error("Bạn không có quyền thực hiện hành động này.");
      }
    } else if (status === 404) {
      toast.error(message || "Không tìm thấy tài nguyên.");
    } else if (status >= 500) {
      toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
    }

    return Promise.reject(error);
  }
);

export default api;
