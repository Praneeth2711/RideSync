import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import RideMap from '../components/RideMap';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Info,
} from 'lucide-react';
import { formatRideDate, formatRideTime, formatCurrency } from '../utils/formatDate';

const RideDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [myBooking, setMyBooking] = useState(null);
  const [seatsToRequest, setSeatsToRequest] = useState(1);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await rideService.getRideById(id);
      setRide(res.data?.ride);
      setIsOwner(res.data?.isOwner);
      setMyBooking(res.data?.myBooking);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load ride details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const handleRequestSeats = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/rides/${id}` } } });
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await bookingService.requestSeats(id, seatsToRequest);
      setSuccessMsg(
        res.message || 'Your seat request has been sent to the driver with status: PENDING.'
      );
      setMyBooking(res.data?.booking);
      // Re-fetch to ensure sync with MongoDB
      fetchRideDetails();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit seat request to MongoDB.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading ride details and route..." />
      </div>
    );
  }

  if (error && !ride) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
        <Link to="/find-rides">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Find Rides
          </Button>
        </Link>
      </div>
    );
  }

  const isFull = ride.availableSeats === 0 || ride.status === 'FULL';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link
          to="/find-rides"
          className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-brand-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to All Rides
        </Link>
      </div>

      {/* Main Grid: Left Route & Details, Right Map & Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ride Information */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-border-subtle rounded-xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Ride Details
                </span>
                <h1 className="text-2xl font-extrabold text-brand-black tracking-tight mt-0.5">
                  {ride.from.city} &rarr; {ride.to.city}
                </h1>
              </div>
              <StatusBadge status={isFull ? 'FULL' : ride.status} type="ride" />
            </div>

            {/* Route Points */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-3 h-3 rounded-full border-2 border-brand-black bg-white flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase font-medium text-text-secondary">
                    Pickup Location
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {ride.from.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    City: {ride.from.city} {ride.from.state ? `(${ride.from.state})` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 w-3 h-3 rounded-full bg-brand-black flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase font-medium text-text-secondary">
                    Destination Location
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {ride.to.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    City: {ride.to.city} {ride.to.state ? `(${ride.to.state})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-neutral-100 text-xs">
              <div>
                <span className="text-text-secondary block">Travel Date</span>
                <span className="font-semibold text-brand-black">
                  {formatRideDate(ride.departureDateTime)}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Departure Time</span>
                <span className="font-semibold text-brand-black">
                  {formatRideTime(ride.departureDateTime)}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Available Seats</span>
                <span className="font-semibold text-brand-black">
                  {ride.availableSeats} of {ride.totalSeats} seats
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Fare / Seat</span>
                <span className="font-semibold text-brand-black text-sm">
                  {formatCurrency(ride.farePerSeat)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {ride.notes && (
              <div className="mt-5 p-3.5 bg-surface border border-neutral-200 rounded-md text-xs text-text-primary">
                <span className="font-semibold block mb-1 text-brand-black">Driver Notes:</span>
                <p className="text-text-secondary leading-relaxed">{ride.notes}</p>
              </div>
            )}

            {/* Driver Profile */}
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-sm">
                  {ride.driverId?.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-black">
                    {ride.driverId?.name || 'Driver'}
                  </p>
                  <p className="text-xs text-text-secondary">Verified Ride Host</p>
                </div>
              </div>

              {isOwner && (
                <span className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-semibold text-brand-black">
                  You are the Driver
                </span>
              )}
            </div>
          </div>

          {/* Interactive Route Map */}
          <div>
            <h2 className="text-xs uppercase tracking-wider font-bold text-text-primary mb-2">
              Driving Route Map (Leaflet & Geoapify)
            </h2>
            <RideMap from={ride.from} to={ride.to} height="360px" />
          </div>
        </div>

        {/* Right Column: Seat Booking Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-border-subtle rounded-xl p-6 sm:p-7 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-brand-black mb-1">
              Request Your Seats
            </h3>
            <p className="text-xs text-text-secondary mb-5">
              Fare is payable in person upon trip completion.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* State 1: Current user is the driver */}
            {isOwner ? (
              <div className="p-4 bg-surface border border-neutral-200 rounded-lg text-center space-y-3">
                <p className="text-xs text-text-secondary">
                  You posted this ride. You can view passenger booking requests and manage acceptances.
                </p>
                <Link to={`/my-rides/${ride._id}/requests`}>
                  <Button variant="primary" size="sm" className="w-full">
                    Manage Ride Requests
                  </Button>
                </Link>
              </div>
            ) : myBooking ? (
              /* State 2: Current user already has an active booking record */
              <div className="p-5 bg-surface border border-neutral-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary uppercase">
                    Your Booking Status
                  </span>
                  <StatusBadge status={myBooking.status} />
                </div>
                <div className="text-xs text-text-secondary">
                  Seats Requested:{' '}
                  <strong className="text-text-primary">
                    {myBooking.seatsRequested} {myBooking.seatsRequested === 1 ? 'seat' : 'seats'}
                  </strong>
                </div>
                <div className="text-xs text-text-secondary">
                  Estimated Total Fare:{' '}
                  <strong className="text-text-primary">
                    {formatCurrency(myBooking.seatsRequested * ride.farePerSeat)}
                  </strong>
                </div>

                {myBooking.status === 'PENDING' && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                    Your request is waiting for the driver's review. Driver's available seats remain unchanged until accepted.
                  </p>
                )}

                {myBooking.status === 'ACCEPTED' && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                    Your booking was accepted by the driver! Seats are confirmed.
                  </p>
                )}

                {myBooking.status === 'REJECTED' && (
                  <p className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
                    The driver could not accommodate this booking request.
                  </p>
                )}

                <Link to="/history" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View in Ride History
                  </Button>
                </Link>
              </div>
            ) : isFull ? (
              /* State 3: Ride is Full */
              <div className="p-5 bg-neutral-100 border border-neutral-200 rounded-lg text-center space-y-2">
                <p className="text-sm font-bold text-neutral-800">Ride is Full</p>
                <p className="text-xs text-text-secondary">
                  All {ride.totalSeats} seats have been accepted. New bookings are blocked.
                </p>
                <Link to="/find-rides" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Search Other Rides
                  </Button>
                </Link>
              </div>
            ) : (
              /* State 4: Can request seats */
              <form onSubmit={handleRequestSeats} className="space-y-4">
                <div>
                  <label
                    htmlFor="request-seats"
                    className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
                  >
                    Select Number of Seats
                  </label>
                  <select
                    id="request-seats"
                    value={seatsToRequest}
                    onChange={(e) => setSeatsToRequest(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black"
                  >
                    {Array.from({ length: ride.availableSeats }, (_, i) => i + 1).map(
                      (num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Seat' : 'Seats'}
                        </option>
                      )
                    )}
                  </select>
                  <span className="text-[11px] text-text-secondary mt-1 block">
                    Maximum {ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'} currently available
                  </span>
                </div>

                {/* Fare Summary */}
                <div className="p-3.5 bg-surface border border-neutral-200 rounded-md text-xs space-y-1.5">
                  <div className="flex justify-between text-text-secondary">
                    <span>Fare per seat:</span>
                    <span>{formatCurrency(ride.farePerSeat)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Seats selected:</span>
                    <span>x {seatsToRequest}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-1.5 flex justify-between font-bold text-brand-black text-sm">
                    <span>Total Fare:</span>
                    <span>{formatCurrency(seatsToRequest * ride.farePerSeat)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  className="w-full"
                >
                  Request {seatsToRequest} {seatsToRequest === 1 ? 'Seat' : 'Seats'}
                </Button>

                <div className="flex items-start gap-2 text-[11px] text-text-secondary pt-2">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400 mt-0.5" />
                  <span>
                    Your booking initially receives <strong>PENDING</strong> status. Seats decrease only once accepted by driver.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetails;
