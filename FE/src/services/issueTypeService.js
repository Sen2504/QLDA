import api from "./api";

const IssueTypeService = {
  getAll() {
    return api.get("issue_types/");
  },
  getById(id) {
    return api.get(`/issue_type/${id}`);
  },
  create(data) {
    return api.post("/issue_type/", data);
  },
};

export default IssueTypeService;
