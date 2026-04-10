import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Eye } from 'lucide-react';

const Analytics = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { 
    const fetchEvents = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/event/get-events/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const result = await response.json();
        
        if (result.success) {
          setEvents(result.organiserEvents || []);
        } else {
          setError(result.message || 'Failed to fetch events');
        }
      } catch (err) {
        console.error('Events API error:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.id]);

  const getEventStatus = (scheduleStart, scheduleEnd) => {
    const now = new Date();
    const start = new Date(scheduleStart);
    const end = new Date(scheduleEnd);

    if (now < start) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    } else if (now >= start && now <= end) {
      return { status: 'ongoing', label: 'Ongoing', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/organiser/analytics-details/${eventId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Events</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Event Analytics</h1>
        <div className="text-sm text-gray-500">
          Total Events: {events.length}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-500 text-center mb-4 max-w-sm">
            You haven't created any events yet. Create your first event to see analytics.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => {
                  const eventStatus = getEventStatus(event.scheduleStart, event.scheduleEnd);
                  return (
                    <tr 
                      key={event.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            {event.posterUrl ? (
                              <img
                                className="h-16 w-16 rounded-lg object-cover"
                                src={event.posterUrl}
                                alt={event.name}
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {event.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {event.location || event.city || 'Location not specified'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div>{new Date(event.scheduleStart).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.scheduleStart).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${eventStatus.color}`}>
                          {eventStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="capitalize">{event.type}</div>
                        <div className="text-xs text-gray-500 capitalize">{event.sub_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          {event.totalBookings || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;