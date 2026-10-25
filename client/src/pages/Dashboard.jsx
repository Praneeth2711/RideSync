import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Car,
  Calendar,
  Clock,
  Inbox,
  CheckCircle,
  PlusCircle,
  Search,
  History as HistoryIcon,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { formatRideDate, formatRideTime, formatCurrency } from '../utils/formatDate';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setData(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your dashboard..." />
      </div>
    );
  }

  const stats = data?.stats || {
    ridesOffered: 0,
    upcomingBookings: 0,
    pendingRequests: 0,
    totalAcceptedBookings: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Here's what's happening with your rides.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white border border-border-subtle rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">
              Rides Offered
            </span>
            <Car className="w-4 h-4 text-brand-black" />
          </div>
          <div className="text-3xl font-extrabold text-brand-black">
            {stats.ridesOffered}
          </div>
          <p className="text-xs text-text-secondary mt-1">Created as driver</p>
        </div>

        <div className="bg-white border border-border-subtle rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">
              Upcoming Bookings
            </span>
            <Calendar className="w-4 h-4 text-brand-black" />
          </div>
          <div className="text-3xl font-extrabold text-brand-black">
            {stats.upcomingBookings}
          </div>
          <p className="text-xs text-text-secondary mt-1">Future passenger trips</p>
        </div>

        <div className="bg-white border border-border-subtle rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">
              Pending Requests
            </span>
            <Inbox className="w-4 h-4 text-brand-black" />
          </div>
          <div className="text-3xl font-extrabold text-brand-black">
            {stats.pendingRequests}
          </div>
          <p className="text-xs text-text-secondary mt-1">Awaiting your approval</p>
        </div>

        <div className="bg-white border border-border-subtle rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-text-secondary mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">
              Total Accepted
            </span>
            <CheckCircle className="w-4 h-4 text-brand-black" />
          </div>
          <div className="text-3xl font-extrabold text-brand-black">
            {stats.totalAcceptedBookings}
          </div>
          <p className="text-xs text-text-secondary mt-1">Confirmed rider seats</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-sm uppercase tracking-wider font-semibold text-text-secondary mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/find-rides"
            className="flex items-center gap-3 p-4 bg-white border border-border-subtle rounded-lg hover:border-brand-black transition-colors"
          >
            <Search className="w-5 h-5 text-brand-black" />
            <div className="text-left">
              <span className="block text-sm font-semibold text-brand-black">Find a Ride</span>
              <span className="text-xs text-text-secondary">Search open trips</span>
            </div>
          </Link>

          <Link
            to="/offer-ride"
            className="flex items-center gap-3 p-4 bg-white border border-border-subtle rounded-lg hover:border-brand-black transition-colors"
          >
            <PlusCircle className="w-5 h-5 text-brand-black" />
            <div className="text-left">
              <span className="block text-sm font-semibold text-brand-black">Offer a Ride</span>
              <span className="text-xs text-text-secondary">Publish new route</span>
            </div>
          </Link>

          <Link
            to="/my-rides"
            className="flex items-center gap-3 p-4 bg-white border border-border-subtle rounded-lg hover:border-brand-black transition-colors"
          >
            <Car className="w-5 h-5 text-brand-black" />
            <div className="text-left">
              <span className="block text-sm font-semibold text-brand-black">My Rides</span>
              <span className="text-xs text-text-secondary">Manage posted trips</span>
            </div>
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-3 p-4 bg-white border border-border-subtle rounded-lg hover:border-brand-black transition-colors"
          >
            <HistoryIcon className="w-5 h-5 text-brand-black" />
            <div className="text-left">
              <span className="block text-sm font-semibold text-brand-black">Ride History</span>
              <span className="text-xs text-text-secondary">Past & booked rides</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Rides Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Your Offered Upcoming Rides */}
        <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-brand-black">
              Your Upcoming Rides (Driver)
            </h3>
            <Link
              to="/my-rides"
              className="text-xs font-semibold text-brand-black hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data?.upcomingOfferedRides?.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingOfferedRides.map((ride) => (
                <div
                  key={ride._id}
                  className="p-3.5 border border-border-subtle rounded-lg hover:border-neutral-400 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-black">
                      {ride.from.city} &rarr; {ride.to.city}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                      <span>{formatRideDate(ride.departureDateTime)}</span>
                      <span>{formatRideTime(ride.departureDateTime)}</span>
                      <span>
                        {ride.availableSeats} of {ride.totalSeats} seats open
                      </span>
                    </div>
                  </div>

                  <Link to={`/my-rides/${ride._id}/requests`}>
                    <Button size="sm" variant="outline">
                      Requests
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-text-secondary">
              You haven't scheduled any upcoming rides as a driver.{' '}
              <Link to="/offer-ride" className="font-semibold text-brand-black underline ml-1">
                Offer a Ride
              </Link>
            </div>
          )}
        </div>

        {/* Right: Your Booked Upcoming Rides */}
        <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-brand-black">
              Your Bookings (Passenger)
            </h3>
            <Link
              to="/history"
              className="text-xs font-semibold text-brand-black hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data?.upcomingBookedRides?.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingBookedRides.map((item) => (
                <div
                  key={item.bookingId}
                  className="p-3.5 border border-border-subtle rounded-lg hover:border-neutral-400 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-black">
                        {item.ride?.from?.city} &rarr; {item.ride?.to?.city}
                      </p>
                      <StatusBadge status={item.bookingStatus} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                      <span>{formatRideDate(item.ride?.departureDateTime)}</span>
                      <span>{formatRideTime(item.ride?.departureDateTime)}</span>
                      <span>{item.seatsRequested} seat(s)</span>
                    </div>
                  </div>

                  <Link to={`/rides/${item.ride?._id}`}>
                    <Button size="sm" variant="ghost">
                      Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-text-secondary">
              No upcoming passenger bookings.{' '}
              <Link to="/find-rides" className="font-semibold text-brand-black underline ml-1">
                Find a Ride
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
