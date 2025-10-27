import { http, authHeader } from './_http';

const searchService = {
  async searchChapters(q, page = 1, size = 10) {
    try {
      const res = await http.get('/search/chapters', {
        params: {
          q,
          page,
          size,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        },
        headers: authHeader(),
      });

      // Handle both nested (res.data.data) and flat (res.data) response formats
      const data = res?.data?.data || res?.data || {};

      return {
        chapters: data.chapters || [],
        chapterCount: data.chapterCount || 0,
      };
    } catch (error) {
      console.error('Search chapters error:', error);
      return { chapters: [], chapterCount: 0 };
    }
  },

  async searchNovels(q, page = 1, size = 10) {
    try {
      const res = await http.get('/search/novels', {
        params: {
          q,
          page,
          size,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        },
        headers: authHeader(),
      });

      // Handle both nested (res.data.data) and flat (res.data) response formats
      const data = res?.data?.data || res?.data || {};

      return {
        novels: data.novels || [],
        novelCount: data.novelCount || 0,
      };
    } catch (error) {
      console.error('Search novels error:', error);
      return { novels: [], novelCount: 0 };
    }
  },

  async searchAll(q, page = 1, size = 10) {
    try {
      const [chaptersResult, novelsResult] = await Promise.all([
        this.searchChapters(q, page, size),
        this.searchNovels(q, page, size),
      ]);

      return {
        chapters: chaptersResult.chapters || [],
        chapterCount: chaptersResult.chapterCount || 0,
        novels: novelsResult.novels || [],
        novelCount: novelsResult.novelCount || 0,
      };
    } catch (error) {
      console.error('Search all error:', error);
      return {
        chapters: [],
        chapterCount: 0,
        novels: [],
        novelCount: 0,
      };
    }
  },

  async searchCombined(q, page = 0, size = 10) {
    const res = await http.get('/search', {
      params: {
        q,
        page,
        size,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      },
      headers: authHeader(),
    });

    // Handle both nested (res.data.data) and flat (res.data) response formats
    const data = res?.data?.data || res?.data || {};

    return data;
  },
};

export default searchService;
