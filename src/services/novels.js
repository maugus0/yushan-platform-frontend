import { http, authHeader, toAbsoluteUrl } from './_http';

const novelsApi = {
  async getDetail(id) {
    const res = await http.get(`/novels/${id}`, { headers: authHeader() });
    return res?.data?.data;
  },
  async vote(novelId) {
    const res = await http.post(`/novels/${novelId}/vote`, {}, { headers: authHeader() });
    return res?.data?.data; // { novelId, voteCount, remainedYuan }
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
};

export default novelsApi;
