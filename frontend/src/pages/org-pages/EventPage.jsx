import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, MapPin, Users, BadgeCheck, Info, Clock, Building2, Monitor, Star, Globe, Heart, User } from "lucide-react";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hallInfo, setHallInfo] = useState(null);
  const [screenInfo, setScreenInfo] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/event/get-event/${eventId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch event details");
        }

        const data = await response.json();
        setEvent(data.data || {});
        // If hall/screen are present in the response, set them
        if (data.data && data.data.hall) setHallInfo(data.data.hall);
        else setHallInfo(null);
        if (data.data && data.data.screen) setScreenInfo(data.data.screen);
        else setScreenInfo(null);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Could not load event. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  // Remove the extra useEffect for fetching hall/screen

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-gray-300 font-medium animate-pulse">Loading event...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-red-400 font-medium">{error}</p>
      </div>
    );
  if (!event)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-gray-400 font-medium">No event found.</p>
      </div>
    );

  // Dynamic background style
  const bgPoster = event.posterUrl || "https://via.placeholder.com/800x1200?text=Event+Poster";

  return (
    <div className="relative min-h-screen w-full overflow-hidden rounded-2xl">
      {/* Blurred, darkened background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${bgPoster}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(16px) brightness(0.5)",
          transform: "scale(1.08)",
        }}
        aria-hidden="true"
      />
      {/* Overlay for extra dark effect */}
      <div className="absolute inset-0 bg-indigo-900/60 z-10" aria-hidden="true" />

      {/* Main content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen py-12 px-4 sm:px-5 lg:px-8">
        <div className="max-w-5xl w-full glass-card rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row p-8 gap-8">
            {/* Image Section */}
            <div className="w-56 h-80 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/20">
              <img
                src={bgPoster}
                alt={event.name || "Event"}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
              />
            </div>
            {/* Info Section */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h1 className="text-4xl font-semibold text-white mb-2 drop-shadow-lg animate-fade-in-up font-montserrat">
                  {event.name || "Unnamed Event"}
                </h1>
                <div className="flex items-center gap-3 text-indigo-200 mb-4 animate-fade-in-up delay-100">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {event.scheduleStart
                      ? new Date(event.scheduleStart).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })
                      : "Start time not set"}
                    {event.scheduleEnd &&
                      ` - ${new Date(event.scheduleEnd).toLocaleString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                      })}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 animate-fade-in-up delay-200">
                  {event.type && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/20 text-indigo-200 text-sm font-medium rounded-full">
                      <BadgeCheck className="w-4 h-4" /> {event.type}
                    </span>
                  )}
                  {event.sub_type && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/20 text-amber-200 text-sm font-medium rounded-full">
                      <Info className="w-4 h-4" /> {event.sub_type}
                    </span>
                  )}
                  {event.genre && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-200 text-sm font-medium rounded-full">
                      <Star className="w-4 h-4" /> {event.genre}
                    </span>
                  )}
                  {event.language && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-200 text-sm font-medium rounded-full">
                      <Globe className="w-4 h-4" /> {event.language}
                    </span>
                  )}
                  {event.ratingCode && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600/20 text-yellow-200 text-sm font-medium rounded-full">
                      <Star className="w-4 h-4" /> {event.ratingCode}
                    </span>
                  )}
                  {event.isOnline && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-200 text-sm font-medium rounded-full">
                      <Globe className="w-4 h-4" /> Online
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in-up delay-300">
                  {/* Event Stats */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-red-300" />
                      <span className="text-sm text-red-200 uppercase tracking-wide font-medium">Engagement</span>
                    </div>
                    <div className="space-y-2">
                      {event.likes_count !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-indigo-200">Likes:</span>
                          <span className="text-white font-semibold">{event.likes_count}</span>
                        </div>
                      )}
                      {event.totalBookings !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-indigo-200">Bookings:</span>
                          <span className="text-white font-semibold">{event.totalBookings}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-blue-300" />
                      <span className="text-sm text-blue-200 uppercase tracking-wide font-medium">Details</span>
                    </div>
                    <div className="space-y-2">
                      {event.scheduleStart && event.scheduleEnd && (() => {
                        const start = new Date(event.scheduleStart);
                        const end = new Date(event.scheduleEnd);
                        const diffMs = end - start;
                        if (diffMs > 0) {
                          const totalMinutes = Math.floor(diffMs / 60000);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          return (
                            <div className="flex justify-between">
                              <span className="text-indigo-200">Duration:</span>
                              <span className="text-white font-semibold">
                                {hours > 0 ? `${hours}h ` : ""}
                                {minutes > 0 ? `${minutes}m` : hours === 0 ? "0m" : ""}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {event.maxParticipantAllowed !== undefined && event.maxParticipantAllowed !== null && (
                        <div className="flex justify-between">
                          <span className="text-indigo-200">Capacity:</span>
                          <span className="text-white font-semibold">
                            {event.maxParticipantAllowed === 0 ? 'Unlimited' : event.maxParticipantAllowed}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-indigo-100 text-base animate-fade-in-up delay-300">
                  {/* Hall and Screen info for Seating events */}
                  {event.type === "Seating" && event.hallID && event.screenID && hallInfo && screenInfo && (
                    <div className="flex flex-col gap-1">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-blue-300 mr-1" />
                          Hall:
                        </span>
                        {hallInfo.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <Monitor className="w-4 h-4 text-purple-300 mr-1" />
                          Screen:
                        </span>
                        {screenInfo.screen_no ? `Screen ${screenInfo.screen_no}` : (screenInfo.name || screenInfo.id)}
                      </p>
                    </div>
                  )}
                  {event.location && event.city && event.state && (
                    <div className="flex flex-col gap-1">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-pink-300 mr-1" />
                          Location:
                        </span>
                        {event.location}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-pink-300 mr-1" />
                          City:
                        </span>
                        {event.city}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-pink-300 mr-1" />
                          State:
                        </span>
                        {event.state}
                      </p>
                    </div>
                  )}
                  {event.verificationStatus && (
                    <p className="flex items-center gap-2">
                      <BadgeCheck
                        className={
                          event.verificationStatus === "approved"
                            ? "w-4 h-4 text-green-400"
                            : event.verificationStatus === "rejected"
                            ? "w-4 h-4 text-red-400"
                            : "w-4 h-4 text-amber-400"
                        }
                      />
                      <span className="font-semibold">Status:</span>
                      <span
                        className={
                          event.verificationStatus === "approved"
                            ? "text-green-400"
                            : event.verificationStatus === "rejected"
                            ? "text-red-400"
                            : "text-amber-400"
                        }
                      >
                        {event.verificationStatus}
                      </span>
                    </p>
                  )}
                  {event.bookingCutoffType && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-300" />
                      <span className="font-semibold">Booking Cutoff:</span> {event.bookingCutoffType}
                    </p>
                  )}
                  {/* Don't show cutoff minutes if it's 0 or not set */}
                  {typeof event.bookingCutoffMinutesBeforeStart === "number" && event.bookingCutoffMinutesBeforeStart > 0 && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-300" />
                      <span className="font-semibold">Cutoff Time:</span> {event.bookingCutoffMinutesBeforeStart} minutes before start
                    </p>
                  )}
                  {event.bookingCutoffTimestamp && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-300" />
                      <span className="font-semibold">Cutoff Time:</span> {event.bookingCutoffTimestamp}
                    </p>
                  )}
                  {event.maxParticipantAllowed !== undefined && event.maxParticipantAllowed !== null && (
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-fuchsia-300" />
                      <span className="font-semibold">Max Participants:</span> {event.maxParticipantAllowed === 0 ? 'Unlimited' : event.maxParticipantAllowed}
                    </p>
                  )}
                  {event.eligibility_criteria && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-300 mr-1" />
                          Eligibility:
                        </span>
                        <span className="text-blue-100">{event.eligibility_criteria}</span>
                      </p>
                    </div>
                  )}
                  {event.organiser && (
                    <p className="flex items-center gap-2">
                      <span className="font-semibold flex items-center gap-1">
                        <User className="w-4 h-4 text-emerald-300 mr-1" />
                        Organizer:
                      </span>
                      {event.organiser}
                    </p>
                  )}
                  {(event.createdAt || event.updatedAt) && (
                    <div className="text-xs text-indigo-300 pt-2 border-t border-white/10">
                      {event.createdAt && (
                        <p>Created: {new Date(event.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      )}
                      {event.updatedAt && (
                        <p>Updated: {new Date(event.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {event.description && (
            <div className="p-8 border-t border-white/10 animate-fade-in-up delay-400">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2 font-montserrat">
                <Info className="w-6 h-6 text-indigo-200" /> About the Event
              </h2>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <p className="text-indigo-100 leading-relaxed text-base mb-4">
                  {event.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {event.name && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="font-semibold text-indigo-200">Event Name:</span>
                      <span className="text-indigo-100">{event.name}</span>
                    </div>
                  )}
                  {event.genre && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="font-semibold text-indigo-200">Genre:</span>
                      <span className="text-indigo-100">{event.genre}</span>
                    </div>
                  )}
                  {event.language && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="font-semibold text-indigo-200">Language:</span>
                      <span className="text-indigo-100">{event.language}</span>
                    </div>
                  )}
                  {event.ratingCode && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="font-semibold text-indigo-200">Rating:</span>
                      <span className="text-indigo-100">{event.ratingCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions Section */}
          {(event.eventInstructions || event.eligibility_criteria) && (
            <div className="p-8 border-t border-white/10 animate-fade-in-up delay-500">
              <h2 className="text-2xl font-semibold text-white font-montserrat mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-indigo-200" /> Instructions & Guidelines
              </h2>
              
              {event.eligibility_criteria && (
                <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Eligibility Criteria
                  </h3>
                  <p className="text-blue-100 leading-relaxed text-base">{event.eligibility_criteria}</p>
                </div>
              )}
              
              {event.eventInstructions && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="font-semibold text-indigo-200 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Event Guidelines
                  </h3>
                  <div className="text-indigo-100 leading-relaxed text-base">
                    {Array.isArray(event.eventInstructions) ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {event.eventInstructions.filter(ins => ins && ins.trim()).map((ins, idx) => (
                          <li key={idx}>{ins}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="whitespace-pre-line">
                        {event.eventInstructions
                          .split(/(?=\d+\.\s)/g)
                          .map((point, idx) => (
                            <div key={idx} className="mb-2">
                              {point.trim()}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Organizer Section */}
          {event.organiser && (
            <div className="p-8 border-t border-white/10 animate-fade-in-up delay-600">
              <h2 className="text-2xl font-semibold text-white font-montserrat mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-indigo-200" /> Organized by
              </h2>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{event.organiser}</h3>
                    <p className="text-indigo-200 text-sm">Event Organizer</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Custom glassmorphism and animation styles */}
      <style>{`
        .glass-card {
          background: rgba(30, 41, 59, 0.55);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
        }
        .animate-fade-in {
          animation: fadeIn 1s cubic-bezier(0.4,0,0.2,1) both;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.4,0,0.2,1) both;
        }
        .animate-fade-in-up.delay-100 { animation-delay: 0.1s; }
        .animate-fade-in-up.delay-200 { animation-delay: 0.2s; }
        .animate-fade-in-up.delay-300 { animation-delay: 0.3s; }
        .animate-fade-in-up.delay-400 { animation-delay: 0.4s; }
        .animate-fade-in-up.delay-500 { animation-delay: 0.5s; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default function EventPage() {
  return <EventDetails />;
}