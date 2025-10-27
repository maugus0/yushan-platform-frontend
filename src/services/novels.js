import { http, authHeader, toAbsoluteUrl } from './_http';

const novelsApi = {
  async getDetail(id) {
    const res = await http.get(`/novels/${id}`, { headers: authHeader() });
    return res?.data?.data;
  },
  async vote(novelId) {
    // new endpoint: POST /votes/novels/{novelId}
    //const res = await http.post(`/votes/novels/${novelId}`, {}, { headers: authHeader() });
    const res = await http.post(`/votes/novels/${novelId}`, {}, { headers: authHeader() });
    return res?.data?.data; // { novelId, voteCount, isVoted, remainedYuan }
  },
  // utility for cover url
  coverUrl(v) {
    return toAbsoluteUrl(v);
  },
  async getChapters(novelId) {
    const res = await http.get(`/chapters/novel/${novelId}?page=1&pageSize=1&publishedOnly=true`, {
      headers: authHeader(),
    });
    return res?.data?.data;
  },
  async getChaptersFull(novelId) {
    const res = await http.get(`/chapters/novel/${novelId}`, {
      params: { page: 0, size: 100 },
      headers: authHeader(),
    });

    // backend returns { code, message, data: { content: [...], totalElements, ... } }
    const data = res?.data?.data ?? res?.data;
    const chapters = Array.isArray(data?.content) ? data.content : data?.chapters || [];

    return {
      chapters,
      totalElements: data?.totalElements ?? (Array.isArray(chapters) ? chapters.length : 0),
    };
  },
  async getChapterContent(novelId, chapterNumber) {
    const res = await http.get(`/chapters/novel/${novelId}/number/${chapterNumber}`, {
      headers: authHeader(),
    });
    return res?.data?.data;
  },
  async getChapterByUuid(uuid) {
    const res = await http.get(`/chapters/${uuid}`, { headers: authHeader() });
    return res?.data?.data;
  },
  // Record a view for a novel (fire-and-forget). Backend returns simple payload.
  async addView(novelId) {
    const res = await http.post(`/novels/${novelId}/view`, {}, { headers: authHeader() });
    return res?.data;
  },
};

export default novelsApi;
