import React, { useState, useEffect, useRef, useContext, useMemo } from 'react'
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

const LiveTracking = ({ ride, User }) => {
  const { socket } = useContext(SocketContext) || {};

  const [currentPosition, setCurrentPosition] = useState(center);
  const [captainPosition, setCaptainPosition] = useState(null);
  const [pickupPosition, setPickupPosition] = useState(null);
  const [directions, setDirections] = useState(null);

  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // to get current position 
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const onSuccess = (position) => {
      const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCurrentPosition(newPos);
      if (mapRef.current?.panTo) mapRef.current.panTo(newPos);
    };
    const onError = (err) => console.error('geolocation error', err);
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true });
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 });
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current) };
  }, []);

  // set captainPosition and geocode pickup
  useEffect(() => {
    if (!ride) return;

    // robustly read latitude/longitude from different keys (lat, ltd, latitude) to avoid typos
    const loc = ride.captain?.location || {};
    const lat = loc?.lat ?? loc?.ltd ?? loc?.latitude ?? null;
    const lng = loc?.lng ?? loc?.longitude ?? null;
    if (lat != null && lng != null) {
      // ensure numbers
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
        setCaptainPosition({ lat: parsedLat, lng: parsedLng });
        console.log('[LiveTracking] setCaptainPosition', { parsedLat, parsedLng });
      }
    } else {
      console.log('[LiveTracking] no captain location found on ride', ride._id);
    }

    // pickup geocode
    const geocodePickup = async () => {
      if (!ride.pickup || !window.google?.maps) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: ride.pickup }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          setPickupPosition({ lat: loc.lat(), lng: loc.lng() });
          console.log('[LiveTracking] pickup geocoded', { lat: loc.lat(), lng: loc.lng() });
        } else {
          console.warn('[LiveTracking] pickup geocode failed', status);
        }
      });
    };
    geocodePickup();
  }, [ride]);

  // compute directions - use captainPosition when User true, otherwise currentPosition
  useEffect(() => {
    if (!pickupPosition || !window.google?.maps) {
      // nothing to do until pickup and maps are available
      return;
    }

    const origin = User ? captainPosition : currentPosition;
    if (!origin) {
      console.log('[LiveTracking] no origin available for directions', { User, captainPosition, currentPosition });
      return;
    }

    const service = new window.google.maps.DirectionsService();
    service.route({
      origin,
      destination: pickupPosition,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        console.log('[LiveTracking] directions received');
      } else {
        console.error('[LiveTracking] Directions error', status);
      }
    });
  }, [captainPosition, pickupPosition, currentPosition, User]);

  // socket captain location updates
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      if (ride && payload.rideId && String(payload.rideId) !== String(ride._id)) return;
      if (payload.location?.ltd || payload.location?.lat || payload.location?.latitude) {
        const lat = payload.location.ltd ?? payload.location.lat ?? payload.location.latitude;
        const lng = payload.location.lng ?? payload.location.longitude;
        if (lat != null && lng != null) setCaptainPosition({ lat: Number(lat), lng: Number(lng) });
      }
    };
    socket.on('captain-location-update', handler);
    return () => socket.off('captain-location-update', handler);
  }, [socket, ride]);

  const handleMapLoad = (map) => {
    mapRef.current = map;
    if (currentPosition?.lat && map.panTo) map.panTo(currentPosition);
  };

  // simple colored pin as SVG icon (no embedded text)
  const makePinIcon = (colorHex) => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <path d="M32 6 C42 6 50 14 50 24 C50 34 32 54 32 54 C32 54 14 34 14 24 C14 14 22 6 32 6 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
        <circle cx="32" cy="22" r="8" fill="white"/>
      </svg>`;
    const url = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

    // guard against google not being loaded yet
    if (window.google && window.google.maps && window.google.maps.Size && window.google.maps.Point) {
      return {
        url,
        scaledSize: new window.google.maps.Size(44, 44),
        anchor: new window.google.maps.Point(22, 44)
      };
    }

    return { url };
  };

  // memoize icons so we don't recreate every render; they will be null until google is ready
  const captainIcon = useMemo(() => {
    return makePinIcon('#27ae60');
  }, [/* purposely empty; svg is static */]);

  const pickupIcon = useMemo(() => {
    return makePinIcon('#e74c3c');
  }, []);

  const renderOverlayLabel = (position, text, bgColor) => {
    return (
      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        getPixelPositionOffset={(width, height) => {
          return { x: -width / 2, y: -height - 18 };
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          zIndex: 9999
        }}>

          <span style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            background: bgColor,
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            flex: '0 0 10px'
          }} />

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

            textShadow: '0 2px 0 rgba(0,0,0,0.6), 0 1px 6px rgba(0,0,0,0.9)'
          }}>
            {text}
          </div>
        </div>
      </OverlayView>
    );
  };

  const mapOptions = {
    zoomControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false
  }

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={captainPosition || currentPosition}
        zoom={15}
        onLoad={handleMapLoad}
        options={mapOptions}
      >

        {pickupPosition && (
          <Marker
            position={pickupPosition}
            zIndex={2}
            icon={pickupIcon}
            title="Pickup"
          />
        )}

        {currentPosition && (!User) && (
          <Marker
            position={currentPosition}
            zIndex={5}
            icon={captainIcon}
            title="Captain"
          />
        )}


        {captainPosition && (User) && (
          <Marker
            position={captainPosition}
            zIndex={3}
            icon={captainIcon}
            title="Captain"
          />
        )}


        {pickupPosition && renderOverlayLabel(pickupPosition, 'Pickup', '#e74c3c')}
        {captainPosition && (User) && renderOverlayLabel(captainPosition, 'Captain', '#27ae60')}
        {currentPosition && (!User) && renderOverlayLabel(currentPosition, 'Captain', '#27ae60')}



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