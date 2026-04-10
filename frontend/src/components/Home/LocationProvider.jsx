import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LocationProviderContext } from '../../context/LocationContext';

const LocationProvider = ({ children }) => {
  return (
    <LocationProviderContext>
      <LocationProviderInner>{children}</LocationProviderInner>
    </LocationProviderContext>
  );
};

const LocationProviderInner = ({ children }) => {
  const [location, setLocation] = useState({
    city: localStorage.getItem('userCity') || '',
    state: localStorage.getItem('userState') || '',
    loading: false,
    error: ''
  });
  const [showPrompt, setShowPrompt] = useState(false);

  const saveToStorage = (city, state) => {
    localStorage.setItem('userCity', city);
    localStorage.setItem('userState', state);
  };

  const fetchLocation = () => {
    setLocation((prev) => ({ ...prev, loading: true, error: '' }));
    setShowPrompt(true);
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      setShowPrompt(false);
      return;
    }

    const API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get('https://us1.locationiq.com/v1/reverse.php', {
            params: {
              key: API_KEY,
              lat: latitude,
              lon: longitude,
              format: 'json'
            }
          });
          // Use address fields as in the sample response
          const address = res.data.address;
          const city = address.city || address.town || address.village || address.hamlet || address.suburb || address.county;
          const state = address.state || address.state_district;
          if (city && state) {
            setLocation({ city, state, loading: false, error: '' });
            saveToStorage(city, state);
            setShowPrompt(false);
          } else {
            throw new Error('City/state not found');
          }
        } catch (e) {
          setLocation((prev) => ({
            ...prev,
            loading: false,
            error: 'Failed to reverse geocode'
          }));
          setShowPrompt(false);
        }
      },
      (err) => {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: 'User denied location access or error occurred'
        }));
        setShowPrompt(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    const city = localStorage.getItem('userCity');
    const state = localStorage.getItem('userState');
    if (!city || !state) {
      fetchLocation();
    }
  }, []);

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <span className="text-2xl mb-2">📍</span>
            <h2 className="text-lg font-semibold mb-2">Allow Location Access</h2>
            <p className="text-gray-600 mb-4 text-center">We use your location to show events near you. Please allow location access.</p>
            {location.loading && <div className="text-blue-600 font-medium">Detecting your location...</div>}
            {location.error && <div className="text-red-500 font-medium">{location.error}</div>}
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default LocationProvider;