import React, { useState, useEffect, useRef, useMemo } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsRenderer, OverlayView } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: -3.745,
  lng: -38.523
};

/**
 * LiveTracking
 * Props:
 *  - ride: object (expects ride.destination as either string address or { lat, lng })
 *
 * Behavior:
 *  - Tracks user's current position (geolocation)
 *  - Resolves ride.destination (geocode if string)
 *  - Draws Directions from currentPosition -> destinationPosition
 */
const LiveTracking = ({ ride }) => {
  const [currentPosition, setCurrentPosition] = useState(center)
  const [destinationPosition, setDestinationPosition] = useState(null)
  const [directions, setDirections] = useState(null)

  const mapRef = useRef(null)
  const watchIdRef = useRef(null)

  // get current position
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return () => {} // Return cleanup for early exit
    }

    const onSuccess = (position) => {
      const newPos = { lat: position.coords.latitude, lng: position.coords.longitude }
      setCurrentPosition(newPos)
      if (mapRef.current?.panTo) mapRef.current.panTo(newPos)
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
  }, [])

  // resolve destination from ride.destination:
  // accepts either { lat, lng } or a string address
  useEffect(() => {
    const destination = ride?.destination
    if (!destination) {
      setDestinationPosition(null)
      return () => {} // Return cleanup for early exit
    }

    if (typeof destination === 'object' && destination.lat != null && destination.lng != null) {
      setDestinationPosition({ lat: Number(destination.lat), lng: Number(destination.lng) })
      return () => {} // Return cleanup for early exit
    }

    const geocodeAddress = async () => {
      if (!window.google?.maps) {
        console.warn('Google maps not loaded yet — cannot geocode ride.destination')
        return
      }
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: String(destination) }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location
          setDestinationPosition({ lat: loc.lat(), lng: loc.lng() })
        } else {
          console.warn('ride.destination geocode failed', status)
          setDestinationPosition(null)
        }
      })
    }

    geocodeAddress()
    
    // Return cleanup function (no-op for this effect, but required by React)
    return () => {}
  }, [ride?.destination])

  // compute directions from currentPosition -> destinationPosition
  useEffect(() => {
    if (!destinationPosition || !currentPosition || !window.google?.maps) {
      return () => {} // Return cleanup for early exit
    }

    const service = new window.google.maps.DirectionsService()
    service.route({
      origin: currentPosition,
      destination: destinationPosition,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result)
      } else {
        console.error('Directions error', status)
        setDirections(null)
      }
    })
    
    // Return cleanup function
    return () => {}
  }, [currentPosition, destinationPosition])

  const handleMapLoad = (map) => {
    mapRef.current = map
    if (currentPosition?.lat && typeof map.panTo === 'function') map.panTo(currentPosition)
  }

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

  const currentIcon = useMemo(() => makePinIcon('#27ae60'), [])
  const destIcon = useMemo(() => makePinIcon('#e74c3c'), [])

  const renderOverlayLabel = (position, text, bgColor) => (
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
          width: 10, height: 10, borderRadius: 6, background: bgColor,
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)', flex: '0 0 10px'
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
          whiteSpace: 'nowrap'
        }}>
          {text}
        </div>
      </div>
    </OverlayView>
  )

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
        center={destinationPosition || currentPosition}
        zoom={15}
        onLoad={handleMapLoad}
        options={mapOptions}
      >
        {currentPosition && (
          <Marker position={currentPosition} zIndex={5} icon={currentIcon} title="You" />
        )}

        {destinationPosition && (
          <Marker position={destinationPosition} zIndex={3} icon={destIcon} title="Destination" />
        )}

        {currentPosition && renderOverlayLabel(currentPosition, 'You', '#27ae60')}
        {destinationPosition && renderOverlayLabel(destinationPosition, 'Destination', '#e74c3c')}

        {directions && (
          <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />
        )}
      </GoogleMap>
    </LoadScript>
  )
}

export default LiveTracking