import React from 'react';
import { useNavigate } from 'react-router-dom';
const CaptainIssue = () => {
    const navigate = useNavigate();
    function handle(){
        navigate('/captain/start');
    }
    return (
        <div>
            <h1>Captain Issue Page</h1>
            <button onClick={handle}>way</button>
        </div>
    );
};

export default CaptainIssue;
