import React, { use } from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import {UserDataContext} from '../context/UserContext'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import abhi from "../img/abhi.png";

function UserSignUp() {
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [userdata, setUserdata] = useState({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {user,setUser} = useContext(UserDataContext);

  const validatePassword = (pwd) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    if (pwd.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

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
      console.log(error.response?.data);
      console.log(error.response?.status);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.errors) {
        setError(error.response.data.errors[0].msg);
      } else {
        setError("Registration failed. Please try again.");
      }
      return;
    }
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    }
    return (
      <div className="p-7 flex flex-col justify-between h-screen">

        <div>
          <img src={abhi} alt="abhi" className=" h-25 w-60 mb-2" />
          <form onSubmit={(e) => { handleSubmit(e) }}>
            <h3 className="text-lg font-semibold mb-5">What's your Name </h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-4">
              <input required type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value) }} placeholder="First name" className="text-base mb-5 bg-[#eeeeee] placeholder:text-base border  w-1/2 px-4 py-2 " />
              <input required type="text" value={lastName} onChange={(e) => { setLastName(e.target.value) }} placeholder="Last name" className="text-base mb-5 bg-[#eeeeee] placeholder:text-base border w-1/2 px-4 py-2 " />
            </div>
            <h3 className="text-lg font-semibold mb-3">What is your Email  </h3>
            <input required type="email" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="example@gmail.com" className="text-lg mb-5 bg-[#eeeeee] placeholder:base border w-full px-4 py-2 " />
            <h3 className="text-lg font-semibold mb-3 ">Enter Your Password : </h3>
            <input required type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} className="text-lg mb-2 bg-[#eeeeee] placeholder:text-base border w-full px-4 py-2" placeholder="password" />
            <p className="text-xs text-gray-600 mb-5">Min 8 characters with uppercase, lowercase, number & special character</p>
            <button className="bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base  cursor-pointer">Create Account</button>
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
