import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Users,
} from 'lucide-react';
import { formatRideDate, formatRideTime, formatFullDateTime } from '../utils/formatDate';

const ManageRequests = () => {
  const { id } = useParams();

  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingService.getRideRequests(id);
      setRide(res.data?.ride);
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [id]);

  const handleAccept = async (bookingId) => {
    setActionLoadingId(bookingId);
    setError('');
    setSuccessMsg('');

    try {
      const res = await bookingService.acceptRequest(bookingId);
      setSuccessMsg(
        `Booking accepted! Available seats updated to ${res.data?.ride?.availableSeats}.`
      );

      // Update state in place
      setRide(res.data?.ride);
      setRequests((prev) =>
        prev.map((req) =>
          req._id === bookingId ? { ...req, status: 'ACCEPTED' } : req
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to accept booking request.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    setActionLoadingId(bookingId);
    setError('');
    setSuccessMsg('');

    try {
      const res = await bookingService.rejectRequest(bookingId);
      setSuccessMsg('Booking request rejected. Available seats remain unchanged.');

      setRequests((prev) =>
        prev.map((req) =>
          req._id === bookingId ? { ...req, status: 'REJECTED' } : req
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to reject booking request.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading booking requests for this ride..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link
          to="/my-rides"
          className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-brand-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to My Rides
        </Link>
      </div>

      {/* Ride Summary Banner */}
      {ride && (
        <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Managing Requests for Ride
              </span>
              <h1 className="text-2xl font-extrabold text-brand-black tracking-tight mt-0.5">
                {ride.from.city} &rarr; {ride.to.city}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                {formatRideDate(ride.departureDateTime)} at {formatRideTime(ride.departureDateTime)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-lg bg-surface border border-neutral-200 text-right">
                <span className="text-[11px] uppercase tracking-wider text-text-secondary block font-semibold">
                  Available Seats
                </span>
                <span className="text-lg font-extrabold text-brand-black">
                  {ride.availableSeats}{' '}
                  <span className="text-xs font-normal text-text-secondary">
                    / {ride.totalSeats}
                  </span>
                </span>
              </div>
              <StatusBadge status={ride.availableSeats === 0 ? 'FULL' : ride.status} type="ride" />
            </div>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-md bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Requests Table / Cards */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-black">
            Passenger Requests ({requests.length})
          </h2>
          <span className="text-xs text-text-secondary">
            Accepting decrements available seats atomically
          </span>
        </div>

        {requests.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {requests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isActionLoading = actionLoadingId === req._id;
              const hasEnoughSeats = ride.availableSeats >= req.seatsRequested;

              return (
                <div
                  key={req._id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                >
                  {/* Left: Passenger info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs">
                        {req.riderId?.name?.charAt(0)?.toUpperCase() || 'R'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-black leading-tight">
                          {req.riderId?.name || 'Rider'}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {req.riderId?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-2">
                      <span className="flex items-center gap-1 font-semibold text-brand-black">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        {req.seatsRequested} {req.seatsRequested === 1 ? 'seat requested' : 'seats requested'}
                      </span>
                      <span>Requested on: {formatFullDateTime(req.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <StatusBadge status={req.status} />

                    {isPending && (
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          id={`accept-btn-${req._id}`}
                          size="sm"
                          variant="primary"
                          onClick={() => handleAccept(req._id)}
                          loading={isActionLoading}
                          disabled={!hasEnoughSeats || isActionLoading}
                          title={
                            !hasEnoughSeats
                              ? 'Not enough seats available to accept this booking'
                              : 'Accept request and atomically reduce seats'
                          }
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Accept
                        </Button>

                        <Button
                          id={`reject-btn-${req._id}`}
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReject(req._id)}
                          loading={isActionLoading}
                          disabled={isActionLoading}
                          className="text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center text-xs text-text-secondary">
            No booking requests received for this ride yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRequests;
