// file: src/services/hashtagService.js
import api from "./api";

const HashtagService = {
  search(q) {
    return api.get(`/hashtags/search`, { params: { q } });
  },
};

export default HashtagService;
