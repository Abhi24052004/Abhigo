import React, { useMemo } from 'react'

/**
 * Normalize fare into a displayable scalar.
 * Accepts fare shapes:
 *  - number | string -> return directly
 *  - object -> try fare[vehicleType], fare.default, first value
 */
function getFareValue(ride) {
  if (!ride) return null
  const fare = ride?.fare
  const vehicleType = ride?.vehicleType ?? ride?.vehicle?.vehicleType

  if (fare == null) return null

  if (typeof fare === 'number' || typeof fare === 'string') {
    return fare
  }

  if (typeof fare === 'object') {
    if (vehicleType && Object.prototype.hasOwnProperty.call(fare, vehicleType)) {
      return fare[vehicleType]
    }
    if (Object.prototype.hasOwnProperty.call(fare, 'default')) {
      return fare.default
    }
    const vals = Object.values(fare).filter((v) => v != null)
    return vals.length ? vals[0] : null
  }

  return null
}

function RidePopUp(props) {
  const ride = props.ride

  // Defensive: nothing to render if there's no ride
  if (!ride) return null

  // debug log the ride shape once (helps diagnose server variations)
  // remove or comment out in production if noisy
  console.debug('RidePopUp ride payload:', ride)

  const passengerName = useMemo(() => {
    const user = ride?.user
    if (!user) return 'Passenger'
    const fn = user.FullName?.FirstName || user.fullname?.firstname || user.firstName || ''
    const ln = user.FullName?.LastName || user.fullname?.lastname || user.lastName || ''
    const full = `${fn} ${ln}`.trim()
    return full || 'Passenger'
  }, [ride])

  const fareValue = getFareValue(ride)
  const fareDisplay = fareValue != null ? `₹${fareValue}` : '—'

  return (
    <div className="flex flex-col w-[96%] mx-2 -mt-2">
      <div className="flex justify-between my-4 items-center bg-amber-100 rounded-sm px-2 py-2">
        <div className="flex gap-2 items-center">
          <img
            className="h-15 w-15 rounded-full"
            src={ride?.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0'}
            alt="avatar"
          />
          <h4 className="text-base font-bold">{passengerName}</h4>
        </div>
        <div>
          <p className="font-bold">
            <i className="ri-money-rupee-circle-line"></i>{'  '}{fareDisplay}
          </p>
          <p className="text-sm text-gray-500 font-light text-right">2.2KM</p>
        </div>
      </div>

      <div>
        <div className="border-b-2 border-gray-300">
          <h4 className="text-gray-400 text-sm">PICK UP</h4>
          <p className="text-base font-semibold mb-3">{ride?.pickup ?? 'Unknown pickup'}</p>
        </div>
        <div className="border-b-2 border-gray-300 mt-3">
          <h4 className="text-gray-400 text-sm">DROP OFF</h4>
          <p className="text-base font-semibold mb-3">{ride?.destination ?? 'Unknown destination'}</p>
        </div>
      </div>

      <div className="flex justify-end gap-5 mt-2 mb-2 bg-white">
        <button
          className="text-xl text-gray-400 font-semibold"
          onClick={() => props.setRidePopUpPanel(false)}
        >
          Ignore
        </button>
        <button
          className="text-xl text-black bg-amber-300 px-5 py-2 rounded-xl font-semibold"
          onClick={() => {
            // call confirm; it already checks for ride existence
            try {
              const maybePromise = props.confirmRide && props.confirmRide()
              // if confirmRide returns a promise, optionally await it to ensure UI state sync
              if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.then(() => {
                  props.setRidePopUpPanel(false)
                  props.setArrivedPopUpPanel(true)
                }).catch((err) => {
                  console.error('confirmRide failed', err)
                })
              } else {
                props.setRidePopUpPanel(false)
                props.setArrivedPopUpPanel(true)
              }
            } catch (err) {
              console.error(err)
            }
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default RidePopUp
