import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import Start from './pages/Start'
import UserLogin from './pages/UserLogin'
import UserSignUp from './pages/UserSignUp'
import CaptainLogin from './pages/CaptainLogin' 
import CaptainSignUp from './pages/CaptainSignUp'
import Home from './pages/Home'
import UserProtectedWrapper from './pages/UserProtectedWrapper'
import UserLogout from './pages/UserLogout'
import CaptainHome from './pages/CaptainHome'
import CapatinProtectedWrapper from './pages/CapatinProtectedWrapper'
import CaptainLogout from './pages/CaptainLogout'
import Riding from './pages/Riding'
import CaptainRiding from './pages/CaptainRiding'
import CaptainIssue from './pages/CaptainIssue'
function App() {
  

  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<Start/> }/>
          <Route path="/user/login" element={<UserLogin/> }/>
          <Route path="/riding" element={<Riding/> }/>
          <Route path="/user/signup" element={<UserSignUp/> }/>
          <Route path="/captain/login" element={<CaptainLogin/> }/>
          <Route path="/captain/riding" element={<CaptainRiding/>}/>
          <Route path="/captain/signup" element={<CaptainSignUp/> }/>
          <Route path="/home" element={<UserProtectedWrapper>
            <Home/>
          </UserProtectedWrapper>}/>
          <Route path="/user/logout" element={<UserProtectedWrapper>
            <UserLogout/>
          </UserProtectedWrapper>}/>
          <Route path="/captain/home" element={<CapatinProtectedWrapper> 
            <CaptainIssue/>
          </CapatinProtectedWrapper>}/>
          <Route path="/captain/start" element={<CapatinProtectedWrapper> 
            <CaptainHome />
          </CapatinProtectedWrapper>}/>
          <Route path="/captain/logout" element={<CapatinProtectedWrapper>
            <CaptainLogout/>
          </CapatinProtectedWrapper>}/>
        </Routes>
      </div>
    </>
  )
}

export default App
