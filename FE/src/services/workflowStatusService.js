// src/services/workflowStatusService.js
import api from "./api";

const WorkflowStatusService = {
  getAll() {
    return api.get("/workflow_status").then((res) => res.data);
  },
};

export default WorkflowStatusService;
