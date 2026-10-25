import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Compass, Users, ShieldCheck, ArrowRight, ArrowRightLeft } from 'lucide-react';
import LocationSearch from '../components/LocationSearch';
import Button from '../components/Button';

const Home = () => {
  const navigate = useNavigate();
  const [fromLoc, setFromLoc] = useState(null);
  const [toLoc, setToLoc] = useState(null);
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!fromLoc && !toLoc && !date) {
      setError('Please select at least a pickup location, destination, or travel date to search.');
      return;
    }
    setError('');

    const searchParams = new URLSearchParams();
    if (fromLoc?.city) searchParams.append('from', fromLoc.city);
    if (fromLoc?.latitude) searchParams.append('pickupLat', fromLoc.latitude);
    if (fromLoc?.longitude) searchParams.append('pickupLon', fromLoc.longitude);

    if (toLoc?.city) searchParams.append('to', toLoc.city);
    if (toLoc?.latitude) searchParams.append('destLat', toLoc.latitude);
    if (toLoc?.longitude) searchParams.append('destLon', toLoc.longitude);

    if (date) searchParams.append('date', date);

    navigate(`/find-rides?${searchParams.toString()}`);
  };

  const handleSwap = () => {
    const temp = fromLoc;
    setFromLoc(toLoc);
    setToLoc(temp);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="pt-20 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-surface text-xs font-medium text-neutral-800 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Minimalist Carpool & Ride Sharing Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-brand-black tracking-tight leading-[1.1] mb-6">
          Going Somewhere? <br className="hidden sm:inline" />
          <span className="underline decoration-1 underline-offset-8 decoration-neutral-300">
            Go Together.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
          Find rides, share journeys, and split travel costs with people heading your way. Real-time seat updates and atomic overbooking protection.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link to="/find-rides">
            <Button size="lg" variant="primary" className="shadow">
              Find a Ride
              <Search className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/offer-ride">
            <Button size="lg" variant="secondary">
              Offer a Ride
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Search Component Card */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm max-w-4xl mx-auto text-left">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            <div className="md:col-span-4">
              <LocationSearch
                label="From"
                placeholder="Pickup city or address..."
                value={fromLoc}
                onChange={setFromLoc}
                id="home-from-search"
              />
            </div>

            <div className="hidden md:flex md:col-span-1 justify-center pb-2">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="Swap locations"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="md:col-span-4">
              <LocationSearch
                label="To"
                placeholder="Destination city or address..."
                value={toLoc}
                onChange={setToLoc}
                id="home-to-search"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="home-date"
                className="block text-xs font-medium text-text-primary uppercase tracking-wider mb-1.5"
              >
                Date
              </label>
              <input
                id="home-date"
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-black"
              />
            </div>

            <div className="md:col-span-12 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {error ? (
                <span className="text-xs text-red-600 font-medium">{error}</span>
              ) : (
                <span className="text-xs text-text-secondary">
                  Powered by Geoapify Indian Autocomplete and Haversine proximity matching
                </span>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Search Rides
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-surface border-t border-border-subtle mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-black mb-3">
              How RideSync Works
            </h2>
            <p className="text-sm text-text-secondary">
              A transparent, rule-governed workflow built for academic rigor and zero ambiguity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-sm flex flex-col items-start">
              <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-black font-semibold mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-brand-black mb-2">Find your route</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Search verified Indian routes via Geoapify. Filter by travel date, pickup proximity, and seat availability directly from MongoDB.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-sm flex flex-col items-start">
              <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-black font-semibold mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-brand-black mb-2">Request your seat</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Select between 1 to 6 seats. Your request is queued as PENDING in MongoDB. Available seats remain untouched until the driver reviews.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-sm flex flex-col items-start">
              <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-brand-black font-semibold mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-brand-black mb-2">Travel together</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Drivers accept or reject requests with atomic overbooking checks. Once full, new bookings are safely blocked at database level.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
