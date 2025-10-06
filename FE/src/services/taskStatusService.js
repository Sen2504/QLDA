import api from "./api";

const TaskStatusService = {
  getAll() {
 
    return api.get("/task_status/");
  },
};

export default TaskStatusService;
