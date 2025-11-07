import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';

export const UserLogout = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const doLogout = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/logout`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!cancelled && res.status === 200) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/user/login", { replace: true });
        }
      } catch (err) {
        console.error("Logout failed", err);
        if (!cancelled) navigate("/login", { replace: true });
      }
    };

    doLogout();

    return () => { cancelled = true; };
  }, [navigate, token]);

  return <div>Logging out…</div>;
}

export default UserLogout;
