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
  const [ridePopUpPanel, setRidePopUpPanel] = useState(false);
  const [eventRidePopUpPanel, setEventRidePopUpPanel] = useState(false);
  const [startEventRidePopUpPanel, setStartEventRidePopUpPanel] = useState(false);
  const [confirmRidePopUpPanel, setConfirmRidePopUpPanel] = useState(false);
  const [eventConfirmRidePopUpPanel, setEventConfirmRidePopUpPanel] = useState(false);

  const ridePopUpRef = useRef();
  const eventRidePopUpRef = useRef();
  const startEventRidePopUpRef = useRef();
  const confirmRidePopUpRef = useRef();
  const eventConfirmRidePopUpRef = useRef();
  const aproachingToPickupRef = useRef();

  const [arrivedPopUpPanel, setArrivedPopUpPanel] = useState(false);

  const [ride, setRide] = useState(null);
  const [eventRide, setEventRide] = useState(null);
  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);

  const captainRef = useRef(null);
  useEffect(() => {
    captainRef.current = captain;
  }, [captain]);

  useEffect(() => {
    console.log("welcome");
    if (!captain) return;

    socket.emit('join', {
      userId: captain._id,
      userType: 'captain',
    });

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          console.log("get_Coord", position.coords.latitude + " " + position.coords.longitude);
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
  }, [captain]);



  useEffect(() => {
    const onNewRide = (data) => {
      const cap = captainRef.current;
  console.log('new-ride received', { data, captainVehicle: cap?.vehicle?.vehicleType });
      if (!cap) {
        console.log('Captain not ready yet; ignoring this new-ride for now');
        return;
      }

      if ('vehicleType' in data) {
        if (cap.vehicle?.vehicleType === data.vehicleType) {
          setRide(data);
          setRidePopUpPanel(true);
        } else {
          console.log('Vehicle type mismatch; ignoring ride');
        }
      } else {
        if (cap.vehicle?.vehicleType === 'car') {
          setEventRide(data);
          setEventRidePopUpPanel(true);
        } else {
          console.log('Event ride ignored for non-car vehicle');
        }
      }
    };

    socket.on('new-ride', onNewRide);
    return () => socket.off('new-ride', onNewRide);
  }, [socket]);

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




  async function confirmRide() {
    if (!ride) return;

    console.log('confirm-ride-called');

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

    // setRidePopUpPanel(false);
    // setConfirmRidePopUpPanel(true);
  }

  async function confirmEventRide() {
    if (!eventRide) return;

    console.log('confirm-event-ride-called');

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
    console.log("event-ride-response", response.data);
    setEventRidePopUpPanel(false);
  }

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

      <div ref={aproachingToPickupRef} className="h-screen fixed bottom-0 bg-white w-screen lg:ml-6 translate-y-full">
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

      {/* <div
        ref={eventRidePopUpRef}
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
