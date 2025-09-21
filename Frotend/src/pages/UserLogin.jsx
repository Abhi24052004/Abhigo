import React from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { UserDataContext } from '../context/UserContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'


function UserLogin() {
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [userdata, setUserdata] = useState({});
  const {user,setUser} = useContext(UserDataContext);
  const navigate=useNavigate();
  const handleSubmit = async(e) => {
    e.preventDefault();
    const userdata={
      Email: email,
      pasword: password
    };
    
    
    const response=await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`,userdata);
    if(response.status===200){
      const data=response.data;
      setUser(data.user);
      localStorage.setItem("token",data.token);
      navigate("/home");
    }
    setEmail("");
    setPassword("");
  }
  return (

    <div className="p-7 flex flex-col justify-between h-screen">

      <div>
        <img src="../src/img/abhi.png" alt="abhi" className=" h-25 w-60 mb-2" />
        <form onSubmit={(e) => { handleSubmit(e) }}>
          <h3 className="text-lg font-semibold mb-3">What is your Email ? </h3>
          <input required type="email" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="example@gmail.com" className="text-lg mb-5 bg-[#eeeeee] placeholder:base border w-full px-4 py-2 " />
          <h3 className="text-lg font-semibold mb-3 ">Enter Your Password : </h3>
          <input required type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} className="text-lg mb-5 bg-[#eeeeee] placeholder:text-base border w-full px-4 py-2" placeholder="password" />
          <button className="text-lg mb-3 font-semibold bg-black text-white w-full py-2 px-3 cursor-pointer">Login</button>
          <p className="text-center"> New here? <Link to="/user/signup" className="text-blue-600">Create new Account</Link></p>
        </form>
      </div>

      <div className="pt-5">
        <Link to="/captain/login" className="text-lg flex items-center justify-center text-black textmb-3 font-semibold bg-[#e8e8e8] w-full py-2 px-3 bg-green-400">Sign in as Captain</Link>
      </div>

    </div>
  )
}

export default UserLogin