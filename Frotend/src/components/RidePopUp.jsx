import React from 'react'
import {useEffect} from 'react'
function RidePopUp(props) {
    
    useEffect(() => {

    },[])
    return (
        <div className="flex flex-col w-[96%] mx-2 -mt-3">
            <div className="flex justify-between   my-4 items-center bg-amber-100 rounded-sm px-2 py-2">
                <div className="flex gap-2 items-center">
                    <img className="h-15 w-15 rounded-full" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww" alt="" />
                    <h4 className="text-base font-bold">{props.ride?.user?.FullName?.FirstName+" "+props.ride?.user?.FullName?.LastName}</h4>
                </div>
                <div className="">
                    <p className="font-bold"><i className="ri-money-rupee-circle-line"></i>{"  "+props.ride?.fare}</p>
                    <p className="text-sm text-gray-500 font-light text-right">2.2KM</p>
                </div>
            </div>
            <div>
                <div className="border-b-2 border-gray-300">
                    <h4 className="text-gray-400 text-sm ">PICK UP</h4>
                    <p className="text-base font-semibold mb-3">{props.ride?.pickup}</p>
                </div>
                <div className="border-b-2 border-gray-300 mt-3">
                    <h4 className="text-gray-400 text-sm ">DROP OFF</h4>
                    <p className="text-base font-semibold mb-3 ">{props.ride?.destination}</p>
                </div>
            </div>
            <div className="flex justify-end gap-5 mt-2 mb-2">
                <button className="text-xl text-gray-400   font-semibold" onClick={()=>props.setRidePopUpPanel(false)}>Ignore</button>
                <button className="text-xl  text-black  bg-amber-300 px-5 py-2 rounded-xl font-semibold" onClick={()=>{props.confirmRide();props.setRidePopUpPanel(false);props.setConfirmRidePopUpPanel(true)}}>Accept</button>
            </div>
        </div>
    )
}

export default RidePopUp
