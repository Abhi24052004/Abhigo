import React from 'react'

function CaptainDetail() {
    return (
        <div className=" lg:w-[95%] lg:ml-2">
            <div className="flex justify-between  mx-2 mb-4 items-center bg-amber-100 rounded-sm px-2 py-2 ">
                <div className="flex gap-2 items-center">
                    <img className="h-15 w-15 rounded-full" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHw" alt="" />
                    <h4 className="text-base font-bold">Abhishek Tiwari</h4>
                </div>
                <div className="">
                    <p className="font-bold"><i className="ri-money-rupee-circle-line"></i>252.20 </p>
                    <p className="text-sm text-gray-400 font-light text-center">Earnings</p>
                </div>
            </div>
            <div className=" flex h-40  lg:justify-between  ml-2 mb-9 gap-8 bg-yellow-200 py-7 px-3 rounded-sm">
                <div className="flex flex-col items-center lg:ml-80"><i className="ri-time-line text-3xl"></i><p className="text-2xl font-semibold ">10.5</p><p className="text-sm text-gray-400 font-light">Hours Online</p></div>
                <div className="flex flex-col items-center"><i className="ri-speed-up-line text-3xl"></i><p className="text-2xl font-semibold ">10.5</p><p className="text-sm text-gray-400 font-light">Distance Covered</p></div>
                <div className="flex flex-col items-center lg:mr-80"><i className="ri-booklet-line text-3xl"></i><p className="text-2xl font-semibold ">10.5</p><p className="text-sm text-gray-400 font-light">Hours Online</p></div>
            </div>
        </div>
    )
}

export default CaptainDetail