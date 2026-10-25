const axios = require('axios');

// In-memory cache for autocomplete and route queries to reduce external API consumption
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

function getFromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setInCache(key, data) {
  // Prune cache if it exceeds 500 items
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Fetch autocomplete suggestions for an Indian address/city query
 * @param {string} text Query string (min 3 chars)
 * @returns {Promise<Array>} List of formatted location objects
 */
async function getAutocompleteSuggestions(text) {
  const trimmed = (text || '').trim();
  if (trimmed.length < 3) {
    return [];
  }

  const cacheKey = `autocomplete:${trimmed.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey === 'your_private_geoapify_api_key') {
    console.warn('[Geoapify] Missing or placeholder GEOAPIFY_API_KEY in server/.env');
    throw new Error('Geoapify API key is not configured on the server. Please add your GEOAPIFY_API_KEY in server/.env.');
  }

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params: {
        text: trimmed,
        apiKey: apiKey,
        filter: 'countrycode:in',
        format: 'json',
      },
      timeout: 8000,
    });

    const results = response.data?.results || [];
    const formatted = results.map((item) => {
      // Determine city/locality
      const city = item.city || item.county || item.suburb || item.state_district || item.name || '';
      const state = item.state || '';
      const formattedAddress = item.formatted || `${city}${state ? ', ' + state : ''}, India`;

      return {
        name: formattedAddress,
        city: city || trimmed,
        state: state,
        latitude: item.lat,
        longitude: item.lon,
        placeId: item.place_id || `${item.lat}_${item.lon}`,
      };
    });

    setInCache(cacheKey, formatted);
    return formatted;
  } catch (err) {
    const rawMessage = err.response?.data?.message || err.message || 'Geoapify request failed';
    const safeMessage = rawMessage.replace(/apiKey=[a-zA-Z0-9_-]+/gi, 'apiKey=***');
    console.error(`[Geoapify Autocomplete Error] ${safeMessage}`);
    throw new Error(safeMessage);
  }
}

/**
 * Fetch driving route geometry, distance, and duration between two waypoints
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {Promise<Object>} { distanceKm, durationMinutes, coordinates: [[lat, lon], ...] }
 */
async function getDrivingRoute(lat1, lon1, lat2, lon2) {
  const cacheKey = `route:${lat1},${lon1}|${lat2},${lon2}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey === 'your_private_geoapify_api_key') {
    throw new Error('Geoapify API key is not configured on the server. Please set GEOAPIFY_API_KEY in server/.env.');
  }

  try {
    const waypoints = `${lat1},${lon1}|${lat2},${lon2}`;
    const response = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: waypoints,
        mode: 'drive',
        apiKey: apiKey,
      },
      timeout: 10000,
    });

    const feature = response.data?.features?.[0];
    if (!feature) {
      throw new Error('No driving route found between selected waypoints.');
    }

    const properties = feature.properties || {};
    const distanceMeters = properties.distance || 0;
    const timeSeconds = properties.time || 0;

    // GeoJSON coordinates are in [lon, lat] format; Leaflet polyline expects [lat, lon]
    let coordinates = [];
    if (feature.geometry?.coordinates) {
      const coords = feature.geometry.coordinates;
      // Handle MultiLineString or LineString
      if (feature.geometry.type === 'LineString') {
        coordinates = coords.map((c) => [c[1], c[0]]);
      } else if (feature.geometry.type === 'MultiLineString') {
        coordinates = coords.flat().map((c) => [c[1], c[0]]);
      }
    }

    const result = {
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: Math.round(timeSeconds / 60),
      coordinates,
    };

    setInCache(cacheKey, result);
    return result;
  } catch (err) {
    const rawMessage = err.response?.data?.message || err.message || 'Geoapify routing failed';
    const safeMessage = rawMessage.replace(/apiKey=[a-zA-Z0-9_-]+/gi, 'apiKey=***');
    console.error(`[Geoapify Routing Error] ${safeMessage}`);
    throw new Error(safeMessage);
  }
}

module.exports = {
  getAutocompleteSuggestions,
  getDrivingRoute,
};
