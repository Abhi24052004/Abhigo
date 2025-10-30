import React from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { useEffect } from 'react';

function CaptainLogout() {
    const naviagate = useNavigate();
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
    ).then((res) => {
        if (res.status === 200) {
            localStorage.removeItem("token");
            localStorage.removeItem("captain");
            naviagate("/captain/login");
        }}).catch((err) => {
            console.log("Logout failed", err);
           
        })

    return (
        <div>

        </div>
    )
}

export default CaptainLogout
