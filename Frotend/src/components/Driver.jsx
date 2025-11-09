import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import LiveTracking from '../components/updatedLiveTracking'
import { SocketContext } from '../context/SocketContext'


const VEHICLE_IMAGES = {
  car: 'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg',
  moto: 'https://shorturl.at/5zCIa',
  auto: 'https://shorturl.at/B2YCj',
};

const Driver = (props) => {


  const vehicle = props?.ride?.captain?.vehicle?.vehicleType || 'car';
  const link = VEHICLE_IMAGES[vehicle] || VEHICLE_IMAGES.car;

  const [isUser, setIsUser] = useState(true);
  const { socket } = useContext(SocketContext)

  const rideId = props?.ride?._id
  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  }, [])
  const userId = userData?._id

  // chat state
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const [joined, setJoined] = useState(false)

  // auto-scroll messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, showChat])

  // join ride/event room (user side) and listen for messages
  useEffect(() => {
    if (!socket || !rideId || !userId) return
    const onJoined = (payload) => {
      if (payload?.rideId !== rideId) return
      setJoined(true)
    }
    const onMessage = (payload) => {
      if (payload?.rideId !== rideId) return
      setMessages((prev) => {
        // de-dupe optimistic self message by matching sender, text and close timestamp
        if (payload?.from === 'user') {
          const exists = prev.some((m) => m.from === 'user' && m.text === payload.text && Math.abs((payload.ts || 0) - (m.ts || 0)) < 3000)
          if (exists) return prev
        }
        return [...prev, payload]
      })
    }
    const onError = (err) => {
      // Helpful to see auth/membership issues from server
      // eslint-disable-next-line no-console
      console.log('socket error:', err)
      if (err && err.message === 'Use join-event for event ride') {
        // fallback to event join
        socket.emit('join-event', { rideId, userId, userType: 'user' })
      }
    }
    const isEvent = Boolean(props?.ride?.eventDateTime)
    socket.emit(isEvent ? 'join-event' : 'join-ride', { rideId, userId, userType: 'user' })
    socket.on('joined-ride', onJoined)
    socket.on('joined-event', onJoined)
    socket.on('ride-message', onMessage)
    socket.on('error', onError)
    return () => {
      socket.off('joined-ride', onJoined)
      socket.off('joined-event', onJoined)
      socket.off('ride-message', onMessage)
      socket.off('error', onError)
    }
  }, [socket, rideId, userId, props?.ride?.eventDateTime])

  const sendMessage = () => {
    const trimmed = text.trim()
    if (!trimmed || !socket || !rideId || !userId || !joined) return
    const now = Date.now()
    const payload = { rideId, userId, userType: 'user', text: trimmed }
    // Optimistic append for immediate UX; server echo will be de-duped in onMessage
    setMessages((prev) => [...prev, { rideId, from: 'user', userId, text: trimmed, ts: now }])
    socket.emit('ride-message', payload)
    setText('')
  }
  return (
    <div className='h-screen'>
      {/* Top half: live map tracking (same as Riding.jsx) */}
      <div className="h-[6%]"></div>
      <div className='h-[47%]'>
        <LiveTracking ride={props.ride} User={isUser} />
      </div>

      {/* Bottom half: driver/details (keep original styling but ensure scroll on small screens) */}
      <div className='h-[47%] p-4 overflow-auto'>
        <div className='flex items-center justify-between'>
          <img className='h-12' src={link} alt="" />
          <div className='text-right'>
            <h2 className='text-lg font-medium capitalize break-words'>{props.ride?.captain.fullname.firstname}</h2>
            <h4 className='text-xl font-semibold -mt-1 -mb-1 break-words'>{props.ride?.captain.vehicle.plate}</h4>
            {/* <p className='text-sm text-gray-600'>Maruti Suzuki Alto</p> */}
            <h1 className='text-lg font-semibold'>  {props.ride?.otp} </h1>
          </div>
        </div>

        <div className='flex gap-2 justify-between flex-col items-center'>
          <div className='w-full mt-5'>

            <div className='flex items-center gap-5 p-3 border-b-2'>
              <i className="text-lg ri-map-pin-user-fill"></i>
              <div>
                <h3 className='text-lg font-medium'></h3>
                <p className='text-sm -mt-1 text-gray-600 break-words'>{props.ride?.pickup}</p>
              </div>
            </div>
            <div className='flex items-center gap-5 p-3 border-b-2'>
              <i className="ri-map-pin-2-fill text-lg"></i>
              <div>
                <h3 className='text-lg font-medium'></h3>
                <p className='text-sm -mt-1 text-gray-600 break-words'>{props.ride?.destination}</p>
              </div>
            </div>
            <div className='flex items-center gap-5 p-3'>
              <i className="ri-currency-line text-lg"></i>
              <div>
                <h3 className='text-lg font-medium'>₹{props.ride?.fare} </h3>
                <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        onClick={() => setShowChat((s) => !s)}
        className='fixed bottom-24 right-4 h-12 w-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center'
        title='Chat'
      >
        <i className='ri-chat-3-line text-xl'></i>
      </button>

      {/* Chat panel */}
      {showChat && (
        <div className='fixed bottom-40 right-4 w-80 max-w-[92vw] bg-white shadow-xl rounded-xl border border-gray-200 flex flex-col overflow-hidden'>
          <div className='px-3 py-2 bg-black text-white text-sm font-medium flex items-center justify-between'>
            <span>Ride Chat</span>
            <button onClick={() => setShowChat(false)} className='text-white/80 hover:text-white'>
              <i className='ri-close-line'></i>
            </button>
          </div>
          <div ref={listRef} className='p-3 h-64 overflow-y-auto bg-gray-50/50'>
            {messages.length === 0 && (
              <p className='text-sm text-gray-500 text-center mt-6'>No messages yet</p>
            )}
            {messages.map((m, idx) => {
              const mine = m.from === 'user'
              return (
                <div key={idx} className={`mb-2 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-amber-500 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                    <div className='break-words'>{m.text}</div>
                    <div className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-gray-500'}`}>{new Date(m.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className='p-2 bg-white border-t flex gap-2 items-center'>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
              placeholder='Type a message'
              className='flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-amber-400'
            />
            <button onClick={sendMessage} disabled={!joined || text.trim() === ''} className={`px-3 py-2 rounded-lg text-sm ${(!joined || text.trim() === '') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-amber-500 text-white'}`}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Driver
