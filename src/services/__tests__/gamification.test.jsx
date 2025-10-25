import gamificationApi from '../gamification';

// mock http module used inside gamification.js
jest.mock('../_http', () => ({
  http: {
    get: jest.fn(),
  },
}));

import { http } from '../_http';

describe('gamificationApi.getMyStats', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns stats object on success', async () => {
    const payload = {
      level: 5,
      currentExp: 1200,
      totalExpForNextLevel: 1500,
      yuanBalance: 42,
    };
    http.get.mockResolvedValue({ data: { data: payload } });

    const res = await gamificationApi.getMyStats();

    expect(res).toEqual(payload);
    expect(http.get).toHaveBeenCalledWith('/gamification/stats/me');
  });

  test('returns undefined when response has no data field', async () => {
    http.get.mockResolvedValue({ data: {} });

    const res = await gamificationApi.getMyStats();

    expect(res).toBeUndefined();
    expect(http.get).toHaveBeenCalledWith('/gamification/stats/me');
  });

  test('propagates error when request fails', async () => {
    http.get.mockRejectedValue(new Error('Network error'));

    await expect(gamificationApi.getMyStats()).rejects.toThrow('Network error');
    expect(http.get).toHaveBeenCalledWith('/gamification/stats/me');
  });
});

describe('gamificationApi.getMyAchievements', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns achievements array on success', async () => {
    const list = [
      {
        id: 1,
        name: 'First Read',
        description: 'Read first chapter',
        iconUrl: '',
        unlockedAt: '2025-01-01',
      },
      { id: 2, name: 'Reviewer', description: 'Left a review', iconUrl: '', unlockedAt: null },
    ];
    http.get.mockResolvedValue({ data: { data: list } });

    const res = await gamificationApi.getMyAchievements();

    expect(res).toEqual(list);
    expect(Array.isArray(res)).toBe(true);
    expect(http.get).toHaveBeenCalledWith('/gamification/achievements/me');
  });

  test('returns empty array when response has no data', async () => {
    http.get.mockResolvedValue({ data: {} });

    const res = await gamificationApi.getMyAchievements();

    expect(res).toEqual([]);
    expect(http.get).toHaveBeenCalledWith('/gamification/achievements/me');
  });

  test('propagates error when request fails', async () => {
    http.get.mockRejectedValue(new Error('Server down'));

    await expect(gamificationApi.getMyAchievements()).rejects.toThrow('Server down');
    expect(http.get).toHaveBeenCalledWith('/gamification/achievements/me');
  });
});
