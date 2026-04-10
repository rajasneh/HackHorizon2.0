import { createContext, useContext, useState } from 'react';

export const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProviderContext = ({ children }) => {
  const [location, setLocation] = useState({
    city: localStorage.getItem('userCity') || '',
    state: localStorage.getItem('userState') || '',
    loading: false,
    error: ''
  });

  const setCityState = (city, state) => {
    setLocation({ city, state, loading: false, error: '' });
    localStorage.setItem('userCity', city);
    localStorage.setItem('userState', state);
  };

  const clearCityState = () => {
    setLocation({ city: '', state: '', loading: false, error: '' });
    localStorage.removeItem('userCity');
    localStorage.removeItem('userState');
  };

  return (
    <LocationContext.Provider value={{ ...location, setCityState, clearCityState }}>
      {children}
    </LocationContext.Provider>
  );
};
