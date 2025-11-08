import React from 'react'
import LiveTracking from '../components/updatedLiveTracking'

function ArrivedAtPickup(props) {
    const [isUser,setIsUser]=React.useState(false);
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
        </div>
    )
}

export default ArrivedAtPickup
