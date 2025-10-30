import React, { useState, useEffect, useRef } from 'react'
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: -3.745,
    lng: -38.523
};

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);
    const mapRef = useRef(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            console.error('Geolocation is not supported by this browser.');
            return;
        }

        const onSuccess = (position) => {
            const { latitude, longitude } = position.coords;
            const newPos = { lat: latitude, lng: longitude };
            // update state
            setCurrentPosition(newPos);
            // pan map if already loaded
            if (mapRef.current && typeof mapRef.current.panTo === 'function') {
                mapRef.current.panTo(newPos);
            }
        };

        const onError = (err) => {
            console.error('Error getting geolocation:', err);
        };

        // Get initial position once
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true });

        // Watch for position changes and keep map centered
        const id = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000,
        });
        watchIdRef.current = id;

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const handleMapLoad = (map) => {
        mapRef.current = map;
        // ensure map is centered on initial position when it loads
        if (currentPosition && typeof map.panTo === 'function') map.panTo(currentPosition);
    };

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={15}
                onLoad={handleMapLoad}
            >
                <Marker position={currentPosition} />
            </GoogleMap>
        </LoadScript>
    )
}

export default LiveTracking
