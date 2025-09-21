import React, { useState } from 'react'
import { Link } from 'react-router-dom';

function ConfirmRidePopUp(props) {
    const [otp, setOtp] = useState("")
    return (
        <div className="flex flex-col mt-11 w-[96%] mx-2 ">
            <h4 className="flex justify-center" onClick={() => props.setConfirmRidePopUpPanel(false)}><i className="ri-arrow-down-wide-line" ></i></h4>

            <div className="flex justify-between   my-4 items-center bg-amber-100 rounded-sm px-2 py-2">
                <div className="flex gap-2 items-center">
                    <img className="h-15 w-15 rounded-full" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww" alt="" />
                    <h4 className="text-base font-bold">USER</h4>
                </div>
                <div className="">
                    <p className="font-bold">2.2KM </p>
                </div>
            </div>
            <div>
                <div className="flex flex-col  gap-3 mt-3 ">

                    <h2 className="flex  gap-3  border-b-2 border-gray-200"><i className="ri-map-pin-line  flex items-center"></i> <div className="flex flex-col mb-2"> <p className="font-semibold text-xl">562/42B</p> <span className="text-sm font-light">Greenfield Street, Andheri West, Mumbai</span> </div></h2>
                    <h2 className="flex  gap-3 border-b-2 border-gray-200"><i className="ri-map-pin-2-fill flex items-center"></i> <div className="flex flex-col mb-2"> <p className="font-semibold text-xl">562/42B</p> <span className="text-sm font-light">Greenfield Street, Andheri West, Mumbai</span></div> </h2>
                    <h2 className="flex gap-3 "><i className="ri-money-rupee-circle-fill flex items-center "></i> <div className="flex flex-col"> <p className="font-semibold text-xl">225</p> <span className="text-sm font-light">Cash</span> </div></h2>
                </div>
            </div>
            <div className="flex flex-col w-fulljustify-end gap-3 mt-2 mb-2">
                <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" className='bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3' placeholder='Enter OTP' />
                <Link to="/captain/riding" className='w-full mt-2  bg-green-500 text-lg text-white font-semibold p-3 rounded-lg text-center'>Confirm</Link>
                <button className='w-full mt-2 bg-red-600 text-lg text-white font-semibold p-3 rounded-lg' onClick={() => { props.setRidePopUpPanel(false); props.setConfirmRidePopUpPanel(false) }}>Cancel</button>

            </div>
        </div>
    )
}

export default ConfirmRidePopUp