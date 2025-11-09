import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsRenderer, OverlayView } from '@react-google-maps/api'
import { SocketContext } from '../context/SocketContext'

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: -3.745,
  lng: -38.523
};

const LiveTracking = ({ ride }) => {
  const { socket } = useContext(SocketContext) || {};

  const [currentPosition, setCurrentPosition] = useState(center);
  const [captainPosition, setCaptainPosition] = useState(null);
  const [pickupPosition, setPickupPosition] = useState(null);
  const [directions, setDirections] = useState(null);

  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const initialCenterRef = useRef(center);     // keep a stable center; don't re-render center
  const lastPanRef = useRef(null);             // last position we panned to (to avoid micro-jitters)
  const followRef = useRef(true);              // auto-follow on by default
  const userPausedRef = useRef(false);         // set true when user drags the map

  // distance between two coordinates (meters)
  const distanceMeters = (a, b) => {
    if (!a || !b) return Infinity;
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  };

  // only pan when movement is meaningful and follow mode is active
  const maybePan = useCallback((pos) => {
    if (!mapRef.current || !pos) return;
    if (!followRef.current || userPausedRef.current) return;
    const last = lastPanRef.current;
    if (!last || distanceMeters(last, pos) > 15) {
      mapRef.current.panTo(pos);
      lastPanRef.current = pos;
    }
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const onSuccess = (position) => {
      const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCurrentPosition(newPos);
      // Pan only when needed; if captain is available, prefer following captain, else self
      maybePan(captainPosition || newPos);
    };
    const onError = (err) => console.error(err);
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true });
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 });
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current) };
  }, [maybePan, captainPosition]);

  useEffect(() => {
    if (!ride) return;
    if (ride.captain?.location?.ltd && ride.captain?.location?.lng) {
      const pos = { lat: ride.captain.location.ltd, lng: ride.captain.location.lng };
      setCaptainPosition(pos);
      maybePan(pos);
    }
    const geocodePickup = async () => {
      if (!ride.pickup || !window.google?.maps) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: ride.pickup }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          const p = { lat: loc.lat(), lng: loc.lng() };
          setPickupPosition(p);
          // If we haven't panned yet, center to pickup once
          if (!lastPanRef.current) maybePan(p);
        }
      });
    };
    geocodePickup();
  }, [ride, maybePan]);

  useEffect(() => {
    if (!captainPosition || !pickupPosition || !window.google?.maps) return;
    const service = new window.google.maps.DirectionsService();
    service.route({
      origin: captainPosition,
      destination: pickupPosition,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') setDirections(result);
      else console.error('Directions error', status);
    });
  }, [captainPosition, pickupPosition]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      if (ride && payload.rideId && String(payload.rideId) !== String(ride._id)) return;
      if (payload.location?.ltd && payload.location?.lng) {
        const pos = { lat: payload.location.ltd, lng: payload.location.lng };
        setCaptainPosition(pos);
        maybePan(pos);
      }
    };
    socket.on('captain-location-update', handler);
    return () => socket.off('captain-location-update', handler);
  }, [socket, ride, maybePan]);

  const handleMapLoad = (map) => {
    mapRef.current = map;
    // Choose best initial point and pan once
    const init = captainPosition || currentPosition || pickupPosition || center;
    initialCenterRef.current = init;
    if (init?.lat && map.panTo) {
      map.panTo(init);
      lastPanRef.current = init;
    }
    // Pause follow if user drags map; resume after a delay
    map.addListener('dragstart', () => { userPausedRef.current = true; });
    map.addListener('idle', () => {
      if (userPausedRef.current) setTimeout(() => { userPausedRef.current = false; }, 6000);
    });
  };

  // simple colored pin as SVG icon (no embedded text)
  const makePinIcon = (colorHex) => {
    if (!window.google) return null;
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <path d="M32 6 C42 6 50 14 50 24 C50 34 32 54 32 54 C32 54 14 34 14 24 C14 14 22 6 32 6 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
        <circle cx="32" cy="22" r="8" fill="white"/>
      </svg>`;
    const url = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    return {
      url,
      scaledSize: new window.google.maps.Size(44, 44),
      anchor: new window.google.maps.Point(22, 44)
    };
  };

  const captainIcon = window.google ? makePinIcon('#27ae60') : null;
  const pickupIcon = window.google ? makePinIcon('#e74c3c') : null;

  // OverlayView renderer for custom styled label that sits visually above the map and can be styled freely.
  const renderOverlayLabel = (position, text, bgColor) => {
    // position: { lat, lng }
    // text: string label
    // bgColor: background of little badge (used for small dot); text color & shadow handled in CSS below
    return (
      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} // puts it above most map elements
        getPixelPositionOffset={(width, height) => {
          // center the overlay horizontally, place it slightly above the marker top so text doesn't overlap pin
          return { x: -width / 2, y: -height - 18 };
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',    // allow clicks to pass to map
          transform: 'translateZ(0)', // trigger GPU layer
          zIndex: 9999
        }}>
          {/* small colored dot to the left */}
          <span style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            background: bgColor,
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            flex: '0 0 10px'
          }} />
          {/* label box with bold text and heavy text-shadow for a 'glow' / contrast effect */}
          <div style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            fontWeight: 800,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 13,
            letterSpacing: 0.6,
            boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transform: 'translateY(0)',
            // strong text shadow for crisp standout
            textShadow: '0 2px 0 rgba(0,0,0,0.6), 0 1px 6px rgba(0,0,0,0.9)'
          }}>
            {text}
          </div>
        </div>
      </OverlayView>
    );
  };

  const mapOptions = {
      zoomControl: false,          // removes the +/- zoom control
      fullscreenControl: false,    // removes the fullscreen (square-corners) control
      streetViewControl: false,    // optional: removes the pegman Street View control
      mapTypeControl: false        // optional: removes map type (Satellite) control
      // If you want to remove everything, use: disableDefaultUI: true
    }

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenterRef.current}
        zoom={15}
        onLoad={handleMapLoad}
        options={mapOptions}
      >
        {/* Pickup marker (icon only) */}
        {pickupPosition && (
          <Marker
            position={pickupPosition}
            zIndex={2}
            icon={pickupIcon}
            title="Pickup"
          />
        )}

        {/* Captain marker (icon only) */}
        {captainPosition && (
          <Marker
            position={captainPosition}
            zIndex={3}
            icon={captainIcon}
            title="Captain"
          />
        )}

        {/* Overlay labels placed above the map and positioned just above their respective pins.
            These are HTML/CSS so you can style fonts, colors, shadow, etc. */}
        {pickupPosition && renderOverlayLabel(pickupPosition, 'Pickup', '#e74c3c')}
        {captainPosition && renderOverlayLabel(captainPosition, 'Captain', '#27ae60')}

        {/* Render route but suppress default origin/destination markers to avoid duplicates */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{ suppressMarkers: true }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  )
}

export default LiveTracking
