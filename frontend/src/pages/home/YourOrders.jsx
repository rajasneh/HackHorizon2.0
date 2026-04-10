import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft } from 'lucide-react';

export const YourOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => { 
      const userId = user?.userData?.id || user?.id;
      if (!userId) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/user/get-orders/${userId}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleOrderClick = (order) => {
    navigate(`/order-details/${order.id}`, { state: { orderData: order } });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED - REFUND DUE':
        return 'text-orange-600 bg-orange-100';
      case 'CANCELLED - REFUND PROCESSED':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isCancelled = (status) => {
    return status && status.startsWith('CANCELLED');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4 sm:mb-6 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 focus:outline-none text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </button>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600 text-sm sm:text-base">View and manage your ticket bookings</p>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">⏳</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Loading orders...</h3>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">🎫</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 text-sm sm:text-base">Start booking tickets to see your orders here</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => !isCancelled(order.status) && handleOrderClick(order)}
                className={`rounded-lg shadow-md transition-all ${
                  isCancelled(order.status)
                    ? 'bg-gray-50 border-2 border-red-200 opacity-75 cursor-not-allowed'
                    : 'bg-white hover:shadow-lg border border-gray-200 cursor-pointer'
                }`}
              >
                <div className="p-4 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={order.posterUrl || order.event?.posterUrl}
                          alt={order.event?.name || 'Event'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/images/Banner.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold mb-1 truncate ${
                          isCancelled(order.status) ? 'text-gray-600 line-through' : 'text-gray-900'
                        }`}>
                          {order.eventDetails?.eventName || 'Event Name'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 truncate">
                          ID: {order.bookingID}
                        </p>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-semibold ${
                          isCancelled(order.status) ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          ₹{order.totalAmount}
                        </div>
                        {isCancelled(order.status) && (
                          <div className="text-xs text-red-600 mt-1">
                            Refund {order.status.includes('PROCESSED') ? 'Processed' : 'Initiated'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`flex flex-wrap gap-2 text-xs ${
                      isCancelled(order.status) ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <span>{isCancelled(order.status) ? '❌' : '📅'} {formatDate(order.createdAt)}</span>
                      <span>🎫 {order.numberOfTickets} ticket{order.numberOfTickets > 1 ? 's' : ''}</span>
                      {order.zone && <span>📍 {order.zone}</span>}
                      {order.team_name && <span>👥 {order.team_name}</span>}
                    </div>
                    {order.seat_no && order.seat_no.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-600">
                          Seats: {Array.isArray(order.seat_no) ? order.seat_no.join(', ') : order.seat_no}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={order.posterUrl || order.event?.posterUrl}
                            alt={order.event?.name || 'Event'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/images/Banner.png';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-xl font-semibold mb-1 ${
                            isCancelled(order.status) ? 'text-gray-600 line-through' : 'text-gray-900'
                          }`}>
                            {order.eventDetails?.eventName || 'Event Name'}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            Booking ID: {order.bookingID}
                          </p>
                          <div className={`flex items-center space-x-4 text-sm ${
                            isCancelled(order.status) ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            <span>{isCancelled(order.status) ? '❌' : '📅'} {formatDate(order.createdAt)}</span>
                            <span>🎫 {order.numberOfTickets} ticket{order.numberOfTickets > 1 ? 's' : ''}</span>
                            {order.zone && <span>📍 {order.zone}</span>}
                            {order.team_name && <span>👥 {order.team_name}</span>}
                          </div>
                          {order.seat_no && order.seat_no.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">
                                Seats: {Array.isArray(order.seat_no) ? order.seat_no.join(', ') : order.seat_no}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </div>
                        <div className={`mt-2 text-lg font-semibold ${
                          isCancelled(order.status) ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          ₹{order.totalAmount}
                        </div>
                        {isCancelled(order.status) && (
                          <div className="text-xs text-red-600 mt-1">
                            Refund {order.status.includes('PROCESSED') ? 'Processed' : 'Initiated'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};