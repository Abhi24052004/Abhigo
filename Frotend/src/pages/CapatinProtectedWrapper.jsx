import React from 'react'
import {useNavigate} from 'react-router-dom'
import axios from 'axios';
import { useEffect } from 'react';

function CapatinProtectedWrapper({children }) {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    useEffect( () => {
        if (!token) {
            navigate('/captain/login')
        }
        axios.get(`${import.meta.env.VITE_BASE_URL}/captains/getprofile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((res) => {
            
        }).catch((err) => {
            
            localStorage.removeItem("token");
            navigate('/captain/login');
        });
    }, [token]);


    return (
        <div>
            {children}
        </div>
    )
}

export default CapatinProtectedWrapper