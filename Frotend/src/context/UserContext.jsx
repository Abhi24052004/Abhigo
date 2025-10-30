import React, { createContext, useState, useEffect } from 'react';

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
    // Initialize from localStorage if available
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error("Error reading user from storage:", error);
            return null;
        }
    });


    useEffect(() => {
        if (user) {
            const safeData = { ...user, password: '' }
            localStorage.setItem("user", JSON.stringify(safeData));
        } else {

            localStorage.removeItem("user");
        }
    }, [user]);

    return (
        <UserDataContext.Provider value={{ user, setUser }}>
            {children}
        </UserDataContext.Provider>
    );
};

export default UserContext;
