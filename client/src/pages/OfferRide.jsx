import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rideService } from '../services/rideService';
import LocationSearch from '../components/LocationSearch';
import RideMap from '../components/RideMap';
import Input from '../components/Input';
import Button from '../components/Button';
import { Car, PlusCircle, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const OfferRide = () => {
  const navigate = useNavigate();

  const [fromLoc, setFromLoc] = useState(null);
  const [toLoc, setToLoc] = useState(null);
  const [date, setDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('4');
  const [farePerSeat, setFarePerSeat] = useState('150');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!fromLoc || !fromLoc.latitude || !fromLoc.longitude) {
      errs.from = 'Please select a verified pickup location from the suggestions.';
    }
    if (!toLoc || !toLoc.latitude || !toLoc.longitude) {
      errs.to = 'Please select a verified destination location from the suggestions.';
    }
    if (!date) {
      errs.date = 'Travel date is required.';
    }
    if (!departureTime) {
      errs.departureTime = 'Departure time is required.';
    }

    if (date && departureTime) {
      const selected = new Date(`${date}T${departureTime}:00`);
      if (selected <= new Date()) {
        errs.departureTime = 'Departure date and time must be in the future.';
      }
    }

    const seats = parseInt(availableSeats, 10);
    if (isNaN(seats) || seats < 1 || seats > 6) {
      errs.availableSeats = 'Seats must be between 1 and 6.';
    }

    const fare = parseFloat(farePerSeat);
    if (isNaN(fare) || fare < 0) {
      errs.farePerSeat = 'Fare per seat cannot be negative.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setGeneralError('');
    setSuccessMsg('');

    try {
      const res = await rideService.createRide({
        from: fromLoc,
        to: toLoc,
        date,
        departureTime,
        availableSeats: parseInt(availableSeats, 10),
        farePerSeat: parseFloat(farePerSeat),
        notes,
      });

      setSuccessMsg('Ride published successfully! Redirecting to My Rides...');
      setTimeout(() => {
        navigate('/my-rides');
      }, 1500);
    } catch (err) {
      setGeneralError(
        err.response?.data?.message || 'Failed to publish ride to MongoDB.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black tracking-tight">
          Offer a Ride
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Publish your empty seats, share travel expenses, and reduce road congestion
        </p>
      </div>

      {generalError && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-md bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-border-subtle rounded-xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Route */}
          <div>
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-neutral-100 pb-2">
              1. Route Details (Geoapify Verified)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LocationSearch
                label="Pickup Location"
                placeholder="e.g. Vijayawada, Andhra Pradesh"
                value={fromLoc}
                onChange={(loc) => {
                  setFromLoc(loc);
                  if (errors.from) setErrors({ ...errors, from: '' });
                }}
                error={errors.from}
                required
                id="offer-from"
              />

              <LocationSearch
                label="Destination Location"
                placeholder="e.g. Guntur, Andhra Pradesh"
                value={toLoc}
                onChange={(loc) => {
                  setToLoc(loc);
                  if (errors.to) setErrors({ ...errors, to: '' });
                }}
                error={errors.to}
                required
                id="offer-to"
              />
            </div>
          </div>

          {/* Route Map Preview */}
          {fromLoc && toLoc && fromLoc.latitude && toLoc.latitude && (
            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary font-medium mb-2">
                Route Map Preview
              </p>
              <RideMap from={fromLoc} to={toLoc} height="260px" />
            </div>
          )}

          {/* Section: Schedule */}
          <div>
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-neutral-100 pb-2">
              2. Schedule & Departure
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="offer-date"
                  className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
                >
                  Travel Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="offer-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors({ ...errors, date: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black ${
                    errors.date ? 'border-red-500' : 'border-border-subtle focus:border-brand-black'
                  }`}
                  required
                />
                {errors.date && (
                  <span className="text-xs text-red-600 mt-1 block">{errors.date}</span>
                )}
              </div>

              <div>
                <label
                  htmlFor="offer-time"
                  className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
                >
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="offer-time"
                  type="time"
                  value={departureTime}
                  onChange={(e) => {
                    setDepartureTime(e.target.value);
                    if (errors.departureTime) setErrors({ ...errors, departureTime: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black ${
                    errors.departureTime
                      ? 'border-red-500'
                      : 'border-border-subtle focus:border-brand-black'
                  }`}
                  required
                />
                {errors.departureTime && (
                  <span className="text-xs text-red-600 mt-1 block">{errors.departureTime}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Seats and Pricing */}
          <div>
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-neutral-100 pb-2">
              3. Seats & Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="offer-seats"
                  className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
                >
                  Available Seats (1 - 6) <span className="text-red-500">*</span>
                </label>
                <select
                  id="offer-seats"
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'seat' : 'seats'}
                    </option>
                  ))}
                </select>
                {errors.availableSeats && (
                  <span className="text-xs text-red-600 mt-1 block">
                    {errors.availableSeats}
                  </span>
                )}
              </div>

              <div>
                <Input
                  label="Fare Per Seat (in ₹)"
                  name="farePerSeat"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="e.g. 150"
                  value={farePerSeat}
                  onChange={(e) => {
                    setFarePerSeat(e.target.value);
                    if (errors.farePerSeat) setErrors({ ...errors, farePerSeat: '' });
                  }}
                  error={errors.farePerSeat}
                  required
                  id="offer-fare"
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div>
            <label
              htmlFor="offer-notes"
              className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
            >
              Ride Notes (Optional)
            </label>
            <textarea
              id="offer-notes"
              rows="3"
              maxLength={500}
              placeholder="e.g. Air-conditioned car, no smoking, luggage capacity for 2 small bags."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black placeholder:text-neutral-400"
            />
            <span className="text-[11px] text-text-secondary">
              {notes.length} / 500 characters
            </span>
          </div>

          <div className="pt-4 border-t border-border-subtle flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full sm:w-auto"
            >
              Publish Ride
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferRide;
