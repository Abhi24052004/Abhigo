import React, { useState, useRef, use } from "react";
import 'remixicon/fonts/remixicon.css'
// import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import LocationSearchPanel from '../components/LocationSearchPanel';
import Vehicle from '../components/Vehicle';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import Driver from '../components/Driver';
import axios from "axios";
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LiveTracking from "../components/LiveTracking";


function Home() {

  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [panelOpen, setPanelOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [driverPanel, setDriverPanel] = useState(false)
  const panelRef = useRef();
  const panelCloseRef = useRef(null)
  const [fare, setFare] = useState({})

  const panelOption = useRef();
  const vehicles = useRef();
  const confirmRidePanelRef = useRef();
  const vehicleFoundRef = useRef();
  const driverPanelRef = useRef();
  const [activeField, setActiveField] = useState(null)
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [vehiclePanel, setVehiclePanel] = useState(false)
  const [ride, setRide] = useState(null);
  const vehiclePanelRef = useRef(null)
  const navigate = useNavigate()
  const submitHandler = (e) => {
    e.preventDefault();

  }


  const { socket } = useContext(SocketContext)
  const { user } = useContext(UserDataContext)

  useEffect(() => {
    console.log("user-detail", user);
    socket.emit("join", { userType: "user", userId: user._id })
  }, [user])

  useEffect(() => {
    console.log(user);
  }, [])

  const handlePickupChange = async (e) => {
    setPickup(e.target.value)

    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: e.target.value },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }

      })

      setPickupSuggestions(response.data)
    } catch {
      // handle error
    }
  }

  socket.on('ride-confirmed', (ride) => {
    console.log("ride-confirmed-received", ride);
    setVehicleFound(false)
    setDriverPanel(true)
    setRide(ride)
  })

  socket.on('ride-started', ride => {
    console.log("ride")
    setDriverPanel(false)
    navigate('/riding', { state: { ride } }) // Updated navigate to include ride data
  })

  const handleDestinationChange = async (e) => {
    setDestination(e.target.value)
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: e.target.value },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setDestinationSuggestions(response.data)
    } catch {
      // handle error
    }
  }

  async function findTrip() {
    setVehiclePanel(true)
    setPanelOpen(false)

    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
      params: { pickup, destination },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })


    setFare(response.data)


  }

  async function createRide() {

    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
      userId: user._id,
      pickup,
      destination,
      vehicleType
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })


  }


  useGSAP(() => {
    if (driverPanel) {
      gsap.to(driverPanelRef.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(driverPanelRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [driverPanel]);

  useGSAP(() => {
    gsap.to(vehicleFoundRef.current, {
      y: vehicleFound ? "0%" : "100%",
      duration: 0.5,
      ease: "power2.inOut"
    });
  }, [vehicleFound]);



  useGSAP(() => {
    if (confirmRidePanel) {
      gsap.to(confirmRidePanelRef.current, {
        // zIndex: 10,
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(confirmRidePanelRef.current, {
        // zIndex: 1,
        transform: "translateY(100%)"
      })
    }
  }, [confirmRidePanel]);
  //
  useGSAP(() => {
    if (vehicleType) {
      gsap.to(vehicles.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(vehicles.current, {
        transform: "translateY(100%)"
      })
    }
  }, [vehicleType]);
  //
  useGSAP(function () {
    if (vehiclePanel) {
      gsap.to(vehiclePanelRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(vehiclePanelRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [vehiclePanel])

  useGSAP(function () {
    if (panelOpen) {
      gsap.to(panelRef.current, {
        height: '70%',
        padding: 24
        // opacity:1
      })
      gsap.to(panelCloseRef.current, {
        opacity: 1
      })
    } else {
      gsap.to(panelRef.current, {
        height: '0%',
        padding: 0
        // opacity:0
      })
      gsap.to(panelCloseRef.current, {
        opacity: 0
      })
    }
  }, [panelOpen])

  return (
    <div className='h-screen relative overflow-hidden'>
      <div className="h-screen w-screen"><LiveTracking /></div>
      <div className=" flex flex-col justify-end h-screen absolute top-0 w-full " >
        <div className="h-[30%] w-full bg-white  relative ">
          <h5 ref={panelCloseRef} onClick={() => {
            setPanelOpen(false)
          }} className='absolute opacity-0 right-6 top-6 text-2xl'>
            <i className="ri-arrow-down-wide-line"></i>
          </h5>          <h4 className='font-semibold text-2xl my-3 mx-2'>Find a trip</h4>
          <form className="relative" onSubmit={(e) => { submitHandler(e) }}>
            <div className="line absolute top-[15%] left-6 h-16 w-1 bg-gray-700"></div>
            <input
              onClick={() => {
                setPanelOpen(true)
                setActiveField('pickup')
              }}
              value={pickup}
              onChange={handlePickupChange}
              className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
              type="text"
              placeholder='Add a pick-up location'
            />
            <input
              onClick={() => {
                setPanelOpen(true)
                setActiveField('destination')
              }}
              value={destination}
              onChange={handleDestinationChange}
              className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full  mt-3'
              type="text"
              placeholder='Enter your destination' />
            <button type="submit" onClick={findTrip} className="flex items-center justify-center bg-black p-2 text-amber-50 text-base rounded-lg mx-4 my-2 w-[93%]">See Prices</button>
          </form>
        </div>
        <div ref={panelRef} className='bg-white h-0 z-2 '>
          <LocationSearchPanel
            suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
            setPanelOpen={setPanelOpen}
            setVehiclePanel={setVehiclePanel}
            setPickup={setPickup}
            setDestination={setDestination}
            activeField={activeField}
          />
        </div>
      </div>

      <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
        <Vehicle
          selectVehicle={setVehicleType}
          fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
      </div>

      <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <ConfirmRide
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}

          setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
      </div>

      <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <LookingForDriver
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setVehicleFound={setVehicleFound} />
      </div>

      <div ref={driverPanelRef} className='fixed w-full  z-10 bottom-0  bg-white px-3 py-6 pt-12'>
        <Driver
          ride={ride}
          setVehicleFound={setVehicleFound}
          setWaitingForDriver={setDriverPanel}
          waitingForDriver={driverPanel} />
      </div>


    </div>
  )
}

export default Home
