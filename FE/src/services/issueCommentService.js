import api from "./api";

const IssueCommentService = {
  async create(issueId, payload) {
    return api.post(`/issues/${issueId}/comments`, payload);
  },
  async delete(issueId, commentId) {
    return api.delete(`/issues/${issueId}/comments/${commentId}`);
  },
};

export default IssueCommentService;
