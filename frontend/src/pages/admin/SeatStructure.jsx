import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatSelection from "../../components/Other/SeatSelection";
import { useBookingStore } from '../../store/bookingStore';
import axios from 'axios';

export default function SeatStructure() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const bookingInfo = useBookingStore((state) => state.bookingInfo);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/event/get-event/${eventId}`);
        setEventData(res.data.data);
      } catch (e) {
        setError("Failed to load event details.");
      }
      setLoading(false);
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error || !eventData) return <div className="text-center text-red-600 p-8">{error || "Event not found."}</div>;

  const eventName = eventData.name || "";
  const hallName = eventData.hall?.name || "";
  const screenNo = eventData.screen?.screen_no || "";
  const city = eventData.hall?.city || eventData.city || "";
  const state = eventData.hall?.state || eventData.state || "";
  // Format date and time to a nice format
  const dateRaw = eventData.scheduleStart || "";
  const poster = eventData.posterUrl || "";
  const date = dateRaw
    ? new Date(dateRaw).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const screenId = eventData.screen?.id || "";
  const eventStart = eventData.scheduleStart || "";
  const eventEnd = eventData.scheduleEnd || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-montserrat text-gray-800 flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white shadow-md py-2 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 w-full border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Left: Back button (mobile) / tktplz Logo (desktop) */}
          <div className="flex-shrink-0">
            {/* Mobile: Back button */}
            <button
              onClick={() => navigate(-1)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Desktop: Logo */}
            <img
              src="https://res.cloudinary.com/dgxc8nspo/image/upload/v1756377392/posters/aezej67pxo3kucstndsv.png"
              alt="tktplz Logo"
              className="hidden sm:block h-7 md:h-8 w-auto rounded-lg shadow-sm"
            />
          </div>

          {/* Center: Event/Hall/Date Info */}
          <div className="flex-grow text-center mx-2 md:mx-4">
            <div className="w-full">
              <h1 className="text-sm sm:text-base md:text-xl font-extrabold text-gray-900 leading-tight truncate">
                {eventName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {date} at {hallName}, {city}
              </p>
            </div>
          </div>

          {/* Right: User Icon (hidden on mobile) */}
          <div className="hidden sm:flex flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-blue-500 rounded-full items-center justify-center text-white font-bold text-sm">
            U
          </div>
          
          {/* Mobile: Empty space for balance */}
          <div className="sm:hidden w-8 h-8"></div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-100">
          <SeatSelection
            screenID={screenId}
            eventId={eventId}
            eventName={eventName}
            hallName={hallName}
            screenNo={screenNo}
            city={city}
            date={date}
            poster={poster}
            eventStart={eventStart}
            eventEnd={eventEnd}
            state={state}
          />
        </div>
      </div>
    </div>
  );
}