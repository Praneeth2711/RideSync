import api from './api';

export const bookingService = {
  async requestSeats(rideId, seatsRequested) {
    const res = await api.post('/bookings', { rideId, seatsRequested });
    return res.data;
  },

  async getMyBookings() {
    const res = await api.get('/bookings/my');
    return res.data;
  },

  async getRideRequests(rideId) {
    const res = await api.get(`/rides/${rideId}/requests`);
    return res.data;
  },

  async acceptRequest(bookingId) {
    const res = await api.patch(`/bookings/${bookingId}/accept`);
    return res.data;
  },

  async rejectRequest(bookingId) {
    const res = await api.patch(`/bookings/${bookingId}/reject`);
    return res.data;
  },
};
