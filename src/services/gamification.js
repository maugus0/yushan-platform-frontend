import { http } from './_http';

const gamificationApi = {
  async getMyStats() {
    const res = await http.get('/gamification/stats/me');
    // res.data.data = { level, currentExp, totalExpForNextLevel, yuanBalance }
    return res?.data?.data;
  },
};

export default gamificationApi;
