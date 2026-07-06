import { createContext, useContext } from "react";

const GigContext = createContext();

export const GigProvider = ({ children }) => {
  return (
    <GigContext.Provider value={{}}>
      {children}
    </GigContext.Provider>
  );
};

export const useGigs = () => useContext(GigContext);
