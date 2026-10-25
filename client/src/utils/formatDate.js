/**
 * Format date for display in IST / Indian format
 */
export function formatRideDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format departure time (e.g. 09:00 AM)
 */
export function formatRideTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format full date & time
 */
export function formatFullDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return `${formatRideDate(dateString)} at ${formatRideTime(dateString)}`;
}

/**
 * Format Indian currency (₹)
 */
export function formatCurrency(amount) {
  return `₹${Math.round(amount || 0)}`;
}
