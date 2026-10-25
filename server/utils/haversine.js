/**
 * Haversine formula to compute great-circle distance between two points on Earth
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    return Infinity;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(p2 - p1);
  const dLon = toRad(l2 - l1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1)) * Math.cos(toRad(p2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

module.exports = {
  calculateHaversineDistance,
};
