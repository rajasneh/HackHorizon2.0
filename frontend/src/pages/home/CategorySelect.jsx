import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CardSection } from "../../components/Home/CardSection";
import { TktPlzLoader } from "../../components/Other/TktPlzLoader";
import { useLocation } from "../../context/LocationContext";
import { FiArrowLeft } from "react-icons/fi";

const CategorySelect = () => {
  const { subtype } = useParams();
  const navigate = useNavigate();
  const { city } = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/event/get-events-type/${subtype}`);
        const data = await res.json();
        let filtered = Array.isArray(data.data) ? data.data : [];
        if (city) {
          filtered = filtered.filter(e => e.city?.toLowerCase() === city.toLowerCase());
        }
        setEvents(filtered);
      } catch (e) {
        setError("Failed to load events.");
      }
      setLoading(false);
    };
    fetchEvents();
  }, [subtype, city]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10">
        {/* Header with Back Button and Subtype */}
        <div className="flex items-center gap-3 mb-8">
          <button
            className="p-2 rounded-full bg-white shadow hover:bg-blue-50 transition-colors border border-gray-200"
            onClick={() => navigate(-1)}
            aria-label="Go Back"
          >
            <FiArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 capitalize tracking-tight">
            {subtype ? subtype.replace(/-/g, " ") : "Events"}
          </h1>
        </div>

        {/* Loading State */}
        {loading ? (
          <TktPlzLoader />
        ) : error ? (
          <div className="text-center py-10 text-red-500 font-semibold text-lg">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-medium text-lg">
            No events found for this category in {city || "your city"}.
          </div>
        ) : (
          <CardSection events={events} grid />
        )}
      </div>
    </div>
  );
};

export default CategorySelect;