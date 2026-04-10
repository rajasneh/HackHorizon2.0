import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

const SearchModal = ({ isOpen, onClose, events = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
 
  // Efficient search using useMemo
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return events.filter(event => 
      event.name?.toLowerCase().includes(query) ||
      event.sub_type?.toLowerCase().includes(query) ||
      event.type?.toLowerCase().includes(query) ||
      event.city?.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results for performance
  }, [searchQuery, events]);

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Search Events</h2>
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

        {/* Search Input */}
        <div className="p-6 pb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for events, movies, concerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {!searchQuery.trim() ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">Start typing to search events</p>
              <p className="text-sm mt-1">Find movies, concerts, workshops and more</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306" />
              </svg>
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm mt-1">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.posterUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/Banner.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {event.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.sub_type} • {event.city}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.scheduleStart).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchModal;