import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { rideService } from '../services/rideService';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Car,
  Calendar,
  Clock,
  Inbox,
  ArrowRight,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { formatRideDate, formatRideTime, formatCurrency } from '../utils/formatDate';

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyRides = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await rideService.getMyRides();
      setRides(res.data?.rides || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your rides.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRides();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading rides you have offered..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-black tracking-tight">
            My Offered Rides
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Review trips you are driving and manage passenger seat requests
          </p>
        </div>

        <Link to="/offer-ride">
          <Button variant="primary">
            <PlusCircle className="w-4 h-4 mr-2" />
            Offer New Ride
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {rides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => {
            const isFull = ride.availableSeats === 0 || ride.status === 'FULL';
            const pendingCount = ride.pendingRequestsCount || 0;

            return (
              <div
                key={ride._id}
                className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm hover:border-brand-black transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top status line */}
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={isFull ? 'FULL' : ride.status} type="ride" />
                    <span className="text-base font-bold text-brand-black">
                      {formatCurrency(ride.farePerSeat)}
                      <span className="text-xs font-normal text-text-secondary">/seat</span>
                    </span>
                  </div>

                  {/* Route */}
                  <div className="mb-4">
                    <p className="text-base font-bold text-brand-black leading-tight">
                      {ride.from.city} &rarr; {ride.to.city}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-1">
                      From: {ride.from.name}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      To: {ride.to.name}
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-b border-neutral-100 py-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-primary" />
                        {formatRideDate(ride.departureDateTime)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-primary" />
                        {formatRideTime(ride.departureDateTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>Available Seats:</span>
                      <strong className="text-brand-black">
                        {ride.availableSeats} of {ride.totalSeats} open
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Requests Button */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Inbox className="w-4 h-4 text-brand-black" />
                    <span
                      className={`font-semibold ${
                        pendingCount > 0 ? 'text-amber-700' : 'text-text-secondary'
                      }`}
                    >
                      {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
                    </span>
                  </div>

                  <Link to={`/my-rides/${ride._id}/requests`}>
                    <Button size="sm" variant={pendingCount > 0 ? 'primary' : 'outline'}>
                      View Requests
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-border-subtle rounded-xl p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-4 text-neutral-500">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-brand-black mb-1">
            No rides offered yet
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            You haven't posted any rides. Offer a ride to start sharing trips.
          </p>
          <Link to="/offer-ride">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Offer Your First Ride
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRides;
