import React, { useEffect, useState, useRef, useContext } from 'react';
import CaptainDetail from '../components/CaptainDetail';
import RidePopUp from '../components/RidePopUp';
import EventRidePopUp from '../components/EventRidePopUp';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import LiveTracking from '../components/LiveTracking';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CapatainContext';
import axios from 'axios';
import ArrivedAtPickup from '../components/ArrivedAtPickup';

function CaptainHome() {
  // Defensive Context Hydration & Loading
  const { captain, setCaptain } = useContext(CaptainDataContext);

  useEffect(() => {
    // On initial mount, try to hydrate if captain missing but exists in localStorage
    if (!captain) {
      try {
        const stored = localStorage.getItem('captain');
        if (stored) setCaptain(JSON.parse(stored));
      } catch (e) {}
    }
  }, [captain, setCaptain]);

  // Defensive: only render when captain is fully hydrated
  if (
    !captain ||
    !captain.vehicle ||
    !captain.vehicleType ||
    !captain.fare
  ) {
    return (
      <div className="h-screen flex items-center justify-center text-lg font-semibold">
        Loading captain data...
      </div>
    );
  }

  // Component State
  const [ridePopUpPanel, setRidePopUpPanel] = useState(false);
  const [eventRidePopUpPanel, setEventRidePopUpPanel] = useState(false);
  const [startEventRidePopUpPanel, setStartEventRidePopUpPanel] = useState(false);
  const [confirmRidePopUpPanel, setConfirmRidePopUpPanel] = useState(false);
  const [eventConfirmRidePopUpPanel, setEventConfirmRidePopUpPanel] = useState(false);

  const [arrivedPopUpPanel, setArrivedPopUpPanel] = useState(false);

  const [ride, setRide] = useState(null);
  const [eventRide, setEventRide] = useState(null);

  // Socket/context
  const { socket } = useContext(SocketContext);

  // Refs
  const captainRef = useRef(null);
  useEffect(() => {
    captainRef.current = captain;
  }, [captain]);

  // GSAP Refs
  const ridePopUpRef = useRef();
  const eventRidePopUpRef = useRef();
  const startEventRidePopUpRef = useRef();
  const confirmRidePopUpRef = useRef();
  const eventConfirmRidePopUpRef = useRef();
  const aproachingToPickupRef = useRef();

  // Join Room on Captain data available
  useEffect(() => {
    if (!captain) return;
    socket.emit('join', {
      userId: captain._id,
      userType: 'captain',
    });

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          socket.emit('update-location-captain', {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        });
      }
    };

    const locationInterval = setInterval(updateLocation, 10000);
    updateLocation();

    return () => clearInterval(locationInterval);
  }, [captain, socket]);

  // Listen for new ride
  useEffect(() => {
    const onNewRide = (data) => {
      const cap = captainRef.current;
      if (!cap) return;

      if ('vehicleType' in data) {
        if (cap.vehicle?.vehicleType === data.vehicleType) {
          setRide(data);
          setRidePopUpPanel(true);
        }
      } else {
        if (cap.vehicle?.vehicleType === 'car') {
          setEventRide(data);
          setEventRidePopUpPanel(true);
        }
      }
    };
    socket.on('new-ride', onNewRide);
    return () => socket.off('new-ride', onNewRide);
  }, [socket]);

  // Listen for ride-claimed
  useEffect(() => {
    const onRideClaimed = (payload) => {
      const claimedId = payload?.rideId;
      const acceptedCaptainId = payload?.captainId;
      const selfCaptainId = captainRef.current?._id;
      if (!claimedId) return;

      if (acceptedCaptainId && selfCaptainId && String(acceptedCaptainId) === String(selfCaptainId)) {
        return;
      }

      if (ride && ride._id === claimedId) {
        setRidePopUpPanel(false);
        setRide(null);
      }
      if (eventRide && eventRide._id === claimedId) {
        setEventRidePopUpPanel(false);
        setEventRide(null);
      }
    };
    socket.on('ride-claimed', onRideClaimed);
    return () => socket.off('ride-claimed', onRideClaimed);
  }, [socket, ride, eventRide]);

  // Confirm ride
  async function confirmRide() {
    if (!ride) return;
    await axios.post(
      `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
      {
        rideId: ride._id,
        captainId: captain._id,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
  }

  async function confirmEventRide() {
    if (!eventRide) return;
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
      {
        rideId: eventRide._id,
        captainId: captain._id,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    setEventRidePopUpPanel(false);
  }

  // GSAP Panels
  useGSAP(() => {
    gsap.to(ridePopUpRef.current, {
      y: ridePopUpPanel ? 0 : '100%',
      opacity: ridePopUpPanel ? 1 : 0,
      pointerEvents: ridePopUpPanel ? 'auto' : 'none',
      zIndex: ridePopUpPanel ? 50 : 0,
      duration: 0.3,
    });
  }, [ridePopUpPanel]);

  useGSAP(() => {
    gsap.to(aproachingToPickupRef.current, {
      y: arrivedPopUpPanel ? 0 : '100%',
      opacity: arrivedPopUpPanel ? 1 : 0,
      pointerEvents: arrivedPopUpPanel ? 'auto' : 'none',
      zIndex: arrivedPopUpPanel ? 50 : 0,
      duration: 0.3,
    });
  }, [arrivedPopUpPanel]);

  useGSAP(() => {
    gsap.to(eventRidePopUpRef.current, {
      y: eventRidePopUpPanel ? 0 : '100%',
      opacity: eventRidePopUpPanel ? 1 : 0,
      pointerEvents: eventRidePopUpPanel ? 'auto' : 'none',
      zIndex: eventRidePopUpPanel ? 50 : 0,
      duration: 0.3,
    });
  }, [eventRidePopUpPanel]);

  useGSAP(() => {
    gsap.to(startEventRidePopUpRef.current, {
      y: startEventRidePopUpPanel ? 0 : '100%',
      opacity: startEventRidePopUpPanel ? 1 : 0,
      pointerEvents: startEventRidePopUpPanel ? 'auto' : 'none',
      zIndex: startEventRidePopUpPanel ? 50 : 0,
      duration: 0.3,
    });
  }, [startEventRidePopUpPanel]);

  useGSAP(() => {
    gsap.to(confirmRidePopUpRef.current, {
      y: confirmRidePopUpPanel ? 0 : '100%',
      pointerEvents: confirmRidePopUpPanel ? 'auto' : 'none',
      zIndex: confirmRidePopUpPanel ? 50 : 0,
      duration: 0.3,
    });
  }, [confirmRidePopUpPanel]);

  // Page Layout
  return (
    <div className="h-screen overflow-hidden">
      <div className="h-[50%]">
        <LiveTracking />
      </div>
      <div className="fixed bottom-0 h-[46%] w-full max-w-full overflow-y-auto overflow-x-hidden bg-white">
        <CaptainDetail setArrivedPopUpPanel={setArrivedPopUpPanel} setRide={setRide} />
      </div>
      <div
        ref={ridePopUpRef}
        className="fixed bottom-0 bg-white w-screen h-[48%] lg:ml-6 mb-3 translate-y-full"
      >
        <RidePopUp
          setRidePopUpPanel={setRidePopUpPanel}
          ride={ride}
          confirmRide={confirmRide}
          setArrivedPopUpPanel={setArrivedPopUpPanel}
          setConfirmRidePopUpPanel={setConfirmRidePopUpPanel}
        />
      </div>
      <div
        ref={aproachingToPickupRef}
        className="h-screen fixed bottom-0 bg-white w-screen lg:ml-6 translate-y-full"
      >
        <ArrivedAtPickup
          setArrivedPopUpPanel={setArrivedPopUpPanel}
          ride={ride}
          setConfirmRidePopUpPanel={setConfirmRidePopUpPanel}
        />
      </div>
      <div
        ref={eventRidePopUpRef}
        className="fixed bottom-0 bg-white w-screen h-[48%] lg:ml-6 mb-8 translate-y-full"
      >
        <EventRidePopUp
          setEventRidePopUpPanel={setEventRidePopUpPanel}
          ride={eventRide}
          confirmEventRide={confirmEventRide}
          setEventConfirmRidePopUpPanel={setEventConfirmRidePopUpPanel}
        />
      </div>
      {/* Optional event ride start panel */}
      {/* <div
        ref={startEventRidePopUpRef}
        className="fixed bottom-0 bg-white w-screen h-[48%] lg:ml-6 mb-8 translate-y-full"
      >
        <StartRide
          setEventRidePopUpPanel={setStartEventRidePopUpPanel}
          ride={eventRide}
          setEventConfirmRidePopUpPanel={setEventConfirmRidePopUpPanel}
        />
      </div> */}
      <div
        ref={confirmRidePopUpRef}
        className="h-screen fixed bottom-0 bg-white w-screen lg:ml-6 translate-y-full"
      >
        <ConfirmRidePopUp
          setConfirmRidePopUpPanel={setConfirmRidePopUpPanel}
          ride={ride}
          setRidePopUpPanel={setRidePopUpPanel}
        />
      </div>
    </div>
  );
}

export default CaptainHome;
