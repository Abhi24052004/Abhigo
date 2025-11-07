import { createContext, useState, useEffect } from "react";

export const CaptainDataContext = createContext();

const CaptainContext = ({ children }) => {
 
  const [captain, setCaptain] = useState(() => {
    try {
      const stored = localStorage.getItem("captain");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error reading captain from storage:", error);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (captain) {
      const safeData = { ...captain, password: '' }
      localStorage.setItem("captain", JSON.stringify(safeData));
    } else {
     
    }
  }, [captain]);

  const logoutCaptain = () => {
    setCaptain(null);
    localStorage.removeItem("captain");
    localStorage.removeItem("token");
  };


  const value = {
    captain,
    setCaptain,
    isLoading,
    setIsLoading,
    error,
    setError,
    logoutCaptain,
  };

  return (
    <CaptainDataContext.Provider value={value}>
      {children}
    </CaptainDataContext.Provider>
  );
};

export default CaptainContext;
