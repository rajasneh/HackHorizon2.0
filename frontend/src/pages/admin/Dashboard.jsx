import React, { useState, useEffect } from 'react';
import { Eye, Ban, Trash2, Calendar, Users, DollarSign, Ticket, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Icon size={48} className="mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-center">{description}</p>
    </div>
);

export const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/admin/get-dashboard', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            if (result.success) {
                setDashboardData(result.data);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 flex items-center justify-center min-h-screen">
                <div className="text-red-600 text-center">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const { totalEvents, totalOrganisers, totalUsers, ticketSold, grossRevenue, totalCancellations, organisers, events, ticketsData, issues } = dashboardData;

    return (
        <div className="p-4 flex flex-col gap-6">
            {/* Platform Summary */}
            <section id="platform-summary">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Platform Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Events', value: totalEvents, color: 'text-blue-600' },
                        { label: 'Organizers', value: totalOrganisers, color: 'text-purple-600' },
                        { label: 'Users', value: totalUsers, color: 'text-teal-600' },
                        { label: 'Tickets Sold', value: ticketSold, color: 'text-green-600' },
                        { label: 'Gross Revenue', value: `₹${parseFloat(grossRevenue).toLocaleString()}`, color: 'text-yellow-600' },
                        { label: 'Total Cancellations', value: totalCancellations, color: 'text-red-600' },
                        { label: 'Issues Pending', value: issues?.length || 0, color: 'text-red-600' },
                        { label: 'Payments Pending', value: issues?.length || 0, color: 'text-red-600' },
                    ].map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                            <p className="text-sm text-gray-500">{item.label}</p>
                            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Organizer Management */}
            <section id="organizer-management">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Organizers</h2>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    {organisers && organisers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3">Total Events</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {organisers.slice(0, 5).map((organizer, index) => (
                                        <tr key={index} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{organizer.name}</td>
                                            <td className="p-3">{organizer.email}</td>
                                            <td className="p-3">{organizer.phoneNo}</td>
                                            <td className="p-3">{organizer.totalEvents}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {organisers.length > 5 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => window.location.href = '/admin/organizers'}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        View More ({organisers.length - 5} more)
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title="No Organizers Found"
                            description="No organizers have been registered yet."
                        />
                    )}
                </div>
            </section>

            {/* Event Management */}
            <section id="event-management">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Events</h2>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    {events && events.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3">Event Name</th>
                                        <th className="p-3">Organizer</th>
                                        <th className="p-3">Start Date</th>
                                        <th className="p-3">Total Bookings</th>
                                        <th className="p-3">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.slice(0, 5).map((event, index) => (
                                        <tr key={index} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{event.name}</td>
                                            <td className="p-3">{event.organiserName}</td>
                                            <td className="p-3">{new Date(event.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                                            <td className="p-3">{event.totalBookings}</td>
                                            <td className="p-3">₹{event.revenue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {events.length > 5 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => navigate('/moderator/adm/event-management')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        View More
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Calendar}
                            title="No Events Found"
                            description="No events have been created yet."
                        />
                    )}
                </div>
            </section>

            {/* Tickets Data */}
            <section id="tickets-data">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Ticket Bookings</h2>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    {ticketsData && ticketsData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3">User Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Event Name</th>
                                        <th className="p-3">Booked At</th>
                                        <th className="p-3">Order ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ticketsData.slice(0, 5).map((ticket, index) => (
                                        <tr key={index} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{ticket.userName}</td>
                                            <td className="p-3">{ticket.userEmail}</td>
                                            <td className="p-3">{ticket.eventName}</td>
                                            <td className="p-3">{new Date(ticket.ticketBookedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                                            <td className="p-3">{ticket.orderId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {ticketsData.length > 5 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => window.location.href = '/admin/tickets'}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        View More ({ticketsData.length - 5} more)
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Ticket}
                            title="No Tickets Found"
                            description="No tickets have been booked yet."
                        />
                    )}
                </div>
            </section>

            {/* Issues Management */}
            <section id="issues-management">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Issues</h2>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    {issues && issues.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Subject</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.slice(0, 5).map((issue, index) => (
                                        <tr key={index} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{issue.name}</td>
                                            <td className="p-3">{issue.email}</td>
                                            <td className="p-3">{issue.subject}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'open' ? 'bg-red-100 text-red-800' :
                                                        issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {issue.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3">{new Date(issue.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {issues.length > 5 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => navigate('/moderator/adm/support')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        View More ({issues.length - 5} more)
                                    </button>
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => navigate('/moderator/adm/support')}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Check All Issues
                                </button>
                            </div>
                        </div>
                    ) : (
                        <EmptyState
                            icon={AlertTriangle}
                            title="No Issues Found"
                            description="No issues have been reported yet."
                        />
                    )}
                </div>
            </section>
        </div>
    );
};