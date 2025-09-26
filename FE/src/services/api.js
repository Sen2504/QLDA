import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend Flask
  withCredentials: true, // để cookie session Flask tự động gửi
});

export default api;