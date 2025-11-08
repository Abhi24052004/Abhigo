import React, { useEffect, useState } from 'react'

/** reuse same normalization logic for fare */
function getFareValue(ride) {
  if (!ride) return null
  const fare = ride?.fare
  const vehicleType = ride?.vehicleType ?? ride?.vehicle?.vehicleType

  if (fare == null) return null
  if (typeof fare === 'number' || typeof fare === 'string') return fare
  if (typeof fare === 'object') {
    if (vehicleType && Object.prototype.hasOwnProperty.call(fare, vehicleType)) return fare[vehicleType]
    if (Object.prototype.hasOwnProperty.call(fare, 'default')) return fare.default
    const vals = Object.values(fare).filter((v) => v != null)
    return vals.length ? vals[0] : null
  }
  return null
}

function EventRidePopUp(props) {
  const ride = props.ride
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    const dateTime = ride?.eventDateTime
    if (dateTime) {
      const d = new Date(dateTime)
      setDate(d.toLocaleDateString('en-GB'))
      setTime(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } else {
      setDate('')
      setTime('')
    }
  }, [ride])

  if (!ride) return null

  // defensive passenger name
  const passengerName = (() => {
    const user = ride?.user
    if (!user) return 'Passenger'
    const fn = user.FullName?.FirstName || user.fullname?.firstname || user.firstName || ''
    const ln = user.FullName?.LastName || user.fullname?.lastname || user.lastName || ''
    const full = `${fn} ${ln}`.trim()
    return full || 'Passenger'
  })()

  const fareValue = getFareValue(ride)
  const fareDisplay = fareValue != null ? `₹${fareValue}` : '—'

  // debug shape
  console.debug('EventRidePopUp payload:', ride)

  return (
    <div className="flex flex-col w-[96%] mx-2 -mt-3 ">
      <div className="flex justify-between my-4 items-center bg-amber-100 rounded-sm px-2 py-2">
        <div className="flex gap-2 items-center">
          <img
            className="h-15 w-15 rounded-full"
            src={ride?.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&q=60&w=3000'}
            alt=""
          />
          <h4 className="text-base font-bold">{passengerName}</h4>
        </div>
        <div>
          <p className="font-bold">
            <i className="ri-money-rupee-circle-line"></i>{' '}{fareDisplay}
          </p>
          <p className="text-sm text-gray-500 font-light text-right">2.2KM</p>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[30vh]">
        <div className="border-b-2 border-gray-300">
          <h4 className="text-gray-400 text-sm">PICK UP</h4>
          <p className="text-base font-semibold mb-3">{ride?.pickup ?? 'Unknown pickup'}</p>
        </div>

        <div className="border-b-2 border-gray-300 mt-3">
          <h4 className="text-gray-400 text-sm">DROP OFF</h4>
          <p className="text-base font-semibold mb-3">{ride?.destination ?? 'Unknown destination'}</p>
        </div>

        <div className="border-b-2 border-gray-300 mt-3">
          <h4 className="text-gray-400 text-sm">EVENT DATE</h4>
          <p className="text-base font-semibold mb-3">{date || 'N/A'}</p>
        </div>

        <div className="border-b-2 border-gray-300 mt-3">
          <h4 className="text-gray-400 text-sm">EVENT TIME</h4>
          <p className="text-base font-semibold mb-3">{time || 'N/A'}</p>
        </div>

        <div className="border-b-2 border-gray-300 mt-3">
          <h4 className="text-gray-400 text-sm">REQUEST</h4>
          <p className="text-base font-semibold mb-3">{ride?.specialRequest ?? ride?.notes ?? 'None'}</p>
        </div>
      </div>

      <div className="flex justify-end gap-5 mt-2 mb-2 bg-white">
        <button className="text-xl text-gray-400 font-semibold" onClick={() => props.setEventRidePopUpPanel(false)}> Ignore</button>
        <button className="text-xl text-black bg-amber-300 px-5 py-2 rounded-xl font-semibold" onClick={() => {
          try {
            const maybePromise = props.confirmEventRide && props.confirmEventRide()
            if (maybePromise && typeof maybePromise.then === 'function') {
              maybePromise.then(() => props.setEventRidePopUpPanel(false)).catch((e) => console.error(e))
            } else {
              props.setEventRidePopUpPanel(false)
            }
          } catch (err) {
            console.error(err)
          }
        }}> Accept Event</button>
      </div>
    </div>
  )
}

export default EventRidePopUp
