import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock, Navigation, AlertTriangle } from 'lucide-react';
import { locationService } from '../services/locationService';

// Custom clean black & white SVG icons for Leaflet markers
const createPinIcon = (label, color = '#111111') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background-color:${color}; color:#ffffff; font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; box-shadow:0 2px 5px rgba(0,0,0,0.25); white-space:nowrap; letter-spacing:0.5px; border:1px solid #ffffff;">
          ${label}
        </div>
        <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${color};"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const pickupIcon = createPinIcon('PICKUP', '#111111');
const destIcon = createPinIcon('DESTINATION', '#262626');

// Helper to auto-fit map bounds to markers & route
const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        // Safe catch if coordinates are identical or invalid
      }
    }
  }, [bounds, map]);
  return null;
};

const RideMap = ({
  from, // { latitude, longitude, name, city }
  to, // { latitude, longitude, name, city }
  height = '350px',
  interactive = true,
}) => {
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');

  const hasValidCoordinates =
    from &&
    to &&
    !isNaN(from.latitude) &&
    !isNaN(from.longitude) &&
    !isNaN(to.latitude) &&
    !isNaN(to.longitude);

  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      if (!hasValidCoordinates) return;

      setLoadingRoute(true);
      setRouteError('');

      try {
        const data = await locationService.getDrivingRoute(
          { lat: from.latitude, lon: from.longitude },
          { lat: to.latitude, lon: to.longitude }
        );

        if (isMounted) {
          if (data && data.coordinates && data.coordinates.length > 0) {
            setRouteData(data);
          } else {
            setRouteError('Direct driving route preview unavailable for these locations.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setRouteError('Could not load driving route geometry.');
        }
      } finally {
        if (isMounted) {
          setLoadingRoute(false);
        }
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [from?.latitude, from?.longitude, to?.latitude, to?.longitude]);

  if (!hasValidCoordinates) {
    return (
      <div
        style={{ height }}
        className="w-full bg-neutral-100 border border-border-subtle rounded-md flex items-center justify-center p-4 text-xs text-text-secondary"
      >
        Select both Pickup and Destination to display the route map.
      </div>
    );
  }

  const pickupCoords = [from.latitude, from.longitude];
  const destCoords = [to.latitude, to.longitude];

  // Map tile configuration:
  const geoapifyKey = import.meta.env.VITE_GEOAPIFY_MAPS_KEY;
  const isGeoapifyConfigured =
    geoapifyKey &&
    geoapifyKey !== 'your_browser_restricted_geoapify_key' &&
    geoapifyKey !== 'your_geoapify_api_key';

  const tileUrl = isGeoapifyConfigured
    ? `https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`
    : `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`;

  const attribution = isGeoapifyConfigured
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.geoapify.com/">Geoapify</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const bounds = [pickupCoords, destCoords];
  if (routeData?.coordinates?.length) {
    bounds.push(...routeData.coordinates);
  }

  return (
    <div className="relative w-full overflow-hidden border border-border-subtle rounded-md shadow-sm">
      {/* Route Distance and Duration overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border-subtle shadow-sm text-xs font-medium text-text-primary">
        {loadingRoute ? (
          <span className="flex items-center gap-1.5 text-text-secondary">
            <div className="w-3 h-3 border-2 border-neutral-300 border-t-brand-black rounded-full animate-spin" />
            Calculating driving route...
          </span>
        ) : routeData ? (
          <>
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-brand-black" />
              Distance: <strong className="font-semibold">{routeData.distanceKm} km</strong>
            </span>
            <span className="text-neutral-300">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-black" />
              Duration: <strong className="font-semibold">{routeData.durationMinutes} min</strong>
            </span>
          </>
        ) : routeError ? (
          <span className="flex items-center gap-1 text-neutral-500">
            <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
            {routeError}
          </span>
        ) : (
          <span>Route Preview</span>
        )}
      </div>

      <div style={{ height }} className="w-full">
        <MapContainer
          center={pickupCoords}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution={attribution} url={tileUrl} maxZoom={19} />

          <FitBounds bounds={bounds} />

          {/* Pickup Marker */}
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              <div className="text-xs">
                <strong>Pickup:</strong>
                <p>{from.name}</p>
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={destCoords} icon={destIcon}>
            <Popup>
              <div className="text-xs">
                <strong>Destination:</strong>
                <p>{to.name}</p>
              </div>
            </Popup>
          </Marker>

          {/* Driving Route Polyline */}
          {routeData?.coordinates && routeData.coordinates.length > 0 ? (
            <Polyline
              positions={routeData.coordinates}
              pathOptions={{
                color: '#111111',
                weight: 4,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ) : (
            // Fallback straight dotted line if routing geometry is unavailable
            <Polyline
              positions={[pickupCoords, destCoords]}
              pathOptions={{
                color: '#737373',
                weight: 2,
                dashArray: '6, 8',
                opacity: 0.6,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RideMap;
