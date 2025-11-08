import React from 'react'
import LiveTracking from '../components/updatedLiveTracking'

function ArrivedAtPickup(props) {
  // fixed bottom control height (80px) and ensure map container gets explicit height
  const MAP_CONTAINER_STYLE = { height: 'calc(100vh - 80px)', width: '100%' }

  const [isUser, setIsUser] = React.useState(false)
  const handleRide = () => {
    props.setArrivedPopUpPanel(false)
    props.setConfirmRidePopUpPanel(true)
  }
  return (
    <div className="h-screen w-full flex flex-col">
      <div style={{ height: '2%' }} />

      <div style={MAP_CONTAINER_STYLE}>
        <LiveTracking ride={props.ride} User={isUser} />
      </div>

      <div className="w-full bg-white p-4" style={{ height: 80 }}>
        <button onClick={handleRide} className="w-full mt-2 bg-green-500 text-lg text-white font-semibold p-3 rounded-lg text-center">
          Arrived At PickupPoint
        </button>
      </div>
    </div>
  )
}

export default ArrivedAtPickup
