import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { bookingService } from '../services/bookingService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import {
  Car,
  Calendar,
  Clock,
  ArrowRight,
  Inbox,
  User,
  CheckCircle,
} from 'lucide-react';
import { formatRideDate, formatRideTime, formatCurrency } from '../utils/formatDate';

const History = () => {
  const [activeTab, setActiveTab] = useState('offered'); // 'offered' | 'booked'
  const [offeredRides, setOfferedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const [offeredRes, bookedRes] = await Promise.all([
        rideService.getMyRides(),
        bookingService.getMyBookings(),
      ]);
      setOfferedRides(offeredRes.data?.rides || []);
      setBookedRides(bookedRes.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ride history from MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your persistent ride history..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black tracking-tight">
          Ride & Booking History
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Review all rides you have offered and all seats you have booked
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-border-subtle mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('offered')}
          className={`py-3 px-6 text-sm font-semibold tracking-tight transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'offered'
              ? 'border-brand-black text-brand-black'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Car className="w-4 h-4" />
          Tab 1: Rides Offered ({offeredRides.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('booked')}
          className={`py-3 px-6 text-sm font-semibold tracking-tight transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'booked'
              ? 'border-brand-black text-brand-black'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Tab 2: Rides Booked ({bookedRides.length})
        </button>
      </div>

      {/* TAB 1: RIDES OFFERED */}
      {activeTab === 'offered' && (
        <div>
          {offeredRides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {offeredRides.map((ride) => {
                const isPast = new Date(ride.departureDateTime) < new Date();
                const isFull = ride.availableSeats === 0 || ride.status === 'FULL';

                return (
                  <div
                    key={ride._id}
                    className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm hover:border-brand-black transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={isFull ? 'FULL' : ride.status} type="ride" />
                          {isPast && (
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                              Past Departure
                            </span>
                          )}
                        </div>
                        <span className="text-base font-bold text-brand-black">
                          {formatCurrency(ride.farePerSeat)}
                          <span className="text-xs font-normal text-text-secondary">/seat</span>
                        </span>
                      </div>

                      <p className="text-base font-bold text-brand-black">
                        {ride.from.city} &rarr; {ride.to.city}
                      </p>
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {ride.from.name} to {ride.to.name}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary py-3 border-t border-b border-neutral-100 my-3">
                        <div>
                          <span className="block text-[11px] text-text-secondary">Travel Date</span>
                          <span className="font-semibold text-text-primary">
                            {formatRideDate(ride.departureDateTime)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-text-secondary">Time</span>
                          <span className="font-semibold text-text-primary">
                            {formatRideTime(ride.departureDateTime)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-text-secondary">Seats Open</span>
                          <span className="font-semibold text-text-primary">
                            {ride.availableSeats} / {ride.totalSeats} seats
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-text-secondary">Requests</span>
                          <span className="font-semibold text-text-primary">
                            {ride.pendingRequestsCount || 0} pending
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Link to={`/rides/${ride._id}`}>
                        <Button size="sm" variant="ghost">
                          View Ride
                        </Button>
                      </Link>

                      <Link to={`/my-rides/${ride._id}/requests`}>
                        <Button size="sm" variant="outline">
                          Manage Requests
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-border-subtle rounded-xl p-12 text-center max-w-md mx-auto">
              <Car className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-brand-black mb-1">
                No rides offered yet
              </h3>
              <p className="text-xs text-text-secondary mb-5">
                Rides you publish will appear here with full history.
              </p>
              <Link to="/offer-ride">
                <Button variant="primary" size="sm">
                  Offer a Ride
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RIDES BOOKED */}
      {activeTab === 'booked' && (
        <div>
          {bookedRides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {bookedRides.map((booking) => {
                const ride = booking.rideId;
                const isPast = ride ? new Date(ride.departureDateTime) < new Date() : false;

                return (
                  <div
                    key={booking._id}
                    className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm hover:border-brand-black transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={booking.status} />
                          {isPast && (
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                              Past Trip
                            </span>
                          )}
                        </div>

                        {ride && (
                          <span className="text-base font-bold text-brand-black">
                            {formatCurrency(ride.farePerSeat * booking.seatsRequested)}
                            <span className="text-xs font-normal text-text-secondary"> total</span>
                          </span>
                        )}
                      </div>

                      {ride ? (
                        <>
                          <p className="text-base font-bold text-brand-black">
                            {ride.from?.city} &rarr; {ride.to?.city}
                          </p>
                          <p className="text-xs text-text-secondary truncate mt-0.5">
                            {ride.from?.name}
                          </p>

                          <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary py-3 border-t border-b border-neutral-100 my-3">
                            <div>
                              <span className="block text-[11px] text-text-secondary">
                                Travel Date
                              </span>
                              <span className="font-semibold text-text-primary">
                                {formatRideDate(ride.departureDateTime)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[11px] text-text-secondary">
                                Departure Time
                              </span>
                              <span className="font-semibold text-text-primary">
                                {formatRideTime(ride.departureDateTime)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[11px] text-text-secondary">
                                Seats Requested
                              </span>
                              <span className="font-semibold text-text-primary">
                                {booking.seatsRequested} {booking.seatsRequested === 1 ? 'seat' : 'seats'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[11px] text-text-secondary">Driver</span>
                              <span className="font-semibold text-text-primary">
                                {ride.driverId?.name || 'Driver'}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-xs text-neutral-500">
                          Associated ride information is no longer available.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-text-secondary">
                        Requested: {formatRideDate(booking.createdAt)}
                      </span>

                      {ride && (
                        <Link to={`/rides/${ride._id}`}>
                          <Button size="sm" variant="outline">
                            View Ride Details
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-border-subtle rounded-xl p-12 text-center max-w-md mx-auto">
              <CheckCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-brand-black mb-1">
                No bookings requested yet
              </h3>
              <p className="text-xs text-text-secondary mb-5">
                When you search rides and request seats, your booking status will appear here.
              </p>
              <Link to="/find-rides">
                <Button variant="primary" size="sm">
                  Find a Ride
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
