import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { TermsAndConditions } from "../../components/Other/Terms&Condition";
import { useBookingStore } from '../../store/bookingStore';
import { useAuth } from '../../context/AuthContext';
import { CloudCog } from "lucide-react";

// Helper for font classes
const font = {
  inter: "font-inter",
  mont: "font-montserrat"
};

const EventInfo = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const { user } = useAuth();
  const setBookingInfo = useBookingStore((state) => state.setBookingInfo);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setErr("");
      try {
        const userId = user?.userData?.id ? user?.userData?.id : user?.id;
        console.log("User id : ", userId);
        const url = userId 
          ? `${import.meta.env.VITE_BASE_URL}/api/event/get-event/${eventId}?userId=${userId}`
          : `${import.meta.env.VITE_BASE_URL}/api/event/get-event/${eventId}`;
        const res = await axios.get(url);
        setEvent(res.data.data);
        setIsLiked(res.data.data.isLiked || false);
      } catch (e) {
        setErr("Failed to load event details.");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventId, user]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyHeader(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="text-lg text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (err || !event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="text-lg text-red-500">{err || "Event not found."}</div>
      </div>
    );
  }

  const handleLikeToggle = async () => {
    // Get userId from either location
    const userId = user?.userData?.id || user?.id;
    
    if (!userId || !event?.id) {
      return;
    }
    
    const previousState = isLiked;
    
    if (isProcessing) {
      return; // Prevent multiple simultaneous requests
    }
    
    setIsProcessing(true);
    setIsLiked(!isLiked); // Optimistic update
    
    try {
      const payload = { 
        eventId: String(event.id).trim(), 
        userId: String(userId).trim() 
      };
      
      if (previousState) {
        await axios.delete(import.meta.env.VITE_BASE_URL + '/api/user/events/like', {
          data: payload,
          timeout: 5000
        });
      } else {
        await axios.post(import.meta.env.VITE_BASE_URL + '/api/user/events/like', payload, {
          timeout: 5000
        });
      }
    } catch (error) {
      setIsLiked(previousState); // Revert if API fails
    } finally {
      setIsProcessing(false);
    }
  };

  // console.log("Event : ", event);

  // Calculate event duration
  let duration = null;
  if (event.scheduleStart && event.scheduleEnd) {
    const start = new Date(event.scheduleStart);
    const end = new Date(event.scheduleEnd);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) {
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      duration = `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm' : ''}`;
    }
  }

  // Responsive: mobile = flex-col, desktop = flex-row
  return (
    <div className={`${font.inter} min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100`}>
      {/* Top Section: Poster + Details */}
      <div className="relative w-full">
        {/* Blurry Poster BG */}
        <div
          className="absolute inset-0 h-[450px] sm:h-[400px] w-full z-0"
          style={{
            backgroundImage: `url(${event.posterUrl || event.poster || "/images/default-poster.jpg"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px) brightness(0.5)",
            WebkitFilter: "blur(7px) brightness(0.5)",
            transition: "background-image 0.3s"
          }}
        />
        {/* Overlay for dark effect */}
        <div className="absolute inset-0 h-[450px] sm:h-[400px] w-full bg-black/60 z-10" />
        {/* Main Content */}
        <div className="relative z-20 px-3 sm:px-6 md:px-12 py-6 sm:py-8 md:py-12" style={{ maxHeight: 470 }}>
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            {/* Event Title */}
            <h1 className="text-xl font-bold text-white leading-tight mb-5 text-center">{event.name || "Event Title"}</h1>
            
            {/* Poster and Details Row */}
            <div className="flex gap-4 mb-4">
              {/* Poster */}
              <div className="w-32 h-44 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 m-1">
                <img
                  src={event.posterUrl || event.poster || "/images/default-poster.jpg"}
                  alt={event.name || "Event Poster"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Details Column */}
              <div className="flex-1 space-y-2">
                {/* Likes */}
                <div className="flex items-center justify-end mr-2 sm:mr-0 sm:justify-start gap-2">
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                    <svg className="w-3 h-3 text-red-400 fill-current" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className="text-white font-medium text-xs">{event.likes_count || 0}</span>
                  </div>
                  {user && (
                    <button
                      onClick={handleLikeToggle}
                      disabled={isProcessing}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-300 focus:outline-none text-xs ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isLiked 
                          ? 'bg-red-500 text-white shadow-lg transform scale-105' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <svg 
                        className={`w-3 h-3 transition-all duration-300 ${
                          isLiked ? 'fill-current' : 'stroke-current fill-none'
                        }`} 
                        viewBox="0 0 24 24" 
                        strokeWidth={2}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span className="font-medium">
                        {isLiked ? 'Liked' : 'Like'}
                      </span>
                    </button>
                  )}
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  {event.genre && (
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium border border-white/30">
                      {event.genre}
                    </span>
                  )}
                  {/* {event.type && (
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium border border-white/30">
                      {event.type}
                    </span>
                  )} */}
                  {event.type === 'Registration' && (
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                      event.isOnline 
                        ? 'bg-blue-500/90 text-white border-blue-400/50' 
                        : 'bg-green-500/90 text-white border-green-400/50'
                    }`}>
                      {event.isOnline ? 'Online' : 'Offline'}
                    </span>
                  )}
                  {event.ratingCode && (
                    <span className="bg-amber-500/90 text-white px-2 py-1 rounded-md text-xs font-medium border border-amber-400/50">
                      {event.ratingCode}
                    </span>
                  )}
                  {event.language && (
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium border border-white/30">
                      {event.language}
                    </span>
                  )}
                </div>
                
                {/* Date, Time, Duration Cards */}
                <div className="space-y-2 mt-3">
                  {/* Date - Full Width */}
                  <div className="bg-white/10 backdrop-blur-none rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-blue-500 uppercase tracking-wide font-medium">Date</span>
                    </div>
                    <div className="text-sm font-bold text-gray-200">
                      {event.scheduleStart ? 
                        new Date(event.scheduleStart).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'TBA'
                      }
                    </div>
                  </div>
                  
                  {/* Time and Duration - Half Width Each */}
                  <div className="grid grid-cols-2 gap-1">
                    {/* Time */}
                    <div className="bg-white/10 backdrop-blur-none rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-purple-500 uppercase tracking-wide font-medium">Time</span>
                      </div>
                      <div className="text-xs font-bold text-gray-200">
                        {event.scheduleStart ? 
                          new Date(event.scheduleStart).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'TBA'
                        }
                      </div>
                    </div>
                    
                    {/* Duration */}
                    {duration ? (
                      <div className="bg-white/10 backdrop-blur-none rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-green-500 uppercase tracking-wide font-medium">Duration</span>
                        </div>
                        <div className="text-xs font-bold text-gray-200">{duration}</div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 backdrop-blur-none rounded-lg p-2 opacity-50">
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Duration</span>
                        </div>
                        <div className="text-xs font-bold text-gray-500">TBA</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Venue Only - Full Width */}
            <div className="mb-20">
              {!event.isOnline && (
                <div className="bg-white/10 backdrop-blur-none rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-500 uppercase tracking-wide font-medium">Venue</span>
                  </div>
                  <div className="text-gray-200">
                    <div className="text-base font-bold">{event.hall?.name || event.location || 'TBA'}</div>
                    {event.screen?.screen_no && (
                      <div className="text-sm text-gray-300">Screen {event.screen.screen_no}</div>
                    )}
                    <div className="text-sm text-gray-300 mt-1">
                      {event.hall?.area_name || event.area_name ? `${event.hall?.area_name || event.area_name}, ` : ''}{event.hall?.city || event.city}{event.hall?.state || event.state ? `, ${event.hall?.state || event.state}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8">
          {/* Poster */}
          <div className="w-32 h-44 sm:w-40 sm:h-56 md:w-56 md:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-none sm:shadow-2xl border-2 sm:border-4 border-white/10 flex-shrink-0 bg-white/10">
            <img
              src={event.posterUrl || event.poster || "/images/default-poster.jpg"}
              alt={event.name || "Event Poster"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
            {/* Details */}
            <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-2 gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">{event.name || "Event Title"}</h1>
              <div className="flex items-center gap-2 sm:gap-3 justify-start sm:justify-end">
                <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-full">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400 fill-current" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className="text-white font-medium text-xs sm:text-sm">{event.likes_count || 0}</span>
                </div>
                {user && (
                  <button
                    onClick={handleLikeToggle}
                    disabled={isProcessing}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full transition-all duration-300 focus:outline-none ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      isLiked 
                        ? 'bg-red-500 text-white shadow-lg transform scale-105' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <svg 
                      className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-all duration-300 ${
                        isLiked ? 'fill-current' : 'stroke-current fill-none'
                      }`} 
                      viewBox="0 0 24 24" 
                      strokeWidth={2}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">
                      {isLiked ? 'Liked' : 'Like'}
                    </span>
                  </button>
                )}
              </div>
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
              {event.genre && (
                <span className="bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border border-white/30">
                  {event.genre}
                </span>
              )}
              {event.type && (
                <span className="bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border border-white/30">
                  {event.type}
                </span>
              )}
              {event.type === 'Registration' && (
                <span className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border ${
                  event.isOnline 
                    ? 'bg-blue-500/90 text-white border-blue-400/50' 
                    : 'bg-green-500/90 text-white border-green-400/50'
                }`}>
                  {event.isOnline ? 'Online' : 'Offline'}
                </span>
              )}
              {/* {typeof event.rating !== "undefined" && event.rating !== null && (
                <span className="bg-amber-500/90 text-white px-3 py-1 rounded-md text-sm font-medium border border-amber-400/50">
                  ★ {Number(event.rating).toFixed(1)}
                </span>
              )} */}
              {event.ratingCode && (
                <span 
                  className="bg-amber-500/90 text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border border-amber-400/50 relative group cursor-pointer"
                >
                  {event.ratingCode}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    {event.ratingCode.toUpperCase()} - {event.ratingCode.toLowerCase() === 'u' ? 'Universal (anyone can watch)' : event.ratingCode.toLowerCase() === 'ua' ? 'Universal Adult (parental guidance for children under 12)' : event.ratingCode.toLowerCase() === 'a' ? 'Adult (restricted to adults 18+)' : event.ratingCode.toLowerCase() === 's' ? 'Restricted (restricted exhibition)' : 'Rating information'}
                  </div>
                </span>
              )}
            </div>
            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="bg-white/90 sm:bg-white/10 backdrop-blur-none sm:backdrop-blur-sm rounded-lg p-2 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-700 sm:text-blue-200 uppercase tracking-wide font-medium">Date</span>
                  </div>
                  <div className="text-base font-bold text-gray-900 sm:text-white">
                    {event.scheduleStart ? 
                      new Date(event.scheduleStart).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'TBA'
                    }
                  </div>
                </div>
                
                {/* Time */}
                <div className="bg-white/90 sm:bg-white/10 backdrop-blur-none sm:backdrop-blur-sm rounded-lg p-2 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-purple-700 sm:text-purple-200 uppercase tracking-wide font-medium">Time</span>
                  </div>
                  <div className="text-base font-bold text-gray-900 sm:text-white">
                    {event.scheduleStart ? 
                      new Date(event.scheduleStart).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'TBA'
                    }
                  </div>
                </div>
                
                {/* Duration */}
                {duration && (
                  <div className="bg-white/90 sm:bg-white/10 backdrop-blur-none sm:backdrop-blur-sm rounded-lg p-2 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700 sm:text-green-200 uppercase tracking-wide font-medium">Duration</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 sm:text-white">{duration}</div>
                  </div>
                )}
                
                {/* Language */}
                {event.language && (
                  <div className="bg-white/90 sm:bg-white/10 backdrop-blur-none sm:backdrop-blur-sm rounded-lg p-2 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.723 1.447a1 1 0 11-1.79-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 12.236 11.618 14z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-yellow-700 sm:text-yellow-200 uppercase tracking-wide font-medium">Language</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 sm:text-white">{event.language}</div>
                  </div>
                )}
              </div>
              
              {/* Venue - Hide for Online events */}
              {!event.isOnline && (
                <div className="bg-white/90 sm:bg-white/10 backdrop-blur-none sm:backdrop-blur-sm rounded-lg p-2 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700 sm:text-red-200 uppercase tracking-wide font-medium">Venue</span>
                  </div>
                  <div className="text-gray-900 sm:text-white">
                    <div className="text-base font-bold">{event.hall?.name || event.location || 'TBA'}</div>
                    {event.screen?.screen_no && (
                      <div className="text-sm text-gray-300">Screen {event.screen.screen_no}</div>
                    )}
                    <div className="text-sm text-gray-300 mt-1">
                      {event.hall?.area_name || event.area_name ? `${event.hall?.area_name || event.area_name}, ` : ''}{event.hall?.city || event.city}{event.hall?.state || event.state ? `, ${event.hall?.state || event.state}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-white">
                {event.maxParticipantAllowed !== undefined && event.type !== 'Seating' && (
                  <div>
                    <span className="text-gray-300">Capacity:</span>
                    <span className="ml-2 font-semibold">
                      {event.maxParticipantAllowed === 0 ? 'Unlimited' : event.maxParticipantAllowed}
                    </span>
                  </div>
                )}
                {event.totalBookings !== undefined && (
                  <div>
                    <span className="text-gray-300">Booked:</span>
                    <span className="ml-2 font-semibold">{event.totalBookings}</span>
                  </div>
                )}
              </div>
              
              {/* Book Button - Hidden on mobile */}
              <button
                className={`${font.mont} hidden sm:block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 focus:outline-none text-sm sm:text-base w-full sm:w-auto`}
                onClick={() => setShowTerms(true)}
              >
                {event.type === 'Registration' ? 'Register Now' : 'Book Now'}
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sticky Book Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 sm:hidden">
        <button
          className={`${font.mont} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-xl transition-all duration-200 focus:outline-none text-base w-full`}
          onClick={() => setShowTerms(true)}
        >
          {event.type === 'Registration' ? 'Register Now' : 'Book Now'}
        </button>
      </div>

      {/* About and Instructions Section */}
  <div className="max-w-4xl mx-auto sm:mt-6 md:mt-8 px-3 sm:px-4 pb-24 sm:pb-8">
        {/* About the Event */}
        <section className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            About the Event
          </h2>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              {event.description || "No description available."}
            </p>
          </div>
        </section>
        
        {/* Instructions */}
        {(event.eventInstructions || event.eligibility_criteria) && (
          <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              Instructions
            </h2>
            
            {event.eligibility_criteria && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Eligibility Criteria</h3>
                <p className="text-blue-800 leading-relaxed text-sm">{event.eligibility_criteria}</p>
              </div>
            )}
            
            {event.eventInstructions && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Event Guidelines</h3>
                {Array.isArray(event.eventInstructions) ? (
                  <ul className="list-disc pl-4 space-y-1 text-gray-700 text-sm">
                    {event.eventInstructions.filter(ins => ins && ins.trim()).map((ins, idx) => (
                      <li key={idx}>{ins}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-700 whitespace-pre-line text-sm">{event.eventInstructions}</div>
                )}
              </div>
            )}
          </section>
        )}
        
        {/* Organizer - Enhanced UI */}
        {event.organiserName && (
          <section className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              Organized by
            </h2>
            <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 w-full">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-gray-900">{event.organiserName}</span>
                <span className="text-xs text-gray-500 mt-1">Event Organiser</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Sticky Header */}
      {showStickyHeader && (
        <div className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 z-50 transition-all duration-300 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 truncate">{event.name}</h2>
            <button
              className={`${font.mont} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg transition-all duration-200 focus:outline-none`}
              onClick={() => setShowTerms(true)}
            >
              {event.type === 'Registration' ? 'Register' : 'Book Now'}
            </button>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white rounded-t-xl border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Terms & Conditions</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl font-bold focus:outline-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowTerms(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="px-0 sm:px-2">
              <TermsAndConditions />
            </div>
            
            <div className="sticky bottom-0 bg-white rounded-b-xl border-t border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow focus:outline-none transition-colors text-sm sm:text-base order-2 sm:order-1"
                  onClick={() => setShowTerms(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold shadow focus:outline-none transition-colors text-sm sm:text-base order-1 sm:order-2"
                  onClick={() => {
                    setShowTerms(false);
                    if (event.type === 'Registration') {
                      navigate(`/register-participants/${event.id}`);
                    } else if (event.type === 'Open') {
                      navigate(`/book/open/${event.id}`);
                    } else {
                      setBookingInfo({
                        eventDetails: {
                          eventId: event.id,
                          poster: event.posterUrl,
                          // ...other details if needed
                        }
                      });
                      navigate(`/book/s/${event.id}`);
                    }
                  }}
                >
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventInfo;