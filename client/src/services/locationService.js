import api from './api';

export const locationService = {
  async getAutocompleteSuggestions(text, cancelToken) {
    if (!text || text.trim().length < 3) {
      return [];
    }
    const res = await api.get('/locations/autocomplete', {
      params: { text: text.trim() },
      cancelToken,
    });
    return res.data?.data?.suggestions || [];
  },

  async getDrivingRoute(originCoords, destCoords) {
    const waypoints = `${originCoords.lat},${originCoords.lon}|${destCoords.lat},${destCoords.lon}`;
    const res = await api.get('/locations/route', {
      params: { waypoints },
    });
    return res.data?.data || null;
  },
};
