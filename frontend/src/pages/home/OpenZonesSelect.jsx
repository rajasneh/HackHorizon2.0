import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBookingStore } from '../../store/bookingStore';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { v4 as uuidv4 } from 'uuid';

const fetchTicketCategories = async (eventId) => {
  if (!eventId) {
    return { categories: [], showTime: "", eventDetails: null };
  }
  try {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/event/get-price-details/${eventId}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return {
      categories: data.result?.price || [],
      showTime: data.result?.event?.scheduleStart
        ? new Date(data.result.event.scheduleStart).toLocaleString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      eventDetails: data.result?.event || null
    };
  } catch (err) {
    return { categories: [], showTime: "", eventDetails: null };
  }
};

export default function OpenZonesSelect() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const setBookingInfo = useBookingStore((state) => state.setBookingInfo);
  const { user } = useAuth();
  const { showLoginModal } = useModal();
  const [categories, setCategories] = useState([]);
  const [showTime, setShowTime] = useState("");
  const [eventDetails, setEventDetails] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const bookingId = uuidv4();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await fetchTicketCategories(eventId);
      setCategories(data.categories);
      setShowTime(data.showTime);
      setEventDetails(data.eventDetails);
      // Initialize selected with 0 for each category
      const initialSelected = {};
      data.categories.forEach((cat) => {
        initialSelected[cat.id] = 0;
      });
      setSelected(initialSelected);
      setLoading(false);
    }
    fetchData();
  }, [eventId]);

  const handleChange = (id, delta, max) => {
    setSelected((prev) => {
      const prevVal = Number(prev[id]) || 0;
      const safeMax = typeof max === 'number' && !isNaN(max) ? max : 9999;
      const newVal = Math.max(0, Math.min(prevVal + delta, safeMax));
      
      // If selecting a new category (delta > 0 and prevVal === 0), clear all other categories
      if (delta > 0 && prevVal === 0) {
        const clearedState = {};
        categories.forEach(cat => {
          clearedState[cat.id] = cat.id === id ? newVal : 0;
        });
        return clearedState;
      }
      
      return { ...prev, [id]: newVal };
    });
  };

  const totalTickets = Object.values(selected).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalPrice = categories.reduce(
    (sum, cat) => sum + ((Number(selected[cat.id]) || 0) * (Number(cat.price) || 0)),
    0
  );

  // Prepare selected categories for booking info
  const selectedCategories = categories
    .filter(cat => (selected[cat.id] || 0) > 0)
    .map(cat => ({
      id: cat.id,
      type: cat.type,
      price: cat.price,
      count: selected[cat.id] || 0
    }));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Logo outside the box */}
      <div className="absolute top-4 left-4 z-10">
        <img 
          src="/images/logo2.PNG" 
          alt="meetz" 
          className="h-8 w-auto"
        />
      </div>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{eventDetails?.name || 'Event'}</h1>
                <p className="text-sm text-gray-500">{showTime}</p>
              </div>
            </div>
          <h2 className="text-base font-semibold text-gray-700 mb-6">Select Tickets</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => {
                const available = (Number(cat.numberOfTickets) || 0) - (Number(cat.ticketsSold) || 0);
                const isSelected = (selected[cat.id] || 0) > 0;
                const isDisabled = available === 0;
                
                return (
                  <div key={cat.id} className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{cat.type}</h3>
                      <p className="text-sm text-gray-500">₹{Number(cat.price).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium ${
                          selected[cat.id] === 0 || isDisabled
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-50'
                        }`}
                        onClick={() => handleChange(cat.id, -1, available)}
                        disabled={selected[cat.id] === 0 || isDisabled}
                      >
                        −
                      </button>
                      
                      <span className="w-6 text-center text-base font-semibold text-gray-900">
                        {selected[cat.id] || 0}
                      </span>
                      
                      <button
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium ${
                          selected[cat.id] >= available || isDisabled
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-50'
                        }`}
                        onClick={() => handleChange(cat.id, 1, available)}
                        disabled={selected[cat.id] >= available || isDisabled}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Bottom Button */}
        <div className="p-6 pt-6">
          <button
            className={`w-full py-4 rounded-lg font-semibold text-base transition-colors flex items-center justify-between ${
              totalTickets > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={totalTickets === 0}
            onClick={() => {
              if (totalTickets === 0) return;
              setBookingInfo({
                categories: selectedCategories,
                price: totalPrice,
                numberOfTickets: totalTickets,
                bookingId,
                eventId,
                eventDetails: eventDetails ? {
                  eventName: eventDetails.name,
                  poster: eventDetails.posterUrl,
                  location: eventDetails.location,
                  city: eventDetails.city,
                  state: eventDetails.state,
                  area_name: eventDetails.area_name,
                  type: eventDetails.type,
                  date: eventDetails.scheduleStart
                    ? new Date(eventDetails.scheduleStart).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : undefined,
                } : { eventId },
                eventStart: eventDetails.scheduleStart,
                eventEnd: eventDetails.scheduleEnd
              });
              if (!user) {
                showLoginModal(`/booking-summary/${bookingId}`);
              } else {
                navigate(`/booking-summary/${bookingId}`);
              }
            }}
          >
            <span className="text-base ml-3">
              {totalTickets} Ticket{totalTickets !== 1 ? 's' : ''} | ₹{totalPrice.toLocaleString()}
            </span>
            <span className="flex items-center gap-2 mr-2">
              Proceed
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}