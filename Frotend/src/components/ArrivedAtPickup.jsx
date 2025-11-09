import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import LiveTracking from '../components/updatedLiveTracking'
import { SocketContext } from '../context/SocketContext'

function ArrivedAtPickup(props) {
    const [isUser,setIsUser]=useState(false);
    const { socket } = useContext(SocketContext)

    const rideId = props?.ride?._id
    const captainData = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('captain') || 'null') } catch { return null }
    }, [])
    const captainId = captainData?._id

    // chat state
    const [showChat, setShowChat] = useState(false)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [joined, setJoined] = useState(false)
    const listRef = useRef(null)
    // Track sent/seen message ids to avoid duplicates from server echo
    const seenIdsRef = useRef(new Set())

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages, showChat])

    useEffect(() => {
        if (!socket || !rideId || !captainId) return
        const onJoined = (payload) => {
            // Mark joined if payload is missing (server emits no payload) or rideId matches
            if (!payload || !payload.rideId || payload.rideId === rideId) {
                setJoined(true)
            }
        }
        const onMessage = (payload) => {
            if (payload?.rideId !== rideId) return
            const mid = payload?.messageId || `${payload?.userId || ''}:${payload?.text || ''}:${payload?.ts || ''}`
            if (mid && seenIdsRef.current.has(mid)) return
            if (mid) seenIdsRef.current.add(mid)
            setMessages((prev) => [...prev, payload])
        }
        const onError = (err) => {
            // eslint-disable-next-line no-console
            console.log('socket error:', err)
            if (err && err.message === 'Use join-event for event ride') {
                socket.emit('join-event', { rideId, userId: captainId, userType: 'captain' })
            }
        }
        const isEvent = Boolean(props?.ride?.eventDateTime)
        const joinEventName = isEvent ? 'join-event' : 'join-ride'
        const joinPayload = { rideId, userId: captainId, userType: 'captain' }
        // Try to join with ack support; some servers may not ack, so also listen to events and retry once
        try {
            socket.emit(joinEventName, joinPayload, (ack) => {
                if (ack === true || ack?.ok || ack?.joined) {
                    setJoined(true)
                }
            })
        } catch {}
        // Retry join once after a short delay if still not joined (handles race conditions)
        const retryTimer = setTimeout(() => {
            if (!joined) {
                socket.emit(joinEventName, joinPayload)
            }
        }, 800)
        socket.on('joined-ride', onJoined)
        socket.on('joined-event', onJoined)
        socket.on('ride-message', onMessage)
        socket.on('error', onError)
        return () => {
            clearTimeout(retryTimer)
            socket.off('joined-ride', onJoined)
            socket.off('joined-event', onJoined)
            socket.off('ride-message', onMessage)
            socket.off('error', onError)
        }
    }, [socket, rideId, captainId, props?.ride?.eventDateTime])

    const sendMessage = () => {
        const trimmed = text.trim()
        if (!trimmed || !socket || !rideId || !captainId) return
        // Ensure room join attempt if not yet joined (defensive)
        if (!joined) {
            const isEvent = Boolean(props?.ride?.eventDateTime)
            socket.emit(isEvent ? 'join-event' : 'join-ride', { rideId, userId: captainId, userType: 'captain' })
        }
        // Send only; rely on server echo to render message (avoids duplicate optimistic + echo)
        socket.emit('ride-message', { rideId, userId: captainId, userType: 'captain', text: trimmed })
        setText('')
    }

    const handleRide=()=>{
        props.setArrivedPopUpPanel(false);
        props.setConfirmRidePopUpPanel(true);
    }
    return (
        <div className='h-screen'>
            {/* Top half: live map tracking (same as Riding.jsx) */}
            <div className="h-[2%]"></div>
            <div className='h-[90%]'>
                <LiveTracking ride={props.ride} User={isUser} />
            </div>
            <div className='fixed bottom-0 w-full bg-white p-4'>
                <button onClick={handleRide} className='w-full mt-2  bg-green-500 text-lg text-white font-semibold p-3 rounded-lg text-center'>Arrived At PickupPoint</button>
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
                            const mine = m.from === 'captain'
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
                        <button onClick={sendMessage} disabled={text.trim()===''} className={`px-3 py-2 rounded-lg text-sm ${(text.trim()==='') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-amber-500 text-white'}`}>Send</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ArrivedAtPickup
