import React from 'react'
import CaptainDetail from '../components/CaptainDetail'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useState, useRef } from 'react';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios';
import LiveTracking from '../components/LiveTracking';

function CaptainHome() {
  const [ridePopUpPanel, setRidePopUpPanel] = useState(false);
  const [confirmRidePopUpPanel, setConfirmRidePopUpPanel] = useState(false);
  const ridePopUpRef = useRef();
  const confirmRidePopUpRef = useRef()


  const [ride, setRide] = useState(null)
  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)

  useEffect(() => {
    console.log(captain);
    socket.emit('join', {
      userId: captain._id,
      userType: 'captain'
    })

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {

          socket.emit('update-location-captain', {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude
            }
          })
        })
      }
    }

    const locationInterval = setInterval(updateLocation, 10000)
    updateLocation()

    return () => clearInterval(locationInterval)
  }, [])

  socket.on('new-ride', (data) => {
    console.log("new-ride-data", data);
    if (captain.vehicle.vehicleType === data.vehicleType) {
      setRide(data)
      setRidePopUpPanel(true)
    }
  })

  async function confirmRide() {

    console.log("confirm-ride-called");

    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {

      rideId: ride._id,
      captainId: captain._id,


    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })

    setRidePopUpPanel(false)
    setConfirmRidePopUpPanel(true)

  }


  useGSAP(() => {
    if (ridePopUpPanel) {
      gsap.to(ridePopUpRef.current, {
        transform: "translateY(0%)",
        opacity: 1
      })
    } else {
      gsap.to(ridePopUpRef.current, {
        transform: "translateY(100%)",
        opacity: 0
      })
    }
  }, [ridePopUpPanel])

  useGSAP(() => {
    if (confirmRidePopUpPanel) {
      gsap.to(confirmRidePopUpRef.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(confirmRidePopUpRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [confirmRidePopUpPanel])
  return (
    <div className="h-screen ">
      <div className="h-[50%]">
        <LiveTracking />
      </div>
      <div className="fixed bottom-0 h-[46%] w-screen  lg:ml-6 bg-white ">
        <CaptainDetail />
      </div>
      <div ref={ridePopUpRef} className=" fixed bottom-0 bg-white w-screen h-[48%] lg:ml-6 mb-8 translate-y-full">
        <RidePopUp setRidePopUpPanel={setRidePopUpPanel} ride={ride} confirmRide={confirmRide} setConfirmRidePopUpPanel={setConfirmRidePopUpPanel} />
      </div>
      <div ref={confirmRidePopUpRef} className="h-screen fixed bottom-0 bg-white w-screen  lg:ml-6 translate-y-full">
        <ConfirmRidePopUp setConfirmRidePopUpPanel={setConfirmRidePopUpPanel} ride={ride} setRidePopUpPanel={setRidePopUpPanel} />
      </div>

    </div>
  )
}

export default CaptainHome
