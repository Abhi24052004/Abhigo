import React from 'react'
import { Link } from 'react-router-dom'
import UserLogin from "./UserLogin"

function Start() {
  return (
    <div className=" bg-cover bg-center bg-[url('../src/img/abh1.webp')] h-screen w-full pt-5 flex flex-col justify-between">
        {/* <img src="../src/img/pre.png" alt="abhi"  className=" w-60 " /> */}
        <div></div>
        <div className="bg-amber-50 py-5 px-4">
           <p className="text-3xl font-bold">Get started With AbhiGo....</p> 
           <Link to="/user/login" className="bg-black flex items-center justify-center text-amber-50 py-3 my-4 w-full rounded">Continue</Link>
        </div>

    </div>


  )
}

export default Start