
import React, { createContext, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();
const socket = io(`${import.meta.env.VITE_BASE_URL}`, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
});

const SocketProvider = ({ children }) => {
    useEffect(() => {
        const captainRaw = localStorage.getItem('captain');
        const userRaw = localStorage.getItem('user');
        let captainData = null;
        let userData = null;
        try { if (captainRaw) captainData = JSON.parse(captainRaw); } catch {}
        try { if (userRaw) userData = JSON.parse(userRaw); } catch {}

        const emitJoin = () => {
            if (captainData?._id) {
                socket.emit('join', { userId: captainData._id, userType: 'captain' });
            }
            if (userData?._id) {
                socket.emit('join', { userId: userData._id, userType: 'user' });
            }
        };

        socket.on('connect', () => {
            console.log('Connected to server', socket.id);
            emitJoin();
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server', reason);
        });

        

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('joined-event');
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
