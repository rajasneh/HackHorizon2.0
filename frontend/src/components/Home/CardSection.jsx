import React, { useState, useRef, useEffect } from "react";
import { FiHeart, FiShare2, FiClock, FiMapPin, FiStar, FiUsers, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";


export const CardSection = ({ name, events: propEvents, grid = false }) => {
    const eventsToShow = Array.isArray(propEvents) && propEvents.length > 0 ? propEvents : [];
    const [likedEvents, setLikedEvents] = useState(
        propEvents ? propEvents.reduce((acc, event) => ({ ...acc, [event.id]: event.isLiked || false }), {}) : {}
    );
    const scrollRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const navigate = useNavigate();

    const checkArrows = () => {
        const el = scrollRef.current;
        if (!el) return;
        setShowLeft(el.scrollLeft > 0);
        setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        checkArrows();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkArrows);
        window.addEventListener('resize', checkArrows);
        return () => {
            el.removeEventListener('scroll', checkArrows);
            window.removeEventListener('resize', checkArrows);
        };
    }, []);

    const scrollBy = (offset) => {
        scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
    };
 
    const toggleLike = (eventId) => {
        setLikedEvents(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    };

    return (
        <section className="w-full relative">
            {/* Section Title */}
            {name && (
                <h3 className="text-2xl font-bold mb-4 ml-2 text-gray-800">{name}</h3>
            )}
            {grid ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2 px-1">
                    {eventsToShow.map((event) => (
                        <div
                            key={event.id}
                            className="group bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer flex flex-col"
                            onClick={() => navigate(`/event/${event._id || event.id}`)}
                        >
                            {/* Image Container */}
                            <div className="relative overflow-hidden">
                                <img
                                    src={event.posterUrl}
                                    alt={event.name}
                                    className="w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {/* Likes */}
                                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                    <FiHeart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 fill-current" />
                                    <span className="text-white text-xs font-medium">{event.likes_count || 0}</span>
                                </div>
                            </div>
                            {/* Content */}
                            <div className="p-2 sm:p-3 md:p-4">
                                {/* Event Name */}
                                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                                    {event.name}
                                </h3>
                                {/* Event Details */}
                                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-gray-600 text-xs">
                                    <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                                    <span className="truncate text-xs">
                                        {new Date(event.scheduleStart).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Arrow Buttons */}
                    {showLeft && (
                        <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-1.5 sm:p-2 md:p-3 rounded-full"
                            style={{ marginLeft: '-12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                            onClick={() => scrollBy(-200)}
                            aria-label="Scroll left"
                        >
                            <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </button>
                    )}
                    {showRight && (
                        <button
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-1.5 sm:p-2 md:p-3 rounded-full"
                            style={{ marginRight: '-12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                            onClick={() => scrollBy(200)}
                            aria-label="Scroll right"
                        >
                            <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </button>
                    )}
                    <div
                        ref={scrollRef}
                        className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
                        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                    >
                        {eventsToShow.map((event) => (
                            <div
                                key={event.id}
                                className="w-[160px] sm:w-[180px] md:w-[220px] lg:w-[260px] flex-shrink-0 group bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer touch-manipulation flex flex-col"
                                onClick={() => navigate(`/event/${event._id || event.id}`)}
                            >
                                {/* Image Container */}
                                <div className="relative overflow-hidden">
                                    <img
                                        src={event.posterUrl}
                                        alt={event.name}
                                        className="w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    {/* Likes */}
                                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                        <FiHeart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 fill-current" />
                                        <span className="text-white text-xs font-medium">{event.likes_count || 0}</span>
                                    </div>
                                </div>
                                {/* Content */}
                                <div className="p-2 sm:p-3 md:p-4">
                                    {/* Event Name */}
                                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                                        {event.name}
                                    </h3>
                                    {/* Event Details */}
                                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-gray-600 text-xs">
                                        <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                                        <span className="truncate text-xs">
                                            {new Date(event.scheduleStart).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

