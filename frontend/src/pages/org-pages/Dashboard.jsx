import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Calendar, Users, DollarSign, BarChart3, MessageSquare, FileText, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#1A73E8', '#34D399', '#FBBF24'];

// Empty state component
const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-center mb-4 max-w-sm">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {actionText}
      </button>
    )}
  </div>
);

export const OrganiserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/organizer/dashboard-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ organiserId: user.id })
        });

        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Dashboard API error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

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
            <MessageSquare className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { ticketsSold, grossRevenue, totalEvents, events, ticketDetails, revenueByEvent, pendingPayments } = dashboardData || {};
  const activeEvents = events ? events.filter(event => event.verificationStatus === 'approved').length : 0;
  console.log('Dashboard data:', dashboardData);
  console.log('Revenue by event:', revenueByEvent);
  
  const pieData = revenueByEvent && Object.keys(revenueByEvent).length > 0 
    ? Object.entries(revenueByEvent).map(([name, value]) => ({ name, value: Number(value) || 0 })).filter(event => event.value > 0)
    : events && events.length > 0 
      ? events.map(event => ({ name: event.name, value: Number(event.totalRevenue) || 0 })).filter(event => event.value > 0)
      : [];
      
  console.log('Pie data:', pieData);

  return (
  <div className="space-y-8 px-2 sm:px-4 md:px-8 max-w-6xl mx-auto">
      {/* Dashboard Summary */}
      <section id="dashboard">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Summary</h3>
        {/* Responsive: 2-row 2-col grid on mobile, 4-col on desktop. Smaller badge and text for mobile. */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:grid-cols-2 sm:grid-rows-2 lg:grid-cols-4 lg:grid-rows-1 lg:gap-6">
          {/* Total Events */}
          <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Total Events</h4>
              <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">{totalEvents}</p>
            </div>
          </div>
          {/* Tickets Sold */}
          <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Tickets Sold</h4>
              <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">{ticketsSold}</p>
            </div>
          </div>
          {/* Gross Revenue */}
          <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Gross Revenue</h4>
              <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">₹{grossRevenue}</p>
            </div>
          </div>
          {/* Pending Payments */}
          <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Pending Payments</h4>
              <p className="text-xl sm:text-3xl font-bold text-red-600 mt-1">₹{pendingPayments || 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* My Events */}
      <section id="events">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">My Events</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {!events || events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Events Created Yet"
              description="Start by creating your first event to manage bookings and track performance."
              actionText="Create Event"
              onAction={() => window.location.href = '/organiser/create-event'}
            />
          ) : (
            <div className="overflow-x-auto custom-scroll">
              <table className="min-w-[500px] w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Event Name</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Date</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Tickets Sold</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map(event => (
                    <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{event.name}</td>
                      <td className="p-4 text-gray-600">{new Date(event.scheduleStart).toLocaleDateString()}</td>
                      <td className="p-4 text-gray-600">{event.totalBookings || 0}</td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          event.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          event.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{event.verificationStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length > 5 && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <button 
                    onClick={() => window.location.href = '/organiser/events'}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg"
                  >
                    View All Events ({events.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Financial Summary */}
      <section id="financials">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Financial Summary</h3>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Revenue Summary</h4>
            {pieData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No revenue data available</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center">
                <PieChart width={180} height={180}>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={70} 
                    innerRadius={30}
                    fill="#8884d8"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie> 
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                </PieChart>
                <div className="sm:ml-4 mt-4 sm:mt-0 space-y-2 w-full">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-gray-700 truncate max-w-[100px]">{entry.name}</span>
                      <span className="ml-2 text-gray-500">₹{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 uppercase p-4">Recent Transactions</h4>
            {!ticketDetails || ticketDetails.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Transactions Yet"
                description="Transaction history will appear here once customers start booking your events."
              />
            ) : (
              <div className="overflow-x-auto custom-scroll">
                <table className="min-w-[400px] w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 text-sm font-medium text-gray-500 uppercase">Customer</th>
                      <th className="p-4 text-sm font-medium text-gray-500 uppercase">Amount</th>
                      <th className="p-4 text-sm font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketDetails.slice(0, 5).map(ticket => (
                      <tr key={ticket.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4 text-gray-800">{ticket.user?.name || 'Unknown'}</td>
                        <td className="p-4 text-gray-600">₹{ticket.totalAmount}</td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{ticket.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ticketDetails.length > 5 && (
                  <div className="p-4 border-t border-gray-100 text-center">
                    <button 
                      onClick={() => window.location.href = '/organiser/transactions'}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg"
                    >
                      View All Transactions ({ticketDetails.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Attendees */}
      <section id="attendees">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Attendees</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {!ticketDetails || ticketDetails.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Attendees Yet"
              description="Customer information will appear here once people start booking your events."
            />
          ) : (
            <div className="overflow-x-auto custom-scroll">
              <table className="min-w-[400px] w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Name</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Email</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Ticket Type</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketDetails.slice(0, 5).map(ticket => (
                    <tr key={ticket.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{ticket.user?.name || 'Unknown'}</td>
                      <td className="p-4 text-gray-600">{ticket.user?.email || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{ticket.ticketType}</td>
                      <td className="p-4 text-gray-600">{ticket.numberOfTickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ticketDetails.length > 5 && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <button 
                    onClick={() => window.location.href = '/organiser/attendees'}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg"
                  >
                    View All Attendees ({ticketDetails.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Messages */}
      <section id="messages">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Messages</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <EmptyState
            icon={MessageSquare}
            title="No Messages"
            description="Customer messages and support requests will appear here."
          />
        </div>
      </section>
    </div>
  );
};