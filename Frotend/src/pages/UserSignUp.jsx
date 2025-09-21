import React, { use } from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import {UserDataContext} from '../context/UserContext'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

function UserSignUp() {
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [userdata, setUserdata] = useState({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();
  const {user,setUser} = useContext(UserDataContext);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUser = {
      FullName: {
        FirstName: firstName,
        LastName: lastName
      },
     Email: email,
     pasword: password
    };
    try{
    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser);
    if (response.status === 201) {
      const data=response.data;
      setUser(data.user);
      localStorage.setItem("token",data.token);
      navigate("/home");
    }
    }catch (error) {
      console.log( error.message);
      console.log(error.response.data);
      console.log(error.response.status);
    }
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    }
    return (
      <div className="p-7 flex flex-col justify-between h-screen">

        <div>
          <img src="../src/img/abhi.png" alt="abhi" className=" h-25 w-60 mb-2" />
          <form onSubmit={(e) => { handleSubmit(e) }}>
            <h3 className="text-lg font-semibold mb-5">What's your Name </h3>
            <div className="flex gap-4">
              <input required type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value) }} placeholder="First name" className="text-base mb-5 bg-[#eeeeee] placeholder:text-base border  w-1/2 px-4 py-2 " />
              <input required type="text" value={lastName} onChange={(e) => { setLastName(e.target.value) }} placeholder="Last name" className="text-base mb-5 bg-[#eeeeee] placeholder:text-base border w-1/2 px-4 py-2 " />
            </div>
            <h3 className="text-lg font-semibold mb-3">What is your Email  </h3>
            <input required type="email" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="example@gmail.com" className="text-lg mb-5 bg-[#eeeeee] placeholder:base border w-full px-4 py-2 " />
            <h3 className="text-lg font-semibold mb-3 ">Enter Your Password : </h3>
            <input required type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} className="text-lg mb-5 bg-[#eeeeee] placeholder:text-base border w-full px-4 py-2" placeholder="password" />
            <button className=" flex justify-center items-center w-full text-lg mb-3 font-semibold bg-black text-white py-2 px-3 cursor-pointer">Create Account</button>
          </form>
          <p className="text-center"> Already have a Account ? <Link to="/user/Login" className="text-blue-600">Login here</Link></p>

        </div>

        <div className="pt-5">
          <p className="text-[10px] leading-tight">By proceeding,you consent to get calls,WhatsApp or SMS messages, including by automated means from Uber and its affiliates to the number provided</p>
        </div>

      </div>
    )
  }


export default UserSignUp