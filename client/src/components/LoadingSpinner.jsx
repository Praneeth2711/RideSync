import React from 'react';

const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div
        className={`${sizes[size] || sizes.md} border-neutral-300 border-t-brand-black rounded-full animate-spin`}
      />
      {message && <p className="text-xs text-text-secondary tracking-wide">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
