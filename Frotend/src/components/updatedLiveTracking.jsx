import React, { useState, useEffect, useRef, useContext, useMemo } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsRenderer, OverlayView } from '@react-google-maps/api'
import { SocketContext } from '../context/SocketContext'

const containerStyle = {
  width: '100%',
  height: '100%' // parent must supply explicit pixel height
}

const defaultCenter = { lat: 22.570, lng: 72.930 }

const LiveTracking = ({ ride, User }) => {
  // prefer build-time env, fallback to runtime injected config if you use runtime-config.js
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.VITE_GOOGLE_MAPS_API_KEY) || ''

  const { socket } = useContext(SocketContext) || {}

  const [currentPosition, setCurrentPosition] = useState(null) // device geolocation
  const [captainPosition, setCaptainPosition] = useState(null) // from ride or socket
  const [pickupPosition, setPickupPosition] = useState(null)
  const [directions, setDirections] = useState(null)

  const mapRef = useRef(null)
  const watchIdRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const followRef = useRef(true) // initial follow behavior; change via UI later if desired

  // If API key missing, show a friendly error instead of "Loading..."
  if (!apiKey) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 text-center p-4">
        <div>
          <div className="text-lg font-semibold text-rose-600">Google Maps API key missing</div>
          <div className="text-sm text-gray-600 mt-2">Set VITE_GOOGLE_MAPS_API_KEY at build time or provide window.__RUNTIME_CONFIG__.VITE_GOOGLE_MAPS_API_KEY</div>
        </div>
      </div>
    )
  }

  // helper: rough distance (meters)
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

  // device geolocation (throttled)
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const onSuccess = (position) => {
      const newPos = { lat: position.coords.latitude, lng: position.coords.longitude }
      const now = Date.now()
      const last = lastUpdateRef.current || 0
      const moved = distanceMeters(currentPosition, newPos)
      if (now - last > 1500 || moved > 5 || !currentPosition) {
        lastUpdateRef.current = now
        setCurrentPosition(newPos)
        if (mapRef.current && followRef.current) {
          try { mapRef.current.panTo(newPos) } catch (e) {}
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
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // when ride arrives, set captain position (if included) and geocode pickup
  useEffect(() => {
    if (!ride) return

    // pick up captain location from ride if present
    const loc = ride.captain?.location || {}
    const lat = loc?.lat ?? loc?.ltd ?? loc?.latitude ?? null
    const lng = loc?.lng ?? loc?.longitude ?? null
    if (lat != null && lng != null) {
      const parsedLat = Number(lat)
      const parsedLng = Number(lng)
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
        setCaptainPosition({ lat: parsedLat, lng: parsedLng })
        if (mapRef.current && followRef.current) {
          try { mapRef.current.panTo({ lat: parsedLat, lng: parsedLng }) } catch (e) {}
        }
      }
    } else {
      // fallback: if ride doesn't include captain location, rely on device geolocation (currentPosition)
      console.debug('[LiveTracking] ride has no captain.location — falling back to device geolocation')
    }

    // geocode pickup address if provided
    const geocodePickup = async () => {
      if (!ride.pickup || !window.google?.maps) return
      try {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address: ride.pickup }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const loc2 = results[0].geometry.location
            setPickupPosition({ lat: loc2.lat(), lng: loc2.lng() })
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

  // compute directions when pickupPosition and an origin are available
  useEffect(() => {
    if (!pickupPosition || !window.google?.maps) return

    // origin precedence: if User flag (viewing as user) use captainPosition, else prefer device currentPosition
    const origin = User ? (captainPosition || currentPosition) : (currentPosition || captainPosition)
    if (!origin) return

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
        } else {
          console.error('[LiveTracking] Directions error', status)
        }
      }
    )
  }, [pickupPosition, captainPosition, currentPosition, User])

  // socket updates for captain; update marker but throttle+panning rules keep map steady
  useEffect(() => {
    if (!socket) return
    const handler = (payload) => {
      if (ride && payload.rideId && String(payload.rideId) !== String(ride._id)) return
      const lat = payload.location?.ltd ?? payload.location?.lat ?? payload.location?.latitude
      const lng = payload.location?.lng ?? payload.location?.longitude
      if (lat != null && lng != null) {
        const newPos = { lat: Number(lat), lng: Number(lng) }
        const now = Date.now()
        const last = lastUpdateRef.current || 0
        const moved = distanceMeters(captainPosition, newPos)
        if (moved > 5 || now - last > 1500 || !captainPosition) {
          lastUpdateRef.current = now
          setCaptainPosition(newPos)
          if (mapRef.current && followRef.current) {
            try { mapRef.current.panTo(newPos) } catch (e) {}
          }
        }
      }
    }
    socket.on('captain-location-update', handler)
    return () => socket.off('captain-location-update', handler)
  }, [socket, ride, captainPosition])

  const handleMapLoad = (map) => {
    mapRef.current = map
    const initial = captainPosition || currentPosition || defaultCenter
    if (initial && map.panTo) {
      setTimeout(() => { try { map.panTo(initial) } catch (e) {} }, 0)
    }
  }

  const makePinIcon = (colorHex) => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <path d="M32 6 C42 6 50 14 50 24 C50 34 32 54 32 54 C32 54 14 34 14 24 C14 14 22 6 32 6 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
        <circle cx="32" cy="22" r="8" fill="white"/>
      </svg>`
    const url = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
    if (window.google && window.google.maps && window.google.maps.Size && window.google.maps.Point) {
      return { url, scaledSize: new window.google.maps.Size(44, 44), anchor: new window.google.maps.Point(22, 44) }
    }
    return { url }
  }

  const captainIcon = useMemo(() => makePinIcon('#27ae60'), [])
  const pickupIcon = useMemo(() => makePinIcon('#e74c3c'), [])

  const renderOverlayLabel = (position, text, bgColor) => (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({ x: -width / 2, y: -height - 18 })}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none', transform: 'translateZ(0)', zIndex: 9999 }}>
        <span style={{ width: 10, height: 10, borderRadius: 6, background: bgColor, boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }} />
        <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>
          {text}
        </div>
      </div>
    </OverlayView>
  )

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={15}
        onLoad={handleMapLoad}
        options={{ zoomControl: false, fullscreenControl: false, streetViewControl: false, mapTypeControl: false }}
      >
        {pickupPosition && <Marker position={pickupPosition} zIndex={2} icon={pickupIcon} title="Pickup" />}
        {/* show device position (always available if user gave geolocation permission) */}
        {currentPosition && (
          <Marker position={currentPosition} zIndex={6} icon={captainIcon} title="You" />
        )}

        {/* show captainPosition (from ride or socket) */}
        {captainPosition && (
          <Marker position={captainPosition} zIndex={5} icon={captainIcon} title="Captain" />
        )}

        {pickupPosition && renderOverlayLabel(pickupPosition, 'Pickup', '#e74c3c')}
        {captainPosition && renderOverlayLabel(captainPosition, 'Captain', '#27ae60')}
        {currentPosition && renderOverlayLabel(currentPosition, 'You', '#27ae60')}

        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, preserveViewport: true }} />}
      </GoogleMap>
    </LoadScript>
  )
}

export default LiveTracking
