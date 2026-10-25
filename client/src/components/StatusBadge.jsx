import React from 'react';

const StatusBadge = ({ status = 'PENDING', type = 'booking' }) => {
  const normalized = (status || '').toUpperCase();

  const styles = {
    // Booking statuses
    PENDING: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    ACCEPTED: 'bg-black text-white border-black font-semibold',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through',

    // Ride statuses
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    FULL: 'bg-neutral-900 text-white border-neutral-900',
    COMPLETED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  };

  const currentStyle = styles[normalized] || 'bg-neutral-100 text-neutral-600 border-neutral-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wider uppercase transition-colors ${currentStyle}`}
    >
      {normalized === 'ACTIVE' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
      )}
      {normalized}
    </span>
  );
};

export default StatusBadge;
