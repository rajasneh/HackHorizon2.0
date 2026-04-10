import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useBookingStore } from '../../store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import { X } from 'lucide-react';
import LoadingSpinner from '../Other/LoadingSpinner'
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

const socket = io.connect(import.meta.env.VITE_BASE_URL + "");

const zoneColors = {
  'Regular': 'bg-gray-300 hover:bg-gray-400',
  'Executive': 'bg-blue-300 hover:bg-blue-400',
  'Premium': 'bg-purple-300 hover:bg-purple-400',
  'VIP': 'bg-yellow-300 hover:bg-yellow-400',
  'Gold': 'bg-yellow-400 hover:bg-yellow-500',
  'Silver': 'bg-gray-400 hover:bg-gray-500',
  'Bronze': 'bg-orange-300 hover:bg-orange-400',
  'Platinum': 'bg-indigo-300 hover:bg-indigo-400',
  'Diamond': 'bg-pink-300 hover:bg-pink-400',
  'Royal': 'bg-red-300 hover:bg-red-400'
};

const getZoneColor = (zoneName) => {
  return zoneColors[zoneName] || 'bg-gray-300 hover:bg-gray-400';
};

export default function SeatSelection({ screenID, eventId, eventName, hallName, screenNo, city, state, date, poster, eventStart, eventEnd }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [price, setPrice] = useState(null);
  const [lockedSeats, setLockedSeats] = useState(new Set());

  const bookingId = uuidv4();
  const setBookingInfo = useBookingStore((state) => state.setBookingInfo);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showLoginModal, modalType } = useModal();
 
  // Fetch locked seats initially from backend
  useEffect(() => {
    const fetchLockedSeats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/get-locked-seats/${eventId}`);
        const seats = response.data.lockedSeats;
        console.log("Seats : ", seats);
        const seatIds = seats.map(seat => seat.seatId);
        setLockedSeats(new Set(seatIds));
      } catch (error) {
        console.error("Error fetching locked seats:", error); 
      }
    };

    if (eventId) {
      fetchLockedSeats();
    }
  }, [eventId]);

  // Handle real-time locking/unlocking via socket
  useEffect(() => {
    if (!eventId) return;

    socket.emit('join', eventId);

    const handleSeatsLocked = (data) => {
      if (data.eventId === eventId) {
        setLockedSeats(prev => {
          const newLocked = new Set(prev);
          data.seats.forEach(seatId => newLocked.add(seatId));
          return newLocked;
        });
      }
    };

    const handleSeatsUnlocked = (data) => {
      if (data.eventId === eventId) {
        setLockedSeats(prev => {
          const newLocked = new Set(prev);
          data.seats.forEach(seatId => newLocked.delete(seatId));
          return newLocked;
        });
      }
    };

    socket.on("seats-locked", handleSeatsLocked);
    socket.on("seats-unlocked", handleSeatsUnlocked); 

    return () => {
      socket.off("seats-locked", handleSeatsLocked);
      socket.off("seats-unlocked", handleSeatsUnlocked);
      socket.emit('leave', eventId);
    };
  }, [eventId]);
 
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/halls/seats/${screenID}/${eventId}`);
        if (response.data.success) {
          setSeats(response.data.seats);
          setPrice(response.data.price);
        } else {
          setError("Failed to fetch seats");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching seats");
      } finally {
        setLoading(false);
      }
    };

    if (screenID && eventId) {
      fetchSeats();
    }
  }, [screenID, eventId]);

  const groupedSeats = useMemo(() => {
    const grouped = {};
    seats.forEach(seat => {
      if (!seat.isGap && seat.seatType && seat.row) {
        const zone = seat.seatType;
        if (!grouped[zone]) {
          grouped[zone] = {};
        }
        if (!grouped[zone][seat.row]) {
          grouped[zone][seat.row] = [];
        }
        grouped[zone][seat.row].push(seat);
      }
    });

    Object.keys(grouped).forEach(zone => {
      Object.keys(grouped[zone]).forEach(row => {
        grouped[zone][row].sort((a, b) => a.col - b.col);
      });
    });
    return grouped;
  }, [seats]);

  const zones = useMemo(() => {
    const lower = s => s?.toLowerCase?.() || '';
    const allZones = [];
    const seen = new Set();
    seats.forEach(seat => {
      if (!seat.isGap && !seen.has(seat.seatType)) {
        seen.add(seat.seatType);
        allZones.push(seat.seatType);
      }
    });
    const preferred = [
      allZones.find(z => ["normal", "regular"].includes(lower(z))),
      allZones.find(z => lower(z) === "executive"),
      allZones.find(z => lower(z) === "premium"),
      allZones.find(z => lower(z) === "vip")
    ].filter(Boolean);
    const others = allZones.filter(z => !preferred.includes(z));
    return [...preferred, ...others];
  }, [seats]);

  const priceMap = useMemo(() => {
    if (!price) return {};
    if (Array.isArray(price)) {
      return price.reduce((acc, p) => {
        acc[p.type] = parseFloat(p.price);
        return acc;
      }, {});
    } else if (price && price.type && price.price) {
      return { [price.type]: parseFloat(price.price) };
    }
    return {};
  }, [price]);

  const selectedByType = useMemo(() => {
    const map = {};
    selectedSeats.forEach(seat => {
      if (!map[seat.seatType]) map[seat.seatType] = [];
      map[seat.seatType].push(seat);
    });
    return map;
  }, [selectedSeats]);

  const totalPrice = useMemo(() => {
    let total = 0;
    Object.entries(selectedByType).forEach(([type, seats]) => {
      const seatPrice = priceMap[type] || 0;
      total += seatPrice * seats.length;
    });
    return total;
  }, [selectedByType, priceMap]);

  const sortRowsDescending = (rows) => {
    return rows.sort((a, b) => b.localeCompare(a));
  };

  const handleSeatClick = (seat) => {
    if (seat.isBooked || lockedSeats.has(seat.id)) {
      alert(seat.isBooked ? "This seat is already booked." : "This seat is currently being booked by another user.");
      return;
    }

    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        // Check if selecting a different category
        if (prev.length > 0 && prev[0].seatType !== seat.seatType) {
          // Clear previous selections and start with new category
          return [seat];
        }
        
        if (prev.length >= 10) {
          alert("You can select a maximum of 10 tickets only.");
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const isSeatSelected = (seat) => {
    return selectedSeats.find(s => s.id === seat.id);
  };

  const getSeatNumber = (col) => {
    return Math.floor(col);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <LoadingSpinner message="Loading your seats..." />
    </div>
  );
  if (error) return <div className="text-red-600 text-center p-4">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        {Array.isArray(price) && price.length > 0 && (
          <div className="mb-3 sm:mb-6">
            {/* Mobile: Compact 2-column grid price display */}
            <div className="sm:hidden">
              <div className="bg-gray-50 rounded-lg p-2 border">
                <h4 className="font-medium text-gray-700 text-xs mb-2">Prices</h4>
                <div className="grid grid-cols-2 gap-2">
                  {price.map(p => (
                    <div key={p.type} className="bg-white rounded px-2 py-1 border text-xs">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded ${getZoneColor(p.type).split(' ')[0]}`}></div>
                        <span className="font-medium text-gray-800">{p.type}</span>
                        <span className="text-green-600 font-semibold">₹{parseFloat(p.price).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Original compact display */}
            <div className="hidden sm:block">
              <h4 className="font-semibold mb-2 text-gray-800 text-base">Seat Prices</h4>
              <div className="flex flex-wrap gap-4 md:gap-6">
                {price.map(p => (
                  <div key={p.type} className="flex items-center gap-2 text-sm">
                    <span className={`font-semibold ${getZoneColor(p.type).split(' ')[0]} px-2 py-1 rounded text-xs`}>{p.type}</span>
                    <span className="text-gray-700">₹{parseFloat(p.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Seat Layout Container with Pan/Zoom */}
        <div className="relative">
          {/* Mobile: Scrollable container */}
          <div className="sm:hidden">
            <div className="overflow-auto border border-gray-200 rounded-lg">
              <div className="min-w-max p-4 bg-gray-50">
                <div className="space-y-3">
                  {[...zones].reverse().map((zone) => {
                    const isNormalZone = ["normal", "regular"].includes((zone || "").toLowerCase());
                    return (
                      <div key={zone} className="border-b border-gray-300 pb-4 last:border-b-0">
                        <h3 className="font-semibold text-sm mb-3 text-gray-800 text-center sticky left-0 bg-gray-50 py-1">{zone} Section</h3>
                        <div className="space-y-2">
                          {sortRowsDescending(Object.keys(groupedSeats[zone])).map(row => (
                            <div key={row} className="flex items-center gap-2">
                              <span className="w-6 text-xs font-medium text-gray-600 flex-shrink-0 sticky left-0 bg-gray-50">{row}</span>
                              <div className="flex gap-1">
                                {seats
                                  .filter(seat => seat.seatType === zone && seat.row === row)
                                  .sort((a, b) => a.col - b.col)
                                  .map(seat => (
                                    seat.isGap ? (
                                      <div key={seat.id} className="w-7 h-7 inline-block flex-shrink-0" />
                                    ) : (
                                      <button
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat)}
                                        disabled={seat.isBooked || lockedSeats.has(seat.id)}
                                        className={`
                                          w-7 h-7 text-xs font-medium rounded transition-all duration-200 flex items-center justify-center cursor-pointer flex-shrink-0
                                          ${seat.isBooked || lockedSeats.has(seat.id)
                                            ? 'bg-white border border-gray-300 cursor-not-allowed' 
                                            : isSeatSelected(seat)
                                              ? 'bg-green-500 text-white scale-110 shadow-lg'
                                              : getZoneColor(zone)
                                          }
                                          ${!seat.isBooked && !isSeatSelected(seat) && !lockedSeats.has(seat.id) ? 'hover:scale-105 hover:shadow-md' : ''}
                                        `}
                                      >
                                        {seat.isBooked || lockedSeats.has(seat.id) ? (
                                          <X size={10} className="text-gray-800" />
                                        ) : (
                                          <span className="text-xs">{getSeatNumber(seat.col)}</span>
                                        )}
                                      </button>
                                    )
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {isNormalZone && (
                          <div className="flex flex-col items-center mt-6 mb-1">
                            <img 
                              src="https://cdn.district.in/movies-web/_next/static/media/screen-img-light.b7b18ffd.png" 
                              alt="Screen" 
                              className="w-64 sm:w-72 drop-shadow-md object-cover object-center" 
                              style={{ maxHeight: '50px' }} 
                            />
                            <span className="mt-1 text-xs font-semibold text-gray-700 tracking-wide uppercase">Screen this side</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">💡 Tip: Scroll and pan to view all seats</p>
            </div>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden sm:block">
            <div className="space-y-6 md:space-y-8">
              {[...zones].reverse().map((zone) => {
                const isNormalZone = ["normal", "regular"].includes((zone || "").toLowerCase());
                return (
                  <div key={zone} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800">{zone} Section</h3>
                    <div className="space-y-3">
                      {sortRowsDescending(Object.keys(groupedSeats[zone])).map(row => (
                        <div key={row} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-medium text-gray-600 flex-shrink-0">{row}</span>
                          <div className="flex gap-2">
                            {seats
                              .filter(seat => seat.seatType === zone && seat.row === row)
                              .sort((a, b) => a.col - b.col)
                              .map(seat => (
                                seat.isGap ? (
                                  <div key={seat.id} className="w-8 h-8 inline-block flex-shrink-0" />
                                ) : (
                                  <button
                                    key={seat.id}
                                    onClick={() => handleSeatClick(seat)}
                                    disabled={seat.isBooked || lockedSeats.has(seat.id)}
                                    className={`
                                      w-8 h-8 text-xs font-medium rounded transition-all duration-200 flex items-center justify-center cursor-pointer flex-shrink-0
                                      ${seat.isBooked || lockedSeats.has(seat.id)
                                        ? 'bg-white border border-gray-300 cursor-not-allowed' 
                                        : isSeatSelected(seat)
                                          ? 'bg-green-500 text-white scale-110 shadow-lg'
                                          : getZoneColor(zone)
                                      }
                                      ${!seat.isBooked && !isSeatSelected(seat) && !lockedSeats.has(seat.id) ? 'hover:scale-105 hover:shadow-md' : ''}
                                    `}
                                  >
                                    {seat.isBooked || lockedSeats.has(seat.id) ? (
                                      <X size={12} className="text-gray-800" />
                                    ) : (
                                      <span className="text-xs">{getSeatNumber(seat.col)}</span>
                                    )}
                                  </button>
                                )
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isNormalZone && (
                      <div className="flex flex-col items-center mt-10 mb-1">
                        <img 
                          src="https://cdn.district.in/movies-web/_next/static/media/screen-img-light.b7b18ffd.png" 
                          alt="Screen" 
                          className="w-72 lg:w-80 drop-shadow-md object-cover object-center" 
                          style={{ maxHeight: '40px' }} 
                        />
                        <span className="mt-1 text-xs font-semibold text-gray-700 tracking-wide uppercase">Screen this side</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <h4 className="font-semibold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">Legend</h4>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 md:gap-4">
          {zones.map(zone => (
            <div key={zone} className="flex items-center gap-1 sm:gap-2">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${getZoneColor(zone).split(' ')[0]}`}></div>
              <span className="text-xs sm:text-sm text-gray-700">{zone}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500"></div>
            <span className="text-xs sm:text-sm text-gray-700">Selected</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-white border border-gray-300 flex items-center justify-center">
              <X size={8} className="sm:w-3 sm:h-3 text-black" />
            </div>
            <span className="text-xs sm:text-sm text-gray-700">Locked/Booked</span>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      {selectedSeats.length > 0 &&  (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg z-40">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Mobile: Compact view */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">Selected ({selectedSeats.length})</h4>
                  <div className="text-lg font-bold text-gray-800">₹{totalPrice.toLocaleString()}</div>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {selectedSeats.map(seat => `${seat.row}${getSeatNumber(seat.col)}`).join(', ')}
                </p>
                <div className="space-y-1 mb-3">
                  {Object.entries(selectedByType).map(([type, seats]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className={`font-semibold ${getZoneColor(type).split(' ')[0]} px-1 py-0.5 rounded text-xs`}>{type}</span>
                        <span>x{seats.length}</span>
                      </div>
                      <span className="text-gray-600">₹{((priceMap[type] || 0) * seats.length).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setBookingInfo({
                      selectedSeats: selectedSeats.map(seat => seat.id || ""),
                      bookingId,
                      eventDetails: {
                        eventName,
                        hallName,
                        screenNo,
                        city,
                        date,
                        type: "Seating", 
                        poster,
                        eventEnd,
                        eventStart,
                        state
                      },
                      eventId
                    });
                    if (!user) {
                      showLoginModal(`/booking-summary/${bookingId}`);
                    } else {
                      navigate(`/booking-summary/${bookingId}`);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition text-sm"
                >
                  Proceed to Book
                </button>
              </div>

              {/* Desktop: Full view */}
              <div className="hidden sm:flex md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">Selected Seats ({selectedSeats.length})</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSeats.map(seat => `${seat.row}${getSeatNumber(seat.col)}`).join(', ')}
                  </p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(selectedByType).map(([type, seats]) => (
                      <div key={type} className="flex items-center gap-2 text-sm">
                        <span className={`font-semibold ${getZoneColor(type).split(' ')[0]} px-2 py-1 rounded`}>{type}</span>
                        <span>x {seats.length}</span>
                        <span>₹{(priceMap[type] || 0).toLocaleString()} each</span>
                        <span className="ml-2 text-gray-500">= ₹{((priceMap[type] || 0) * seats.length).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-lg font-bold text-gray-800 mb-2">Total: ₹{totalPrice.toLocaleString()}</div>
                  <button
                    onClick={() => {
                      setBookingInfo({
                        selectedSeats: selectedSeats.map(seat => seat.id || ""),
                        bookingId,
                        eventDetails: {
                          eventName,
                          hallName,
                          screenNo,
                          city,
                          date,
                          type: "Seating", 
                          poster,
                          eventEnd,
                          eventStart,
                          state
                        },
                        eventId
                      });
                      if (!user) {
                        showLoginModal(`/booking-summary/${bookingId}`);
                      } else {
                        navigate(`/booking-summary/${bookingId}`);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Proceed to Book
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
