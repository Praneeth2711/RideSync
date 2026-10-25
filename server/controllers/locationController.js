const {
  getAutocompleteSuggestions,
  getDrivingRoute,
} = require('../services/geoapifyService');

/**
 * @route   GET /api/locations/autocomplete
 * @desc    Fetch Indian location suggestions via Geoapify
 * @access  Public
 */
const getAutocomplete = async (req, res, next) => {
  try {
    const { text } = req.query;

    if (!text || text.trim().length < 3) {
      return res.status(200).json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const suggestions = await getAutocompleteSuggestions(text);

    res.status(200).json({
      success: true,
      data: { suggestions },
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      message: err.message || 'Unable to fetch autocomplete suggestions.',
      data: { suggestions: [] },
    });
  }
};

/**
 * @route   GET /api/locations/route
 * @desc    Fetch driving route geometry, distance, and duration between two waypoints
 * @access  Public
 */
const getRoute = async (req, res, next) => {
  try {
    const { waypoints } = req.query;

    if (!waypoints || !waypoints.includes('|')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid waypoints format. Expected: lat1,lon1|lat2,lon2',
      });
    }

    const [originStr, destStr] = waypoints.split('|');
    const [lat1, lon1] = originStr.split(',').map(Number);
    const [lat2, lon2] = destStr.split(',').map(Number);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values in waypoints.',
      });
    }

    const routeData = await getDrivingRoute(lat1, lon1, lat2, lon2);

    res.status(200).json({
      success: true,
      data: routeData,
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      message: err.message || 'Unable to calculate driving route.',
      data: null,
    });
  }
};

module.exports = {
  getAutocomplete,
  getRoute,
};
