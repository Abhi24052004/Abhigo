"use Client"
import React from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function CaptainLogin() {
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
 
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const Captaindata={
      email: email,
      password: password
    };
    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, Captaindata);
    if (res.status === 200) {
      const data = res.data;
      localStorage.setItem("token", data.token);
      navigate('/captain/home');
    }

    setEmail("");
    setPassword("");
  }
  return (
    <div className="p-7 flex flex-col justify-between h-screen">

      <div>
        <a href="https://ibb.co/s9TQppx8"><img src="https://i.ibb.co/0y0Zpp4H/abhi.png" alt="abhi" border="0" className=" h-25 w-60 mb-2" /></a>
        {/* <img src="https://drive.google.com/file/d/1l095Eyg-YMh7ez9JOUvibMNTO2jl1Dmw/view?usp=sharing" alt="abhi" className=" h-25 w-60 mb-2" /> */}
        <form onSubmit={(e) => { handleSubmit(e) }}>
          <h3 className="text-lg font-semibold mb-3">What is your Email ? </h3>
          <input required type="email" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="example@gmail.com" className="text-lg mb-5 bg-[#eeeeee] placeholder:base border w-full px-4 py-2 " />
          <h3 className="text-lg font-semibold mb-3 ">Enter Your Password : </h3>
          <input required type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} className="text-lg mb-5 bg-[#eeeeee] placeholder:text-base border w-full px-4 py-2" placeholder="password" />
          <button className="text-lg mb-3 font-semibold bg-black text-white w-full py-2 px-3 cursor-pointer">Login</button>
          <p className="text-center"> Join a fleet? <Link to="/captain/signup" className="text-blue-600">Register as a captain</Link></p>
        </form>
      </div>

      <div className="pt-5">
        <Link to="/user/login" className="text-lg flex items-center justify-center text-black textmb-3 font-semibold bg-[#e8e8e8] w-full py-2 px-3 bg-orange-400">Sign in as User</Link>
      </div>

    </div>
  )
}

export default CaptainLogin
