import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from '../../store/bookingStore';
import axios from 'axios';
import { TktPlzSpinner } from '../../components/Other/Spinner';
import { useAuth } from "../../context/AuthContext";
import RazorpayButton from "../../components/Other/RazorpayButton";

function formatCurrency(amount) {
  if (typeof amount !== "number") return "";
  return "₹" + amount.toLocaleString();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function BookingSummary() {
  const navigate = useNavigate();
  const bookingInfo = useBookingStore((state) => state.bookingInfo);
  const {
    eventDetails = {},
    selectedSeats = [],
    categories = [],
    eventId = "",
    type = "",
    categoriesBody = [],
    poster = "",
  } = bookingInfo;

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(600); // 10 minutes = 600 seconds
  const [timesUp, setTimesUp] = useState(false);
  const timerRef = useRef(null);
  const hasCalledAPI = useRef(false);
  const userDetails = useAuth();
  const userId = userDetails?.user?.userData?.id || userDetails?.user?.id || "";
  
  // console.log('userDetails:', userDetails);
  // console.log('userId:', userId);

  console.log("Event details : ", eventDetails);
  console.log("Category : ", categories);
  console.log("Category Body : ", categoriesBody);
  console.log("Selected Seats : ", selectedSeats);

  const unlockItems = async () => {
    if (!eventId || !userId || !eventDetails.type) {
      throw new Error('Missing required data for unlock operation');
    }
    
    const eventType = eventDetails.type;
    try {
      await axios.post(import.meta.env.VITE_BASE_URL + '/api/booking/unlock-items', {
        eventId,
        userId,
        eventType,
      });
    } catch (err) {
      if (err.response?.status === 400) {
        throw new Error('Invalid unlock request data');
      } else if (err.response?.status === 500) {
        throw new Error('Server error during unlock operation');
      } else {
        throw new Error(`Unlock failed: ${err.message}`);
      }
    }
  };

  // Fetch summary and lock items
  useEffect(() => {
    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const fetchSummary = async () => {
      try {
        const eventType = eventDetails.type;
        let body = { eventId, eventDetails, eventType, userId };

        // Validate required data
        if (!eventId || !eventType || !userId) {
          console.log('Missing data:', { eventId, eventType, userId });
          setError("Missing required booking information. Please go back to seat selection.");
          return;
        }

        if (eventType === 'Seating') {
          if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            setError("No seats selected. Please go back and select seats.");
            return;
          }
          body.selectedSeats = selectedSeats;
          body.item = selectedSeats;
        } else if (eventType === 'Open' || eventType === 'Online') {
          const itemData = categories.length ? categories : categories;
          if (!Array.isArray(itemData) || itemData.length === 0) {
            setError("No ticket categories selected. Please go back and select tickets.");
            return;
          }
          body.categoriesBody = itemData;
          body.item = itemData;
        }

        console.log('Sending booking request:', body);
        const res = await axios.post(import.meta.env.VITE_BASE_URL + '/api/booking/get-booking-summary', body);
        setSummary(res.data);
      } catch (err) {
        if (err.response?.status === 409) {
          const errorData = err.response.data;
          if (errorData.failedSeats) {
            setError("Some seats are already booked. Please select different seats.");
          } else if (errorData.failedTickets) {
            setError("Some tickets are already booked. Please try again.");
          } else {
            setError(errorData.message || "Some items are unavailable.");
          }
        } else {
          setError(err?.response?.data?.message || "Failed to fetch booking summary");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [eventId, eventDetails.type, selectedSeats, categoriesBody, categories, userId]);

  // Timer countdown logic
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimesUp(true);
          unlockItems(); // unlock on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Unlock on refresh or unload
  useEffect(() => {
    const handleUnload = () => {
      if (eventId && userId && eventDetails.type) {
        navigator.sendBeacon(import.meta.env.VITE_BASE_URL + '/api/booking/unlock-items', JSON.stringify({
          eventId,
          userId,
          eventType: eventDetails.type,
        }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [eventId, userId, eventDetails.type]);

  useEffect(() => {
    const sessionFlag = 'booking-summary-loaded';

    const handleRefresh = async () => {
      if (sessionStorage.getItem(sessionFlag) === 'true') {
        sessionStorage.removeItem(sessionFlag);
        if (eventId && userId && eventDetails.type) {
          try {
            await unlockItems();
          } catch (error) {
            console.error('Failed to unlock items on refresh:', error);
          }
        }
        navigate(-1, { replace: true });
      } else {
        sessionStorage.setItem(sessionFlag, 'true');
      }
    };

    if (userId) {
      handleRefresh();
    }

    return () => {
      sessionStorage.removeItem(sessionFlag);
    };
  }, [navigate, userId, eventId, eventDetails.type]);

  // Handle UI back button
  const handleBack = async () => {
    const confirmBack = window.confirm("Cancel your booking?");
    if (confirmBack) {
      await unlockItems();
      navigate(-1);
    }
  };

  // Remove scroll prevention - page needs to be scrollable
  // useEffect(() => {
  //   const original = document.body.style.overflow;
  //   document.body.style.overflow = 'hidden';
  //   return () => { document.body.style.overflow = original; };
  // }, []);

  return (
    <div className="bg-gray-50 min-h-screen pb-20 sm:pb-0">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          {/* Mobile Header */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">Booking Summary</h1>
              <div className="bg-red-100 px-2 py-1 rounded-full text-xs text-red-700 font-medium">
                {formatTime(timer)}
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:block text-center">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Review Your Booking</h1>
              <div className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700 font-medium">
                Time Left to Book: {formatTime(timer)}
              </div>
            </div>
            <p className="text-gray-600">Confirm your details before proceeding to payment.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><TktPlzSpinner /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 font-medium mb-4">{error}</div>
            <button
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={handleBack}
            >
              Go Back & Try Again
            </button>
          </div>
        ) : summary ? (
          <>
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-4 mb-32">
              {/* Event Card */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex gap-3">
                  <img
                    src={eventDetails.poster || '/images/default-poster.jpg'}
                    alt={eventDetails.eventName}
                    className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">{eventDetails.eventName}</h2>
                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-1">
                      <span>📍</span>
                      <span className="truncate">
                        {eventDetails.hallName}
                        {eventDetails.city ? `, ${eventDetails.city}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>📅</span>
                      <span className="font-semibold text-black">{eventDetails.date || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {eventDetails.type === 'Seating' ? `${summary.seats.length} Ticket${summary.seats.length > 1 ? 's' : ''}` : 
                         `${summary.seats.reduce((acc, cat) => acc + (cat.count || 0), 0)} Ticket${summary.seats.reduce((acc, cat) => acc + (cat.count || 0), 0) > 1 ? 's' : ''}`}
                      </p>
                      {eventDetails.type === 'Seating' && summary.seats.length > 0 && (
                        <p className="text-xs text-gray-600 truncate">
                          {summary.seats[0].category} - {summary.seats.map(seat => seat.seat_label).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalSeatAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Order amount</span>
                    <span>{formatCurrency(summary.totalSeatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Platform Fees</span>
                    <span>{formatCurrency(summary.totalConvenienceFee)}</span>
                  </div>
                  <hr className="border-dashed" />
                  <div className="flex justify-between text-gray-900 font-semibold">
                    <span>Total Payable</span>
                    <span>{formatCurrency(summary.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Your Details</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600">👤</span>
                  </div>
                  <p className="text-gray-900 text-sm truncate">{userDetails?.user?.userData?.email || userDetails?.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Movie Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Movie Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex gap-4">
                    <img
                      src={eventDetails.poster || '/images/default-poster.jpg'}
                      alt={eventDetails.eventName}
                      className="w-20 h-28 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{eventDetails.eventName}</h2>
                      <p className="text-gray-600 text-sm mb-2">UA13+ • Hindi • 3D</p>
                      <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                        <span>📍</span>
                        <span>
                          {eventDetails.hallName}
                          {eventDetails.city ? `, ${eventDetails.city}` : ""}
                          {eventDetails.screenNo ? `, Screen ${eventDetails.screenNo}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span className="font-semibold text-black">{eventDetails.date || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {eventDetails.type === 'Seating' ? `${summary.seats.length} Ticket${summary.seats.length > 1 ? 's' : ''}` : 
                           `${summary.seats.reduce((acc, cat) => acc + (cat.count || 0), 0)} Ticket${summary.seats.reduce((acc, cat) => acc + (cat.count || 0), 0) > 1 ? 's' : ''}`}
                        </p>
                        {eventDetails.type === 'Seating' && summary.seats.length > 0 && (
                          <p className="text-sm text-gray-600">
                            {summary.seats[0].category} - {summary.seats.map(seat => seat.seat_label).join(', ')}
                          </p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalSeatAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Available Offers */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Available Offers</h3>
                  <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600">🎫</span>
                      <span className="text-gray-700">View all available offers</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>

              {/* Right Column - Payment Summary */}
              <div className="space-y-4">
                {/* Payment Summary */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Order amount</span>
                      <span>{formatCurrency(summary.totalSeatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <div className="flex items-center gap-1">
                        <span>Platform Fees</span>
                        <span className="text-gray-400 cursor-pointer">ℹ️</span>
                      </div>
                      <span>{formatCurrency(summary.totalConvenienceFee)}</span>
                    </div>
                    <hr className="border-dashed" />
                    <div className="flex justify-between text-gray-900">
                      <span>Amount Payable</span>
                      <span className="font-bold">{formatCurrency(summary.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Your Details</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600">👤</span>
                    </div>
                    <div>
                      <p className="text-gray-900">{userDetails?.user?.userData?.email || userDetails?.user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 text-gray-700">
                    <span>📄</span>
                    <span className="text-sm">Read Terms and Conditions</span>
                  </div>
                </div>

                {/* Pay Button */}
                <RazorpayButton totalAmount={summary.totalAmount} summary={summary} />
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Mobile Sticky Pay Button */}
      {summary && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              {formatTime(timer)}
            </div>
          </div>
          <RazorpayButton totalAmount={summary.totalAmount} summary={summary} />
        </div>
      )}

      {/* Time's Up Modal */}
      {timesUp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl text-center shadow-lg max-w-xs w-full">
            <h2 className="text-2xl font-bold mb-2 text-red-700">Time's Up!</h2>
            <p className="text-gray-700 mb-4">Your booking session has expired.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingSummary;