import React, { useState, useRef, useEffect, useContext } from "react";
import 'remixicon/fonts/remixicon.css'
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import LocationSearchPanel from '../components/LocationSearchPanel';
import LocationSearchPanelEvent from '../components/LocationSearchPanelForEvent';
import Vehicle from '../components/Vehicle';
import EventVehicle from '../components/EventVehicle';
import ConfirmRide from '../components/ConfirmRide';
import EventConfirmRide from '../components/EventConfirmRide'
import LookingForDriver from '../components/LookingForDriver';
import Driver from '../components/Driver';
import axios from "axios";
import { SocketContext } from '../context/SocketContext';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from "react-router-dom";
import LiveTracking from "../components/LiveTracking";
import UserRideDetails from "../components/UserRideDetails";

function HistoryWithPagination({ rideHistory = [], onOpen, statusToButtonLabel }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 3;

  const sourceList = React.useMemo(() => {
    if (currentPage === 3) {
      return rideHistory.filter((r) => !r.isEvent);
    }
    return rideHistory;
  }, [rideHistory, currentPage]);

  const totalItems = sourceList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const start = (currentPage - 1) * pageSize;
  const pagedRides = sourceList.slice(start, start + pageSize);

  const goTo = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(next);
  };

  return (
    <div data-ride-history>
      <div className="flex flex-col gap-3">
        {pagedRides.map((r) => (
          <div key={r._id} className="p-3 border rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{r?.eventDateTime ? "Event" : "Ride"}</div>
              <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <button onClick={() => onOpen(r)} className="bg-amber-50 text-amber-700 px-3 py-2 rounded shadow">
                {statusToButtonLabel(r.status)}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {pagedRides.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, totalItems)} of {totalItems}
        </div>

        {/* Prev / Page indicator / Next (no page number buttons) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`px-3 py-1 rounded ${currentPage <= 1 ? "bg-gray-100 text-gray-400" : "bg-white border"}`}
            aria-label="Previous page"
          >
            Prev
          </button>

          <div className="text-sm text-gray-600 px-3">
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`px-3 py-1 rounded ${currentPage >= totalPages ? "bg-gray-100 text-gray-400" : "bg-white border"}`}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [panelOpen, setPanelOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [confirmEventRidePanel, setConfirmEventRidePanel] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [driverPanel, setDriverPanel] = useState(false)
  const panelRef = useRef();
  const panelCloseRef = useRef(null)
  const [fare, setFare] = useState({})
  const [eventFare, setEventFare] = useState(0)
  const [show, setShow] = useState(false);
  const panelOption = useRef();
  const vehicles = useRef();
  const confirmRidePanelRef = useRef();
  const confirmEventRidePanelRef = useRef();
  const vehicleFoundRef = useRef();
  const driverPanelRef = useRef();
  const [activeField, setActiveField] = useState(null)
  const [eventActiveField, setEventActiveField] = useState(null)
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [eventPickupSuggestions, setEventPickupSuggestions] = useState([])
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [eventDestinationSuggestions, setEventDestinationSuggestions] = useState([])
  const [vehiclePanel, setVehiclePanel] = useState(false)
  const [eventVehiclePanel, setEventVehiclePanel] = useState(false)
  const [ride, setRide] = useState(null);
  const vehiclePanelRef = useRef(null)
  const eventVehiclePanelRef = useRef(null)
  const navigate = useNavigate()
  const submitHandler = (e) => { e.preventDefault(); }

  const { socket } = useContext(SocketContext)
  const { user } = useContext(UserDataContext)

  const [allRides, setAllRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);

  useEffect(() => {
    console.log("WELCOM2");
    if (!user) return;
    socket.emit("join", { userType: "user", userId: user._id })
    async function getRides() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/userRides`, {
          params: { userId: user._id },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        setAllRides(response.data);
      } catch (err) {
      }
    }
    getRides();
  }, [user])

  useEffect(() => {
  }, [user])

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
    }
  }

  const handlePickupChangeForEvent = async (e) => {
    setEventPickup(e.target.value)
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: e.target.value },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setEventPickupSuggestions(response.data)
    } catch {
    }
  }

  socket.on('ride-confirmed', async (ride) => {
    setRide(ride)

    if (!ride.eventDateTime) {

      setVehicleFound(false)
      setDriverPanel(true)
    }
    else {

      setConfirmEventRidePanel(false)
      setEventVehiclePanel(false)
      // await axios.get("https://hooks.zapier.com/hooks/catch/25033038/ur4nxuu",
      //   {
      //     params: { to:ride.captain.email, msg:`You have a new event ride scheduled on ${new Date(ride.eventDateTime).toLocaleString()}. Pickup: ${ride.pickup}, Destination: ${ride.destination}. Please be on time.` },
      //     headers: {
      //       Authorization: `Bearer ${localStorage.getItem('token')}`
      //     }
      //   })
    }
  })

  socket.on('event-ride-started', ride => {
    console.log("event-ride-confirmed-socket", ride);
    setRide(ride)
    // For event rides: do NOT show Driver panel on user side
    setDriverPanel(true)
  })

  socket.on('ride-started', ride => {
    setDriverPanel(false)
    navigate('/riding', { state: { ride } })
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
    }
  }

  const handleDestinationChangeForEvent = async (e) => {
    setEventDestination(e.target.value)
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: e.target.value },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setEventDestinationSuggestions(response.data)
    } catch {
    }
  }
  let [isEvent, setIsEvent] = useState(false)

  async function findTrip() {
    setIsEvent(false)
    setVehiclePanel(true)
    setPanelOpen(false)
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
      params: { pickup, destination, isEvent: false },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    setFare(response.data)
  }

  async function findEventTrip() {
    setIsEvent(true)
    setEventVehiclePanel(true)
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
      params: { eventPickup, eventDestination, isEvent: true },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    setEventFare(response.data)
  }

  async function createRide() {

    await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
      userId: JSON.parse(localStorage.getItem('user'))._id,
      pickup,
      destination,
      vehicleType,
      isEvent,
      eventTime
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
  }

  async function createEventRide() {
    await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
      userId: user._id,
      eventPickup,
      eventDestination,
      isEvent,
      eventTime,
      specialRequest
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
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(confirmRidePanelRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [confirmRidePanel]);

  useGSAP(() => {
    if (confirmEventRidePanel) {
      gsap.to(confirmEventRidePanelRef.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(confirmEventRidePanelRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [confirmEventRidePanel]);

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
    if (eventVehiclePanel) {
      gsap.to(eventVehiclePanelRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(eventVehiclePanelRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [eventVehiclePanel])

  // Normalize fare for LookingForDriver to avoid undefined indexing in production
  const normalizedFare = React.useMemo(() => {
    if (typeof fare === 'number') {
      const key = vehicleType || 'car';
      return { [key]: fare };
    }
    if (fare && typeof fare === 'object') return fare;
    return {};
  }, [fare, vehicleType]);

  useGSAP(function () {
    if (panelOpen) {
      gsap.to(panelRef.current, {
        height: '70%',
        padding: 24
      })
      gsap.to(panelCloseRef.current, {
        opacity: 1
      })
    } else {
      gsap.to(panelRef.current, {
        height: '0%',
        padding: 0
      })
      gsap.to(panelCloseRef.current, {
        opacity: 0
      })
    }
  }, [panelOpen])

  const [showUserPanel, setShowUserPanel] = useState(false)
  const [userTab, setUserTab] = useState('info')
  const userPanelRef = useRef(null)

  useGSAP(() => {
    if (showUserPanel) {
      gsap.to(userPanelRef.current, { transform: 'translateY(0%)' })
    } else {
      gsap.to(userPanelRef.current, { transform: 'translateY(100%)' })
    }
  }, [showUserPanel])

  const [rideHistory, setRideHistory] = useState([])

  useEffect(() => {
    if (!showUserPanel) return
    if (userTab === 'history') {
      setRideHistory(allRides || []);
    }
  }, [showUserPanel, userTab, allRides])

  const [eventPickup, setEventPickup] = useState('');
  const [eventDestination, setEventDestination] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');

  const computeMinMaxDatetimeLocal = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const min = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 30);
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 0);
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return { min: fmt(min), max: fmt(max) };
  };

  const { min: bookingMin, max: bookingMax } = computeMinMaxDatetimeLocal();

  const isEventTimeValid = (isoLocalString) => {
    if (!isoLocalString) return false;
    const selected = new Date(isoLocalString);
    const minDate = new Date(bookingMin);
    const maxDate = new Date(bookingMax);
    return selected >= minDate && selected <= maxDate;
  };

  const handleBookEvent = async (e) => {
    e.preventDefault();
    if (!eventPickup || !eventDestination || !eventTime) {
      alert('Please fill pickup, destination and event time.');
      return;
    }
    if (!isEventTimeValid(eventTime)) {
      alert(`Please choose a date/time between ${bookingMin.replace('T', ' ')} and ${bookingMax.replace('T', ' ')}.`);
      return;
    }
    setShowUserPanel(false);
    await findEventTrip();

  };

  const statusToButtonLabel = (status) => {
    if (!status) return "View";
    const s = String(status).toLowerCase();
    if (s.includes("completed") || s.includes("complete")) return "Completed";
    if (s.includes("ongoing") || s.includes("in_progress") || s.includes("started") || s.includes("active")) return "Ongoing";
    if (s.includes("accepted") || s.includes("assigned")) return "Accepted";
    if (s.includes("pending") || s.includes("requested")) return "Pending";
    if (s.includes("cancel")) return "Cancelled";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getUserDisplayName = (u) => {
    if (!u) return "You";
    const fnObj = u.FullName || u.fullName || u.Fullname;
    if (fnObj) {
      const first = fnObj.FirstName ?? fnObj.firstname ?? fnObj.first ?? "";
      const last = fnObj.LastName ?? fnObj.lastname ?? fnObj.last ?? "";
      const full = `${first} ${last}`.trim();
      if (full) return full;
    }
    const email = u.Email ?? u.email ?? "";
    if (email) return String(email).split("@")[0];
    return u._id ? `User-${String(u._id).slice(0, 6)}` : "You";
  };

  return (
    <div className='h-screen relative overflow-hidden'>
      <div className="h-screen w-screen"><LiveTracking ride={ride} /></div>

      <button onClick={() => setShowUserPanel(true)} className="fixed right-5 bottom-6 z-50 flex items-center gap-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white px-3 py-2 rounded-full shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-200" title="Open profile" aria-label="Open profile">
        <div className="relative">
          <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName(user))}&background=fff&color=000`} alt="user" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
          <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full ring-2 ring-white animate-pulse" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-sm font-semibold leading-tight">{getUserDisplayName(user).split(' ')[0]}</span>
          <span className="text-xs opacity-80">View profile</span>
        </div>
      </button>

      <div ref={userPanelRef} className="fixed left-0 right-0 bottom-0 z-60 translate-y-full bg-white rounded-t-2xl shadow-2xl p-4" style={{ transform: 'translateY(100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName(user))}`} alt="avatar" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold">{getUserDisplayName(user)}</div>
              <div className="text-sm text-gray-500">
                {user?.Email ?? ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUserPanel(false)} className="p-2 rounded-full bg-gray-100" title="Close">
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setUserTab('info')} className={`flex-1 py-2 rounded-lg ${userTab === 'info' ? 'bg-black text-white' : 'bg-gray-100'}`}>Profile</button>
          <button onClick={() => setUserTab('book')} className={`flex-1 py-2 rounded-lg ${userTab === 'book' ? 'bg-black text-white' : 'bg-gray-100'}`}>Book for Event</button>
          <button onClick={() => setUserTab('history')} className={`flex-1 py-2 rounded-lg ${userTab === 'history' ? 'bg-black text-white' : 'bg-gray-100'}`}>Ride History</button>
        </div>

        <div className="min-h-[180px]">
          {userTab === 'info' && (
            <div>
              <h4 className="font-semibold mb-2">Account details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-400">Full name</div>
                  <div>{getUserDisplayName(user) || '-'}</div>
                </div>
                <div>
                  {/* <div className="text-xs text-gray-400">Phone</div>
                  <div>{user?.phone ?? '-'}</div> */}
                </div>
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div>{user?.Email ?? user?.email ?? '-'}</div>
                </div>
                <div>
                  {/* <div className="text-xs text-gray-400">Joined</div>
                  <div>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</div> */}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg">Edit Profile</button>
                <button className="flex-1 bg-red-500 text-white py-2 rounded-lg" onClick={() => { navigate('/user/logout'); }}>Logout</button>
              </div>
            </div>
          )}

          {userTab === 'book' && (
            <div>
              <h4 className="font-semibold mb-2">Book for an event</h4>
              <p className="text-sm text-gray-600 mb-3">Quickly request a vehicle for a scheduled event.</p>
              <form onSubmit={handleBookEvent} className="grid gap-2">
                <div className="relative">
                  <input onClick={() => { setEventActiveField('pickup') }} value={eventPickup} onChange={handlePickupChangeForEvent} placeholder="Pickup address" className="border p-2 rounded w-full" required autoComplete="off" />
                  {eventActiveField === 'pickup' && <LocationSearchPanelEvent suggestions={eventPickupSuggestions} setPickup={setEventPickup} setDestination={setEventDestination} activeField={'pickup'} onClose={() => setEventActiveField(null)} absolute={true} />}
                </div>
                <div className="relative mt-2">
                  <input onClick={() => { setEventActiveField('destination') }} value={eventDestination} onChange={handleDestinationChangeForEvent} placeholder="Destination address" className="border p-2 rounded w-full" required autoComplete="off" />
                  {eventActiveField === 'destination' && <LocationSearchPanelEvent suggestions={eventDestinationSuggestions} setPickup={setEventPickup} setDestination={setEventDestination} activeField={'destination'} onClose={() => setEventActiveField(null)} absolute={true} />}
                </div>
                <label className="text-xs text-gray-500">Select date & time</label>
                <input type="datetime-local" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="border p-2 rounded" required min={bookingMin} max={bookingMax} />
                <textarea value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} placeholder="Special request (e.g., Need flower decoration, music preference...)" className="border p-2 rounded h-24" />
                <div className="flex gap-2">
                  <button type="submit" className="bg-black text-white py-2 rounded-lg mt-2 flex-1">Book Event Ride</button>
                  <button type="button" onClick={() => { setEventPickup(''); setEventDestination(''); setEventTime(''); setSpecialRequest(''); }} className="bg-gray-200 py-2 rounded-lg mt-2 flex-1">Clear</button>
                </div>
              </form>
            </div>
          )}

          {userTab === 'history' && (
            <div>
              <h4 className="font-semibold mb-2">Your recent rides</h4>
              {rideHistory.length === 0 ? (
                <div className="text-sm text-gray-500">No rides found.</div>
              ) : (
                <HistoryWithPagination rideHistory={rideHistory} onOpen={(r) => setSelectedRide(r)} statusToButtonLabel={statusToButtonLabel} />
              )}
            </div>
          )}
        </div>
      </div>

      {selectedRide && <UserRideDetails ride={selectedRide} allRides={allRides} onClose={() => setSelectedRide(null)} />}

      <div className=" flex flex-col justify-end h-screen absolute top-0 w-full " >
        <div className="h-[30%] w-full bg-white  relative ">
          <h5 ref={panelCloseRef} onClick={() => { setPanelOpen(false) }} className='absolute opacity-0 right-6 top-6 text-2xl'><i className="ri-arrow-down-wide-line"></i></h5>
          <h4 className='font-semibold text-2xl my-3 mx-2'>Find a trip</h4>
          <form className="relative" onSubmit={(e) => { submitHandler(e) }}>
            <div className="line absolute top-[15%] left-6 h-16 w-1 bg-gray-700"></div>
            <input onClick={() => { setPanelOpen(true); setActiveField('pickup'); setShow(true); }} value={pickup} onChange={handlePickupChange} className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full' type="text" placeholder='Add a pick-up location' />
            <input onClick={() => { setPanelOpen(true); setActiveField('destination'); setShow(true); }} value={destination} onChange={handleDestinationChange} className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full  mt-3' type="text" placeholder='Enter your destination' />
            <button type="submit" onClick={findTrip} className="flex items-center justify-center bg-black p-2 text-amber-50 text-base rounded-lg mx-4 my-2 w-[93%]">See Prices</button>
          </form>
        </div>

        <div ref={panelRef} className='bg-white h-0 z-2 '>
          <LocationSearchPanel suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions} setPanelOpen={setPanelOpen} setVehiclePanel={setVehiclePanel} setPickup={setPickup} setDestination={setDestination} activeField={activeField} show={show} setShow={setShow} />
        </div>
      </div>

      <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
        <Vehicle selectVehicle={setVehicleType} fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
      </div>

      <div ref={eventVehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
        <EventVehicle fare={eventFare} setConfirmEventRidePanel={setConfirmEventRidePanel} setEventVehiclePanel={setEventVehiclePanel} />
      </div>

      <div ref={confirmEventRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <EventConfirmRide createEventRide={createEventRide} pickup={eventPickup} destination={eventDestination} eventFare={eventFare} setConfirmEventRidePanel={setConfirmEventRidePanel} />
      </div>

      <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <ConfirmRide createRide={createRide} pickup={pickup} destination={destination} fare={fare} vehicleType={vehicleType} setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
      </div>

      <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <LookingForDriver createRide={createRide} pickup={pickup} destination={destination} fare={normalizedFare} vehicleType={vehicleType} setVehicleFound={setVehicleFound} />
      </div>

      <div ref={driverPanelRef} className='fixed w-full  z-10 bottom-0  bg-white px-3 py-6 pt-12'>
        <Driver ride={ride} setVehicleFound={setVehicleFound} setWaitingForDriver={setDriverPanel} waitingForDriver={driverPanel} />
      </div>
    </div>
  )
}
