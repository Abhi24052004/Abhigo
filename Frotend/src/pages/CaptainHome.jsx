import React from 'react'
import CaptainDetail from '../components/CaptainDetail'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useState, useRef } from 'react';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';

function CaptainHome() {
  const [ridePopUpPanel, setRidePopUpPanel] = useState(true);
  const [confirmRidePopUpPanel, setConfirmRidePopUpPanel] = useState(false);
  const ridePopUpRef = useRef();
  const confirmRidePopUpRef = useRef()

  useGSAP(()=>{
    if(ridePopUpPanel){
      gsap.to(ridePopUpRef.current, {
        transform: "translateY(0%)"
      })
    }else{
      gsap.to(ridePopUpRef.current, {
        transform: "translateY(100%)",
        opacity:0
      })
    }
  },[ridePopUpPanel])

    useGSAP(()=>{
    if(confirmRidePopUpPanel){
      gsap.to(confirmRidePopUpRef.current, {
        transform: "translateY(0%)"
      })
    }else{
      gsap.to(confirmRidePopUpRef.current, {
        transform: "translateY(100%)"
      })
    }
  },[confirmRidePopUpPanel])
  return (
    <div className="h-screen ">
      <div className="h-[50%]">
        <img className="h-full w-full object-cover" src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif" alt="not found" />
      </div>
      <div  className="fixed bottom-0 h-[46%] w-screen  lg:ml-6 bg-white ">
        <CaptainDetail/>
      </div>
      <div ref={ridePopUpRef} className=" fixed bottom-0 bg-white w-screen h-[48%] lg:ml-6 mb-8">
        <RidePopUp setRidePopUpPanel={setRidePopUpPanel} setConfirmRidePopUpPanel={setConfirmRidePopUpPanel}/>
      </div>
      <div ref={confirmRidePopUpRef} className="h-screen fixed bottom-0 bg-white w-screen  lg:ml-6 translate-y-full">
        <ConfirmRidePopUp setConfirmRidePopUpPanel={setConfirmRidePopUpPanel} setRidePopUpPanel={setRidePopUpPanel}/>
      </div>

    </div>
  )
}

export default CaptainHome