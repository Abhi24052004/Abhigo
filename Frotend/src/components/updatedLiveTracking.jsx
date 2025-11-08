import React, { useState, useEffect, useRef, useContext, useMemo } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsRenderer, OverlayView } from '@react-google-maps/api'
import { SocketContext } from '../context/SocketContext'

const containerStyle = {
  width: '100%',
  height: '100%', // parent must provide explicit height (ArrivedAtPickup now does)
}

const defaultCenter = {
  lat: 22.570, // fallback center (you can change)
  lng: 72.930
}

const LiveTracking = ({ ride, User }) => {
  const { socket } = useContext(SocketContext) || {}

  const [currentPosition, setCurrentPosition] = useState(null)
  const [captainPosition, setCaptainPosition] = useState(null)
  const [pickupPosition, setPickupPosition] = useState(null)
  const [directions, setDirections] = useState(null)

  const mapRef = useRef(null)
  const watchIdRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const followCaptainRef = useRef(true) // keep map centered on first location, can be toggled

  // get current position (throttled & distance guarded to reduce jitter)
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const onSuccess = (position) => {
      const newPos = { lat: position.coords.latitude, lng: position.coords.longitude }

      // Throttle to once every 1500 ms (adjust as needed)
      const now = Date.now()
      const last = lastUpdateRef.current || 0
      const dt = now - last
      const moved = distanceMeters(currentPosition, newPos)

      if (dt > 1500 || moved > 5 || !currentPosition) {
        lastUpdateRef.current = now
        setCurrentPosition(newPos)
        // optionally pan only the first time or when following
        if (mapRef.current && followCaptainRef.current) {
          try {
            mapRef.current.panTo(newPos)
          } catch (e) {
            // ignore pan errors
          }
        }
      }
    }
    const onError = (err) => console.error('geolocation error', err)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true })
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000
    })
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [currentPosition])

  // helper: compute rough distance (meters) between two lat/lng points
  function distanceMeters(a, b) {
    if (!a || !b) return Infinity
    const R = 6371000
    const toRad = (x) => (x * Math.PI) / 180
    const dLat = toRad(b.lat - a.lat)
    const dLon = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const sinDLat = Math.sin(dLat / 2)
    const sinDLon = Math.sin(dLon / 2)
    const h =
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
    return R * c
  }

  // Set captain position and geocode pickup when ride changes
  useEffect(() => {
    if (!ride) return

    // Captain location may be present in different keys
    const loc = ride.captain?.location || {}
    const lat = loc?.lat ?? loc?.ltd ?? loc?.latitude ?? null
    const lng = loc?.lng ?? loc?.longitude ?? null
    if (lat != null && lng != null) {
      const parsedLat = Number(lat)
      const parsedLng = Number(lng)
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
        setCaptainPosition({ lat: parsedLat, lng: parsedLng })
        console.log('[LiveTracking] setCaptainPosition from ride', { parsedLat, parsedLng })
        // pan to captain once on receiving ride update (if following enabled)
        if (mapRef.current && followCaptainRef.current) {
          try {
            mapRef.current.panTo({ lat: parsedLat, lng: parsedLng })
          } catch (e) {}
        }
      }
    } else {
      console.log('[LiveTracking] no captain location found on ride', ride._id)
    }

    // pickup geocode (if textual address exists)
    const geocodePickup = async () => {
      if (!ride.pickup || !window.google?.maps) return
      try {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address: ride.pickup }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const loc = results[0].geometry.location
            setPickupPosition({ lat: loc.lat(), lng: loc.lng() })
            console.log('[LiveTracking] pickup geocoded', { lat: loc.lat(), lng: loc.lng() })
          } else {
            console.warn('[LiveTracking] pickup geocode failed', status)
            setPickupPosition(null)
          }
        })
      } catch (err) {
        console.error('[LiveTracking] geocode error', err)
      }
    }
    geocodePickup()
  }, [ride])

  // Directions: compute route from origin to pickup when pickup position exists
  useEffect(() => {
    if (!pickupPosition || !window.google?.maps) return
    const origin = User ? captainPosition || currentPosition : currentPosition || captainPosition
    if (!origin) {
      console.log('[LiveTracking] no origin available for directions', { User, captainPosition, currentPosition })
      return
    }
    const service = new window.google.maps.DirectionsService()
    service.route(
      {
        origin,
        destination: pickupPosition,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result)
          console.log('[LiveTracking] directions received')
        } else {
          console.error('[LiveTracking] Directions error', status)
        }
      }
    )
  }, [pickupPosition, captainPosition, currentPosition, User])

  // Socket updates for captain location
  useEffect(() => {
    if (!socket) return
    const handler = (payload) => {
      if (ride && payload.rideId && String(payload.rideId) !== String(ride._id)) return
      const lat = payload.location?.ltd ?? payload.location?.lat ?? payload.location?.latitude
      const lng = payload.location?.lng ?? payload.location?.longitude
      if (lat != null && lng != null) {
        const newPos = { lat: Number(lat), lng: Number(lng) }
        // Avoid jitter by only updating if moved > 5 meters or more than 1500ms passed
        const now = Date.now()
        const last = lastUpdateRef.current || 0
        const moved = distanceMeters(captainPosition, newPos)
        if (moved > 5 || now - last > 1500 || !captainPosition) {
          lastUpdateRef.current = now
          setCaptainPosition(newPos)
          if (mapRef.current && followCaptainRef.current) {
            try {
              mapRef.current.panTo(newPos)
            } catch (e) {}
          }
        }
      }
    }
    socket.on('captain-location-update', handler)
    return () => socket.off('captain-location-update', handler)
  }, [socket, ride, captainPosition])

  const handleMapLoad = (map) => {
    mapRef.current = map
    // On load, if we already have a position, center map there
    const initial = captainPosition || currentPosition
    if (initial && map.panTo) {
      setTimeout(() => {
        try {
          map.panTo(initial)
        } catch (e) {}
      }, 0)
    }
  }

  // small colored pin as SVG icon
  const makePinIcon = (colorHex) => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <path d="M32 6 C42 6 50 14 50 24 C50 34 32 54 32 54 C32 54 14 34 14 24 C14 14 22 6 32 6 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
        <circle cx="32" cy="22" r="8" fill="white"/>
      </svg>`
    const url = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
    if (window.google && window.google.maps && window.google.maps.Size && window.google.maps.Point) {
      return {
        url,
        scaledSize: new window.google.maps.Size(44, 44),
        anchor: new window.google.maps.Point(22, 44)
      }
    }
    return { url }
  }

  const captainIcon = useMemo(() => makePinIcon('#27ae60'), [])
  const pickupIcon = useMemo(() => makePinIcon('#e74c3c'), [])

  const renderOverlayLabel = (position, text, bgColor) => {
    return (
      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        getPixelPositionOffset={(width, height) => ({ x: -width / 2, y: -height - 18 })}
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
            fontSize: 13,
            whiteSpace: 'nowrap'
          }}>
            {text}
          </div>
        </div>
      </OverlayView>
    )
  }

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter} // keep stable; pan programmatically instead of updating center prop constantly
        zoom={15}
        onLoad={handleMapLoad}
        options={{ zoomControl: false, fullscreenControl: false, streetViewControl: false, mapTypeControl: false }}
      >
        {/* Markers and overlays */}
        {pickupPosition && <Marker position={pickupPosition} zIndex={2} icon={pickupIcon} title="Pickup" />}

        {/* Show captain marker at captainPosition if present */}
        {captainPosition && !User && (
          <Marker position={captainPosition} zIndex={5} icon={captainIcon} title="Captain" />
        )}
        {currentPosition && !User && (
          <Marker position={currentPosition} zIndex={5} icon={captainIcon} title="You" />
        )}
        {captainPosition && User && (
          <Marker position={captainPosition} zIndex={5} icon={captainIcon} title="Captain" />
        )}

        {pickupPosition && renderOverlayLabel(pickupPosition, 'Pickup', '#e74c3c')}
        {captainPosition && User && renderOverlayLabel(captainPosition, 'Captain', '#27ae60')}
        {currentPosition && !User && renderOverlayLabel(currentPosition, 'You', '#27ae60')}

        {/* DirectionsRenderer: preserveViewport so it doesn't forcibly change center/zoom */}
        {directions && (
          <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, preserveViewport: true }} />
        )}
      </GoogleMap>
    </LoadScript>
  )
}

export default LiveTracking
