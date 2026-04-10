import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, Ticket, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

const AnalyticsDetails = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { eventId } = useParams();
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchAnalytics = async () => {
      try { 
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/organizer/analytics-data/${eventId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const result = await response.json();
        
        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          setError(result.message || 'Failed to fetch analytics');
        }
      } catch (err) {
        console.error('Analytics API error:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchAnalytics();
    }
  }, [eventId]);

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
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { totalTickets, amountMade, ticketTypes, ticketStatus, userTicketData, eventData } = analyticsData;

  const filteredUserData = userTicketData.filter(user => {
    const typeMatch = typeFilter === 'all' || user.ticket_type === typeFilter;
    const statusMatch = statusFilter === 'all' || user.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const uniqueTypes = [...new Set(userTicketData.map(user => user.ticket_type))];
  const uniqueStatuses = [...new Set(userTicketData.map(user => user.status))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-0 flex-wrap">
          <button 
            onClick={() => navigate('/organiser/analytics')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {eventData.posterUrl && (
            <img
              src={eventData.posterUrl}
              alt={eventData.eventName}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-row items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">{eventData.eventName}</h1>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              eventData.isCompleted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {eventData.isCompleted ? 'Completed' : 'Ongoing'}
            </span>
          </div>
          <div className="flex flex-row items-center gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(eventData.eventStart).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(eventData.eventStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Capacity</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalTickets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{amountMade}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Confirmed</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{ticketStatus.CONFIRMED || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Cancelled</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {Object.keys(ticketStatus).filter(key => key.includes('CANCELLED')).reduce((sum, key) => sum + ticketStatus[key], 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Tickets Sold by Type</h3>
        {Object.keys(ticketTypes).length === 0 ? (
          <p className="text-gray-500 text-center py-6 sm:py-8">No tickets sold yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            {Object.entries(ticketTypes).map(([type, count]) => (
              <div key={type} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{type}</span>
                  <span className="text-lg sm:text-2xl font-bold text-blue-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Ticket Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-3 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customer Bookings</h3>
            <div className="flex gap-2 sm:gap-3">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-1 sm:px-3 sm:py-1 border border-gray-300 rounded-md text-xs sm:text-sm"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 sm:px-3 sm:py-1 border border-gray-300 rounded-md text-xs sm:text-sm"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {filteredUserData.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">{userTicketData.length === 0 ? 'No bookings yet' : 'No bookings match the selected filters'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Ticket Type</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Booked At</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUserData.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-gray-900">{user.ticket_type}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-gray-900">{user.numberOfTickets}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {user.purchasedAt ? new Date(user.purchasedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'CONFIRMED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDetails;