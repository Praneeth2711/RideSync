const { calculateHaversineDistance } = require('../utils/haversine');

/**
 * Score and rank rides based on pickup/destination proximity and time alignment
 * @param {Array} rides Array of Ride documents (plain JS objects or mongoose documents)
 * @param {Object} queryParams { pickupLat, pickupLon, destLat, destLon, preferredTime }
 * @returns {Array} Rides augmented with matchScore, pickupDistanceKm, destDistanceKm, isBestMatch
 */
function rankRidesWithSmartMatching(rides, queryParams = {}) {
  const { pickupLat, pickupLon, destLat, destLon, preferredTime } = queryParams;

  // If user did not provide coordinates, return rides as-is
  if (
    pickupLat === undefined ||
    pickupLon === undefined ||
    destLat === undefined ||
    destLon === undefined
  ) {
    return rides.map((r) => (r.toObject ? r.toObject() : { ...r }));
  }

  const pLat = parseFloat(pickupLat);
  const pLon = parseFloat(pickupLon);
  const dLat = parseFloat(destLat);
  const dLon = parseFloat(destLon);

  const MAX_RADIUS_KM = 50; // Proximity threshold for scoring

  const scoredRides = rides.map((doc) => {
    const ride = doc.toObject ? doc.toObject() : { ...doc };

    // 1. Calculate pickup distance in km
    const pickupDistKm = calculateHaversineDistance(
      pLat,
      pLon,
      ride.from.latitude,
      ride.from.longitude
    );

    // 2. Calculate destination distance in km
    const destDistKm = calculateHaversineDistance(
      dLat,
      dLon,
      ride.to.latitude,
      ride.to.longitude
    );

    // Compute proximity scores from 0 to 100 (100 = 0 km apart, 0 = >= 50km apart)
    const pickupScore = Math.max(0, 100 * (1 - pickupDistKm / MAX_RADIUS_KM));
    const destScore = Math.max(0, 100 * (1 - destDistKm / MAX_RADIUS_KM));

    let finalScore = 0;

    if (preferredTime) {
      // 40% Pickup, 40% Destination, 20% Time
      const rideDate = new Date(ride.departureDateTime);
      const [prefHours, prefMinutes] = preferredTime.split(':').map(Number);
      const prefDate = new Date(ride.departureDateTime);
      prefDate.setHours(prefHours || 0, prefMinutes || 0, 0, 0);

      const diffHours = Math.abs(rideDate.getTime() - prefDate.getTime()) / (1000 * 60 * 60);
      // Within 0 hours = 100, > 12 hours difference = 0
      const timeScore = Math.max(0, 100 * (1 - diffHours / 12));

      finalScore = 0.4 * pickupScore + 0.4 * destScore + 0.2 * timeScore;
    } else {
      // 50% Pickup, 50% Destination
      finalScore = 0.5 * pickupScore + 0.5 * destScore;
    }

    finalScore = Math.round(finalScore);

    return {
      ...ride,
      matchScore: finalScore,
      pickupDistanceKm: pickupDistKm,
      destDistanceKm: destDistKm,
    };
  });

  // Sort descending by match score
  scoredRides.sort((a, b) => b.matchScore - a.matchScore);

  // If top ride has a good score (>= 40), mark it as best match
  if (scoredRides.length > 0 && scoredRides[0].matchScore >= 40) {
    scoredRides[0].isBestMatch = true;
  }

  return scoredRides;
}

module.exports = {
  rankRidesWithSmartMatching,
};
