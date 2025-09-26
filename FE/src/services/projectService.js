import api from "./api";

const ProjectService = {
  create: async (data) => {
    return api.post("/projects/create", data);
  },
  getMyProjects: async () => {
    return api.get("/projects/my-projects");
  },
};

export default ProjectService;
