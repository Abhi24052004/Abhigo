import React, { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import { SocketContext } from '../context/SocketContext'
import axios from 'axios'

/* Simple bottom sheet component */
const BottomSheet = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-white rounded-t-xl shadow-xl p-4"
        style={{ maxHeight: '75vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title || 'Upcoming Events'}</h3>
          <button onClick={onClose} className="text-sm text-gray-600 px-2 py-1 rounded hover:bg-gray-100">Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

/* Modal for viewing single event details */
const DetailModal = ({ open, onClose, event, startEvent, formatDateDMY }) => {
  if (!open || !event) return null

  const pickup = event?.pickup ?? event?.pickupAddress ?? event?.pickup_location ?? event?.startAddress ?? 'Not provided'
  const destination = event?.destination ?? event?.dropoff ?? event?.to ?? event?.endAddress ?? 'Not provided'

  const username =
    event?.user?.FullName?.FirstName
      ? `${event.user.FullName.FirstName} ${event.user.FullName.LastName ?? ''}`.trim()
      : event?.user?.FullName?.firstname ?? event?.user?.Email ?? event?.user?.email ?? 'Rider'

  const price = event?.fare ?? event?.price ?? event?.amount ?? event?.estimatedFare ?? null
  const specialReq = event?.specialRequest ?? event?.specialReq ?? event?.notes ?? event?.instructions ?? ''

  const dateRaw = event?.eventDateTime ?? event?.date ?? event?.scheduledAt ?? event?.datetime ?? null
  const dt = dateRaw ? new Date(dateRaw) : null
  const dateStr = dt ? formatDateDMY(dt) : 'Date TBD'
  const timeStr = dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'

  const isEventToday = dt ? (() => {
    const now = new Date()
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate()
  })() : false

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-5 mx-4">
        <div className="mb-3">
          <h2 className="text-xl font-bold">Event Details</h2>
          <p className="text-sm text-gray-500 mt-1">{event?.title ?? event?.name ?? 'Event'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">User</div>
            <div className="text-sm font-medium">{username}</div>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm text-right">
            <div className="text-xs text-gray-500">Price</div>
            <div className="text-sm font-medium text-amber-600">{price != null ? `₹${price}` : '—'}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500">Date & Time</div>
            <div className="text-sm font-medium">{dateStr} · {timeStr}</div>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Pickup</div>
            <div className="text-sm font-medium break-words">{pickup}</div>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Destination</div>
            <div className="text-sm font-medium break-words">{destination}</div>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Special Requirements</div>
            <div className="text-sm">{specialReq ? specialReq : <span className="text-gray-400">None</span>}</div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          {isEventToday ? (
            <>
              <button onClick={onClose} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-md font-medium shadow-sm hover:bg-amber-100">Close</button>
              <button onClick={startEvent} className="px-4 py-2 bg-green-500 text-white rounded-md font-medium shadow-sm hover:bg-green-600">Start</button>
            </>
          ) : (
            <button onClick={onClose} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-md font-medium shadow-sm hover:bg-amber-100">Close</button>
          )}
        </div>
      </div>
    </div>
  )
}

const CaptainDetails = (props) => {
  const { captain } = useContext(CaptainDataContext)
  const { socket } = useContext(SocketContext)
  const [allEvent, setAllEvent] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [eventsError, setEventsError] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState({})
  const controllerRef = useRef(null)

  // fetch function (callable for retry and on-demand)
  const fetchCaptainEvents = useCallback(async () => {
    if (!captain?._id) return
    // abort any previous request
    try {
      controllerRef.current?.abort()
    } catch (e) {
      // ignore
    }
    const controller = new AbortController()
    controllerRef.current = controller

    setLoadingEvents(true)
    setEventsError(null)

    const url = `${import.meta.env.VITE_BASE_URL}/rides/captainEvent`
    try {
      const res = await axios.get(url, {
        params: { captainId: captain._id },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        signal: controller.signal
      })

      const payload = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
      setAllEvent(payload)
    } catch (err) {
      // axios in modern versions throws a CanceledError when aborted (code: 'ERR_CANCELED')
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError'
      if (isCanceled) {
        // request was cancelled: ignore
        return
      }
      console.error('Failed fetching captain events', {
        error: err,
        url,
        captainId: captain._id,
      })
      // Prefer backend message if present
      const message = err?.response?.data?.message || err?.response?.data || err?.message || 'Unknown error'
      setEventsError(`${message}`)
      setAllEvent([])
    } finally {
      setLoadingEvents(false)
    }
  }, [captain?._id])

  // initial load when captain id becomes available
  useEffect(() => {
    if (!captain?._id) return
    fetchCaptainEvents()
    return () => {
      try {
        controllerRef.current?.abort()
      } catch (e) {
        //
      }
    }
  }, [captain?._id, fetchCaptainEvents])

  // also fetch when sheet opens so user can retry and see fresh data
  useEffect(() => {
    if (sheetOpen) {
      fetchCaptainEvents()
    }
  }, [sheetOpen, fetchCaptainEvents])

  // Safe name getters (captain)
  const firstName = captain?.fullname?.firstname || captain?.FullName?.FirstName || ''
  const lastName = captain?.fullname?.lastname || captain?.FullName?.LastName || ''

  const formatDateDMY = (dateObj) => {
    if (!dateObj) return 'Date TBD'
    const d = dateObj.getDate().toString().padStart(2, '0')
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0')
    const y = dateObj.getFullYear()
    return `${d}/${m}/${y}`
  }

  const upcomingEvents = useMemo(() => {
    const source = Array.isArray(allEvent) && allEvent.length > 0 ? allEvent : (captain?.events ? captain.events : (captain?.event ? [captain.event] : []))
    const normalized = source
      .filter(Boolean)
      .map((ev) => {
        const dateRaw = ev?.eventDateTime ?? ev?.date ?? ev?.scheduledAt ?? ev?.datetime ?? ev?.startsAt ?? ev?.start ?? null
        const parsed = dateRaw ? new Date(dateRaw) : null
        return { ev, dateRaw, parsed }
      })
      .sort((a, b) => {
        const ta = a.parsed ? a.parsed.getTime() : Infinity
        const tb = b.parsed ? b.parsed.getTime() : Infinity
        return ta - tb
      })
      .map((x) => x.ev)
    return normalized
  }, [allEvent, captain])

  const primaryEvent = useMemo(() => (upcomingEvents && upcomingEvents.length ? upcomingEvents[0] : null), [upcomingEvents])

  const isPrimaryEventToday = useMemo(() => {
    if (!primaryEvent) return false
    const d = primaryEvent?.eventDateTime ?? primaryEvent?.date ?? primaryEvent?.scheduledAt ?? primaryEvent?.datetime
    if (!d) return false
    const ev = new Date(d)
    const now = new Date()
    return ev.getFullYear() === now.getFullYear() && ev.getMonth() === now.getMonth() && ev.getDate() === now.getDate()
  }, [primaryEvent])

  const bannerEvent = isPrimaryEventToday ? primaryEvent : null

  const hasAnyNonTodayEvent = useMemo(() => {
    if (!Array.isArray(upcomingEvents) || upcomingEvents.length === 0) return false
    const now = new Date()
    return upcomingEvents.some((ev) => {
      const d = ev?.eventDateTime ?? ev?.date ?? ev?.scheduledAt ?? ev?.datetime ?? null
      if (!d) return true
      const evDate = new Date(d)
      return !(evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === now.getMonth() && evDate.getDate() === now.getDate())
    })
  }, [upcomingEvents])

  // handlers
  const openDetail = (ev) => {
    setSelectedEvent(ev)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedEvent(null)
  }

  const startEvent = async () => {
    try {
      const eventId = selectedEvent?._id
      const captainId = captain?._id
      const userId = selectedEvent?.user?._id || selectedEvent?.user || null
      if (!eventId || !captainId || !userId) {
        console.warn('Missing ids for startEvent', { eventId, captainId, userId })
      }

      await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/startEventRide`, {
        eventId,
        captainId,
        userId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      setDetailOpen(false)
      props.setRide(selectedEvent)
      props.setArrivedPopUpPanel(true)
      setSelectedEvent(null)

      if (socket && eventId && captainId) {
        socket.emit('join-event', { rideId: eventId, userId: captainId, userType: 'captain' })
      }
    } catch (err) {
      console.error('Failed to start event ride:', err?.response?.data || err?.message)
    }
  }

  const dateDisplay = (raw) => {
    if (!raw) return 'Date TBD'
    const d = new Date(raw)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  }

  return (
    <div className="p-4 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-amber-200 shadow-sm">
              <img
                className="w-10 h-10object-cover"
                src={captain?.avatar || 'https://shorturl.at/srJPR'}
                alt={firstName || 'Captain'}
              />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <h4 className="text-lg font-semibold capitalize truncate">{(firstName + ' ' + lastName).trim() || 'Your Captain'}</h4>
            <p className="text-sm text-gray-500 truncate">{captain?.vehicle?.vehicleType ? captain.vehicle.vehicleType.toUpperCase() : 'No vehicle info'}</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <h4 className="text-xl font-semibold">₹{(captain?.balance || 0).toFixed(2)}</h4>
          <p className="text-sm text-gray-500">Earned</p>
        </div>
      </div>

      <div className="flex gap-4 p-3 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-inner items-start overflow-hidden">
        <div className="flex-1 grid grid-cols-3 gap-2 text-center min-w-0">
          <div className="bg-white/60 p-3 rounded-lg shadow-sm">
            <i className="ri-timer-2-line text-2xl text-amber-500 block mb-1"></i>
            <h5 className="text-lg font-medium">{captain?.hoursOnline ?? '—'}</h5>
            <p className="text-xs text-gray-500">Hours Online</p>
          </div>
          <div className="bg-white/60 p-3 rounded-lg shadow-sm">
            <i className="ri-speed-up-line text-2xl text-amber-500 block mb-1"></i>
            <h5 className="text-lg font-medium">{captain?.ridesCompleted ?? '—'}</h5>
            <p className="text-xs text-gray-500">Rides</p>
          </div>
          <div className="bg-white/60 p-3 rounded-lg shadow-sm">
            <i className="ri-star-line text-2xl text-amber-500 block mb-1"></i>
            <h5 className="text-lg font-medium">{captain?.rating ?? '—'}</h5>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>
      </div>

      {bannerEvent ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 animate-bounce">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-600">⚠️ You have an event TODAY!</span>
          </div>

          <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-amber-400">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 opacity-95"></div>

            <div className="relative p-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm animate-pulse">
                  <i className="ri-calendar-event-line text-2xl text-white"></i>
                </div>
              </div>

              <div className="flex-1 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-bold">{bannerEvent?.title ?? bannerEvent?.name ?? 'Special Event'}</h4>
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">TODAY</span>
                </div>
                <p className="text-sm opacity-90 mt-1">{bannerEvent?.shortDesc ?? bannerEvent?.description ?? 'You are scheduled for an event.'}</p>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  { (bannerEvent?.eventDateTime ?? bannerEvent?.date) && <span className="text-xs bg-white/20 px-2 py-1 rounded font-semibold">🕒 {new Date(bannerEvent?.eventDateTime ?? bannerEvent?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> }
                  { bannerEvent?.location && <span className="text-xs bg-white/20 px-2 py-1 rounded">📍 {bannerEvent.location}</span> }
                  { bannerEvent?.reward && <span className="text-xs bg-green-500 px-2 py-1 rounded font-bold">💰 Bonus ₹{bannerEvent.reward}</span> }
                </div>
              </div>

              <div className="flex-shrink-0">
                <button onClick={() => openDetail(bannerEvent)} className="px-3 py-2 bg-white text-amber-600 font-semibold rounded-lg shadow hover:scale-105 transition-transform">View Details</button>
              </div>
            </div>

            <svg className="absolute right-0 bottom-0 opacity-20 w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M0 100 L100 0 L100 100 Z" fill="white" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-white to-amber-50 shadow-sm flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium">{upcomingEvents.length > 0 ? 'You have upcoming events' : 'No active events'}</h5>
            <p className="text-xs text-gray-500">
              {upcomingEvents.length > 0 ? 'Open Upcoming Events to view them.' : "You're free to accept rides. Keep the app online to receive offers."}
            </p>
          </div>

          <button onClick={() => setSheetOpen(true)} className="px-3 py-2 bg-amber-300 text-black font-semibold rounded-lg shadow hover:brightness-105">Upcoming Events</button>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Upcoming Events">
        {loadingEvents ? (
          <div className="p-3 rounded-lg bg-white/60 text-sm text-gray-600">Loading events...</div>
        ) : eventsError ? (
          <div className="p-3 space-y-3">
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              Error loading events: {eventsError}
            </div>
            <div className="flex gap-2">
              <button onClick={() => fetchCaptainEvents()} className="px-3 py-2 bg-amber-300 rounded-md font-semibold">Retry</button>
              <button onClick={() => { setSheetOpen(false); }} className="px-3 py-2 bg-white border rounded-md">Close</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Open DevTools → Network to inspect the request URL and response.</div>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="p-3 rounded-lg bg-white/60 text-sm text-gray-600">No upcoming events.</div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((ev, idx) => {
              const title = ev?.title ?? ev?.name ?? ev?.eventName ?? 'Event'
              const dateRaw = ev?.eventDateTime ?? ev?.date ?? ev?.scheduledAt ?? ev?.datetime ?? null
              const dateLabel = dateDisplay(dateRaw)
              const id = ev?._id ?? ev?.id ?? ev?.eventId ?? `ev-${idx}`

              return (
                <div key={id} className="mb-2">
                  <div className="p-3 bg-white rounded-lg shadow-sm flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-xs text-gray-500 mt-1">{dateLabel}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <button onClick={() => openDetail(ev)} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md text-sm font-medium shadow-sm hover:brightness-105">View</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </BottomSheet>

      <DetailModal open={detailOpen} onClose={closeDetail} event={selectedEvent} startEvent={startEvent} formatDateDMY={formatDateDMY} />
    </div>
  )
}

export default CaptainDetails
