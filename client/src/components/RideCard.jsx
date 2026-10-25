import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight, Sparkles } from 'lucide-react';
import { formatRideDate, formatRideTime, formatCurrency } from '../utils/formatDate';
import StatusBadge from './StatusBadge';
import Button from './Button';

const RideCard = ({ ride }) => {
  const isFull = ride.availableSeats === 0 || ride.status === 'FULL';

  return (
    <div className="group relative bg-white border border-border-subtle hover:border-brand-black transition-all duration-200 rounded-lg p-5 shadow-sm hover:shadow flex flex-col justify-between">
      {/* Top row: Best Match badge + Status Badge */}
      <div className="flex items-center justify-between mb-3.5 gap-2">
        <div className="flex items-center gap-2">
          {ride.isBestMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-black text-white tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              Best Match {ride.matchScore ? `(${ride.matchScore}%)` : ''}
            </span>
          )}
          <StatusBadge status={isFull ? 'FULL' : ride.status} type="ride" />
        </div>

        <div className="text-right">
          <span className="text-xl font-bold tracking-tight text-text-primary">
            {formatCurrency(ride.farePerSeat)}
          </span>
          <span className="text-xs text-text-secondary block">per seat</span>
        </div>
      </div>

      {/* Route Display */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col items-center mt-1">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-black bg-white" />
            <div className="w-0.5 h-6 bg-neutral-200 my-0.5" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-black" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                Pickup
              </p>
              <p className="text-sm font-semibold text-text-primary leading-tight">
                {ride.from.city}
              </p>
              <p className="text-xs text-text-secondary truncate max-w-xs sm:max-w-md">
                {ride.from.name}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                Destination
              </p>
              <p className="text-sm font-semibold text-text-primary leading-tight">
                {ride.to.city}
              </p>
              <p className="text-xs text-text-secondary truncate max-w-xs sm:max-w-md">
                {ride.to.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata divider */}
      <div className="border-t border-border-subtle pt-3.5 mt-auto flex flex-wrap items-center justify-between text-xs text-text-secondary gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-text-primary" />
            {formatRideDate(ride.departureDateTime)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-primary" />
            {formatRideTime(ride.departureDateTime)}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-text-primary" />
            {ride.driverId?.name || 'Driver'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0">
          <span className="font-medium text-text-primary">
            {isFull ? (
              <span className="text-neutral-500 font-normal">No seats left</span>
            ) : (
              <span>
                <strong>{ride.availableSeats}</strong> of {ride.totalSeats} seats open
              </span>
            )}
          </span>

          <Link to={`/rides/${ride._id}`}>
            <Button size="sm" variant={isFull ? 'secondary' : 'primary'}>
              View Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
