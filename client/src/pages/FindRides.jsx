import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { rideService } from '../services/rideService';
import LocationSearch from '../components/LocationSearch';
import RideCard from '../components/RideCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Search, Filter, RotateCcw, ArrowRightLeft } from 'lucide-react';

const FindRides = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [fromLoc, setFromLoc] = useState(null);
  const [toLoc, setToLoc] = useState(null);
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [seats, setSeats] = useState(searchParams.get('seats') || '1');

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Initialize search from URL params if present
  useEffect(() => {
    const fromCity = searchParams.get('from');
    const toCity = searchParams.get('to');
    const dateParam = searchParams.get('date');
    const pLat = searchParams.get('pickupLat');
    const pLon = searchParams.get('pickupLon');
    const dLat = searchParams.get('destLat');
    const dLon = searchParams.get('destLon');

    if (fromCity) {
      setFromLoc({
        name: fromCity,
        city: fromCity,
        latitude: pLat ? parseFloat(pLat) : undefined,
        longitude: pLon ? parseFloat(pLon) : undefined,
      });
    }

    if (toCity) {
      setToLoc({
        name: toCity,
        city: toCity,
        latitude: dLat ? parseFloat(dLat) : undefined,
        longitude: dLon ? parseFloat(dLon) : undefined,
      });
    }

    if (dateParam) setDate(dateParam);

    fetchRides({
      from: fromCity || undefined,
      to: toCity || undefined,
      date: dateParam || undefined,
      seats: searchParams.get('seats') || undefined,
      pickupLat: pLat || undefined,
      pickupLon: pLon || undefined,
      destLat: dLat || undefined,
      destLon: dLon || undefined,
    });
  }, []);

  const fetchRides = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const res = await rideService.searchRides(params);
      setRides(res.data?.rides || []);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search rides from database');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = {};
    const newParams = new URLSearchParams();

    if (fromLoc?.city || fromLoc?.name) {
      const city = fromLoc.city || fromLoc.name.split(',')[0];
      query.from = city;
      newParams.set('from', city);
    }
    if (fromLoc?.latitude && fromLoc?.longitude) {
      query.pickupLat = fromLoc.latitude;
      query.pickupLon = fromLoc.longitude;
      newParams.set('pickupLat', fromLoc.latitude);
      newParams.set('pickupLon', fromLoc.longitude);
    }

    if (toLoc?.city || toLoc?.name) {
      const city = toLoc.city || toLoc.name.split(',')[0];
      query.to = city;
      newParams.set('to', city);
    }
    if (toLoc?.latitude && toLoc?.longitude) {
      query.destLat = toLoc.latitude;
      query.destLon = toLoc.longitude;
      newParams.set('destLat', toLoc.latitude);
      newParams.set('destLon', toLoc.longitude);
    }

    if (date) {
      query.date = date;
      newParams.set('date', date);
    }
    if (seats && parseInt(seats, 10) > 1) {
      query.seats = seats;
      newParams.set('seats', seats);
    }

    setSearchParams(newParams);
    fetchRides(query);
  };

  const handleClear = () => {
    setFromLoc(null);
    setToLoc(null);
    setDate('');
    setSeats('1');
    setSearchParams({});
    fetchRides({});
  };

  const handleSwap = () => {
    const temp = fromLoc;
    setFromLoc(toLoc);
    setToLoc(temp);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black tracking-tight">
          Find Available Rides
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Search real-time rides from MongoDB with verified Geoapify Indian routes
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm mb-10">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-4">
            <LocationSearch
              label="From"
              placeholder="Pickup city or area..."
              value={fromLoc}
              onChange={setFromLoc}
              id="find-from"
            />
          </div>

          <div className="hidden md:flex md:col-span-1 justify-center pb-2">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Swap"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="md:col-span-3">
            <LocationSearch
              label="To"
              placeholder="Destination city or area..."
              value={toLoc}
              onChange={setToLoc}
              id="find-to"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="find-date"
              className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
            >
              Travel Date
            </label>
            <input
              id="find-date"
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="find-seats"
              className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
            >
              Seats Needed
            </label>
            <select
              id="find-seats"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Seat' : 'Seats'}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12 pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-text-secondary hover:text-brand-black"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>

            <Button type="submit" variant="primary" size="md">
              <Search className="w-4 h-4 mr-2" />
              Search Rides
            </Button>
          </div>
        </form>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-brand-black">
          {loading
            ? 'Searching available rides...'
            : `${rides.length} ${rides.length === 1 ? 'ride' : 'rides'} found`}
        </h2>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <LoadingSpinner size="lg" message="Querying active rides from MongoDB..." />
        </div>
      ) : rides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rides.map((ride) => (
            <RideCard key={ride._id} ride={ride} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-border-subtle rounded-xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-4 text-neutral-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-brand-black mb-1">
            No rides found for this route.
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Try another date or nearby location.
          </p>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default FindRides;
