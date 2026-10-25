import api from './api';

export const rideService = {
  async createRide(rideData) {
    const res = await api.post('/rides', rideData);
    return res.data;
  },

  async searchRides(params = {}) {
    const res = await api.get('/rides', { params });
    return res.data;
  },

  async getMyRides() {
    const res = await api.get('/rides/my');
    return res.data;
  },

  async getRideById(id) {
    const res = await api.get(`/rides/${id}`);
    return res.data;
  },
};
