import { Banner } from "../../components/Home/Banner";
import { CardSection } from "../../components/Home/CardSection";
import { Header } from "../../components/Home/Header";
import ImageCarousel from "../../components/Home/ImageCarousel";
import { useAuth } from "../../context/AuthContext";
import { TktPlzLoader } from "../../components/Other/TktPlzLoader";
import { useEffect, useState } from "react";
import { getAllEvents } from "../../api/Home";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "../../context/LocationContext";
import { Instagram, Mail, Info, FileText, Undo2, Truck } from "lucide-react";

const allCities = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Ahmedabad", "Chandigarh", "Chennai", "Pune", "Kolkata", "Kochi",
  "Jamshedpur", "Ranchi", "Lucknow", "Indore", "Bhopal", "Nagpur", "Jaipur", "Surat", "Patna", "Kanpur", "Varanasi", "Agra", "Vadodara", "Ludhiana", "Nashik", "Meerut", "Rajkot", "Amritsar", "Allahabad", "Aurangabad"
];

const CityPickerModal = ({ open, onClose, onSelect, currentCity }) => {
  const [search, setSearch] = useState("");
  if (!open) return null;
  const filteredCities = allCities.filter(city => city.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col relative">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Select Your City</h2>
          <button
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search cities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredCities.length > 0 ? filteredCities.map(city => (
              <button
                key={city}
                className={`px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${currentCity === city
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                onClick={() => onSelect(city)}
              >
                {city}
              </button>
            )) : (
              <div className="col-span-1 sm:col-span-2 text-center py-6 sm:py-8 text-gray-500">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306" />
                </svg>
                <p className="text-sm">No cities found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HomePage = () => {
  const { loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const { city, setCityState } = useLocation();
  const [cityModalOpen, setCityModalOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleCitySelect = (selectedCity) => {
    setCityState(selectedCity, "Jharkhand");
    setCityModalOpen(false);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['eventData'],
    queryFn: getAllEvents
  });

  if (isLoading) return <TktPlzLoader />;
  if (error) return <div>Error: {error.message}</div>;

  const allEvents = data?.data || [];
  const filteredEvents = city ? allEvents.filter(e => e.city?.toLowerCase() === city.toLowerCase()) : allEvents;

  // Event filtering by type
  const movieEvents = filteredEvents.filter(event => event.type === 'Seating' && event.sub_type === 'Movie');
  const liveEvents = filteredEvents.filter(event => event.type === 'Open' && event.sub_type === 'Concert');
  const onlineEvents = allEvents.filter(event => event.type === 'Online');
  const upcomingEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.scheduleStart);
    const now = new Date();
    return eventDate > now;
  });
  const hackathons = allEvents.filter(event => event.type === 'Registration' && event.sub_type === 'Hackathon');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header onLocationClick={() => setCityModalOpen(true)} currentCity={city} events={filteredEvents} />
      <CityPickerModal
        open={cityModalOpen || !city} // Keep modal open if city is not selected
        onClose={() => {
          if (city) {
            setCityModalOpen(false); // Only close if city is selected
          }
        }}
        onSelect={handleCitySelect}
      />

      {loading ? (
        <TktPlzLoader />
      ) : (
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Hero Section */}
          {/* <section className="relative">
            <ImageCarousel />
          </section> */}

          {/* Welcome Section */}
          {/* <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {city ? `Events in ${city}` : 'Discover Amazing Events'}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {city 
                  ? `Explore the best events happening in ${city}. From movies to concerts, find your perfect entertainment.`
                  : 'Select your city to discover local events, movies, concerts, and more.'
                }
              </p>
            </div>
          </section> */}

          {/* Movies Section */}
          {movieEvents.length > 0 && (
            <section className="py-6 md:py-8 px-3 md:px-4">
              <div className="max-w-7xl mx-auto">
                <div className="mb-4 md:mb-8 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 leading-tight">Latest movies near you</h2>
                  {/* <p className="text-gray-600 text-sm sm:text-base md:text-lg">Latest movies in theaters near you</p> */}
                </div>
                <CardSection events={movieEvents} />
              </div>
            </section>
          )}

          {/* Live Events Section */}
          {liveEvents.length > 0 && (
            <section className="py-6 md:py-8 px-3 md:px-4 bg-white/50">
              <div className="max-w-7xl mx-auto">
                <div className="mb-4 md:mb-8 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 leading-tight">Experience the energy of Live Performances</h2>
                  {/* <p className="text-gray-600 text-sm sm:text-base md:text-lg">Experience the energy of live performances</p> */}
                </div>
                <CardSection events={liveEvents} />
              </div>
            </section>
          )}

          {/* Online Events Section */}
          {onlineEvents.length > 0 && (
            <section className="py-6 md:py-8 px-3 md:px-4">
              <div className="max-w-7xl mx-auto">
                <div className="mb-4 md:mb-8 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 leading-tight">Join events from anywhere in the world</h2>
                  {/* <p className="text-gray-600 text-sm sm:text-base md:text-lg">Join events from anywhere in the world</p> */}
                </div>
                <CardSection events={onlineEvents} />
              </div>
            </section>
          )}

          {/* Hackathon Section */}
          {hackathons.length > 0 && (
            <section className="py-6 md:py-8 px-3 md:px-4 bg-white/50">
              <div className="max-w-7xl mx-auto">
                <div className="mb-4 md:mb-8 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 leading-tight">Participate in exciting hackathons</h2>
                  {/* <p className="text-gray-600 text-sm sm:text-base md:text-lg">Participate in exciting hackathons</p> */}
                </div>
                <CardSection events={hackathons} />
              </div>
            </section>
          )}

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <section className="py-6 md:py-8 px-3 md:px-4 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="max-w-7xl mx-auto">
                <div className="mb-4 md:mb-8 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 leading-tight">Coming Soon</h2>
                </div>
                <CardSection events={upcomingEvents} />
              </div>
            </section>
          )}
        </div>
      )}
      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 mt-10">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dgxc8nspo/image/upload/v1756377392/posters/aezej67pxo3kucstndsv.png"
              alt="TKTPLZ Logo"
              className="h-12 w-auto object-cover object-center rounded-lg"
            />
          </div>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-end items-center text-sm">
            <a href="/about" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"><Info size={18} />About Us</a>
            <a href="https://merchant.razorpay.com/policy/R2MMboAezIFPUs/shipping" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"><Truck size={18} />Shipping</a>
            <a href="https://merchant.razorpay.com/policy/R2MMboAezIFPUs/terms" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"><FileText size={18} />Terms &amp; Conditions</a>
            <a href="https://merchant.razorpay.com/policy/R2MMboAezIFPUs/refund" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"><Undo2 size={18} />Cancellation &amp; Refunds</a>
          </div>
          <div className="flex gap-3">
            <a href="https://www.instagram.com/tktplz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition"><Instagram size={24} /></a>
            <a href="mailto:support@tktplz.com" className="text-gray-400 hover:text-blue-500 transition"><Mail size={24} /></a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-4 text-gray-500 text-xs text-center">
          &copy; {new Date().getFullYear()} TKTPLZ. All rights reserved. <span className="hidden sm:inline">|</span> Made with <span className="text-red-500">&#10084;</span> for event lovers.
        </div>
      </footer>
    </div>
  );
}