"use Client"
import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import abhi from "../img/abhi.png";

const Captainlogin = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showForgot, setShowForgot] = useState(false)

  const { captain, setCaptain } = useContext(CaptainDataContext)
  const navigate = useNavigate()



  const submitHandler = async (e) => {
    e.preventDefault();
    const captain = {
      email: email,
      password
    }

    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, captain)

    if (response.status === 200) {
      const data = response.data;

      setCaptain(data.captain)
      localStorage.setItem('token', data.token)

      navigate('/captain/home');

    }

    setEmail('')
    setPassword('')
  }
  return (
    <>
    <div className='p-7 h-screen flex flex-col justify-between'>
      <div>
        <img src={abhi} alt="abhi" className=" h-25 w-60 mb-2" />
        <form onSubmit={(e) => {
          submitHandler(e)
        }}>
          <h3 className='text-lg font-medium mb-2'>What's your email</h3>
          <input
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            type="email"
            placeholder='email@example.com'
          />

          <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

          <input
            className='bg-[#eeeeee] mb-1 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            required type="password"
            placeholder='password'
          />

          <div className="mb-7 text-right">
            <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-blue-600 hover:underline">Forgot password?</button>
          </div>

          <button
            className='bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base cursor-pointer'
          >Login</button>

        </form>
        <p className='text-center'>Join a fleet? <Link to='/captain/signup' className='text-blue-600'>Register as a Captain</Link></p>
      </div>
      <div className="pt-5">
        <Link to="/user/login" className="text-lg flex items-center justify-center text-black textmb-3 font-semibold rounded-lg  bg-[#e8e8e8] w-full py-2 px-3 bg-orange-400">Sign in as User</Link>
      </div>
    </div>
    {showForgot && <ForgotPasswordModal initialEmail={email} onClose={() => setShowForgot(false)} isUser={false} />}
    </>
  )
}

export default Captainlogin
