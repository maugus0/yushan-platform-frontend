// Real backend API for rankings. Uses CRA dev proxy: package.json "proxy": "http://localhost:8080/api"
import axios from 'axios';

// Prefer explicit API base if provided; otherwise use same-origin /api (dev proxy/nginx)
const CONFIG_URL = (process.env.REACT_APP_API_URL || '').trim();
const BASE = CONFIG_URL ? CONFIG_URL.replace(/\/$/, '') : '/api';

// Read JWT from localStorage
function authHeader() {
  const t = localStorage.getItem('jwt_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Normalize backend paging payload to the shape expected by the page
function normalizePage(resp) {
  const d = resp?.data?.data ?? {};
  const content = Array.isArray(d.content) ? d.content : [];
  return {
    items: content,
    total: d.totalElements ?? content.length ?? 0,
    page: (d.currentPage ?? 0) + 1,
    size: d.size ?? content.length ?? 0,
    raw: d,
  };
}

export default {
  // GET /api/ranking/novel
  async getNovels({ page = 1, size = 50, categoryId, sortType, timeRange } = {}) {
    const params = { page: page - 1, size };
    if (categoryId != null) params.category = categoryId;
    if (timeRange) params.timeRange = timeRange; // weekly | monthly | overall
    if (sortType) params.sortType = sortType; // view | vote
    const res = await axios.get(`${BASE}/ranking/novel`, { params, headers: authHeader() });
    return normalizePage(res);
  },

  // GET /api/ranking/user (readers)
  async getReaders({ page = 1, size = 50, timeRange, sortBy } = {}) {
    const params = { page: page - 1, size };
    if (timeRange) params.timeRange = timeRange;
    if (sortBy) params.sortBy = sortBy;
    const res = await axios.get(`${BASE}/ranking/user`, {
      params,
      headers: authHeader(),
    });
    return normalizePage(res);
  },

  // GET /api/ranking/author (writers)
  async getWriters({ page = 1, size = 50, timeRange, sortType } = {}) {
    const params = { page: page - 1, size };
    if (timeRange) params.timeRange = timeRange;
    if (sortType) params.sortType = sortType; // books | vote | view
    const res = await axios.get(`${BASE}/ranking/author`, {
      params,
      headers: authHeader(),
    });
    return normalizePage(res);
  },
};
