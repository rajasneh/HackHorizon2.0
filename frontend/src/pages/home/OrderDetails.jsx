import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Info, X } from 'lucide-react';
import QRCode from 'react-qr-code';

// Print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-area, .print-area * {
      visibility: visible;
    }
    .print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1.0);
    }
  }
  
  .animate-bounce {
    animation: bounce 1.4s infinite ease-in-out both;
  }
`;

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);
  
  const order = location.state?.orderData;
  // console.log("Order : ", order);

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!orderId) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/user/getQR/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const result = await response.json();
        
        if (result.success && result.qrCode) {
          setQrCode(result.qrCode);
        }
      } catch (err) {
        console.error('Error fetching QR code:', err);
      } finally {
        setQrLoading(false);
      }
    };

    fetchQRCode();
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/your-orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Restrict access for any cancelled tickets
  if (order.status && order.status.startsWith('CANCELLED')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Cancelled</h2>
          <p className="text-gray-600 mb-4">This ticket has been cancelled and is no longer accessible.</p>
          <button
            onClick={() => navigate('/your-orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button> 
        </div>
      </div>
    );
  }

  const handlePrintTicket = async () => { 
    setIsDownloading(true);
    try {
      const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/ticket/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.orderId
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${order.bookingID}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
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
        return 'text-green-600 bg-green-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'CANCELLED - REFUND DUE':
        return (
          <div className="flex items-center space-x-2">
            <span>Cancelled</span>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">Refund Due</span>
          </div>
        );
      case 'CANCELLED - REFUND PROCESSED':
        return (
          <div className="flex items-center space-x-2">
            <span>Cancelled</span>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">✓ Refund Processed</span>
          </div>
        );
      default:
        return status;
    }
  };

  const canCancelTicket = () => {
    if (order.status !== 'CONFIRMED') return false;
    const eventStart = new Date(order.eventDetails?.eventStart);
    const now = new Date();
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
    return hoursUntilEvent > 12;
  };

  const handleCancelTicket = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.orderId,
          refundAmount: order.totalAmount
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Ticket cancelled successfully! Refund will be processed within 5-7 business days.');
        setShowCancelModal(false);
        navigate('/your-orders');
      } else {
        alert(data.error || 'Failed to cancel ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      alert('Failed to cancel ticket. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8 font-montserrat">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Header */}

        <div className="no-print mb-6 sm:mb-8">
          {/* Mobile: Back & Download buttons justified between */}
          <div className="flex sm:hidden justify-between items-center w-full gap-2 mb-3">
            <button
              onClick={() => navigate('/your-orders')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 focus:outline-none text-sm w-fit"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handlePrintTicket}
              disabled={isDownloading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <span>🖨️</span>
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
          {/* Desktop: Back, Cancel, Download buttons as before */}
          <div className="hidden sm:flex flex-row items-center justify-between w-full">
            <button
              onClick={() => navigate('/your-orders')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 focus:outline-none text-base w-fit"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Orders</span>
            </button>
            <div className="flex flex-row items-center space-x-3">
              {canCancelTicket() && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 items-center justify-center space-x-2 text-base sm:block hidden"
                >
                  <span>❌</span>
                  <span>Cancel Ticket</span>
                </button>
              )}
              <button
                onClick={handlePrintTicket}
                disabled={isDownloading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-base"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <span>🖨️</span>
                    <span>Download Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print-area">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 break-words">{order.eventDetails?.eventName || 'Event Name'}</h1>
                <p className="text-blue-100 text-sm sm:text-base break-all">Booking ID: {order.bookingID}</p>
              </div>
              <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.status)} flex-shrink-0 w-fit`}>
                {getStatusDisplay(order.status)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Event Poster */}
              <div className="flex justify-center order-2 lg:order-1">
                <div className="w-full max-w-xs sm:max-w-sm lg:max-w-lg xl:max-w-xl">
                  <img
                    src={order.posterUrl || order.event?.posterUrl}
                    alt={order.event?.name || 'Event'}
                    className="w-full h-40 xs:h-48 sm:h-56 lg:h-80 xl:h-96 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src = '/images/Banner.png';
                    }}
                  />
                </div>
              </div>

              {/* Event Information */}
              <div className="space-y-4 sm:space-y-5 order-1 lg:order-2">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Event Details
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-sm">
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm">Date:</span>
                      <span className="break-words text-gray-900 text-xs sm:text-sm">{order.eventDetails?.eventStart ? new Date(order.eventDetails.eventStart).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm">Time:</span>
                      <span className="break-words text-gray-900 text-xs sm:text-sm">{order.eventDetails?.eventStart ? new Date(order.eventDetails.eventStart).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    {order.eventType !== 'Online' && (
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm">Venue:</span>
                        <span className="break-words text-gray-900 text-xs sm:text-sm">{
                          order.eventType === 'Seating' 
                            ? `${order.hall_name || 'N/A'}${order.eventDetails.city ? `, ${order.eventDetails.city}` : ''}${order.eventDetails.state ? `, ${order.eventDetails.state}` : ''}` 
                            : `${order.eventDetails.area_name || 'N/A'}${order.eventDetails.city ? `, ${order.eventDetails.city}` : ''}${order.eventDetails.state ? `, ${order.eventDetails.state}` : ''}`
                        }</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm">Type:</span>
                      <span className="break-words text-gray-900 text-xs sm:text-sm">{order.eventType}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Booking Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Tickets:</span>
                      <span className="break-words text-gray-900 font-semibold text-xs sm:text-sm">{order.numberOfTickets}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Amount:</span>
                      <span className="break-words font-bold text-green-600 text-sm sm:text-base">₹{order.totalAmount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Payment:</span>
                      <span className="break-words text-gray-900 text-xs sm:text-sm">{order.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Booked:</span>
                      <span className="break-words text-gray-900 text-xs sm:text-sm text-right">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Additional Details Based on Event Type */}
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              {/* Seating Information - Enhanced UI */}
              {(order.seatNumbers || order.zone || order.hall_name) && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-300 shadow-md">
                  <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    Seating Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.seatNumbers && (
                      <div className="bg-white hover:shadow-lg transition-shadow p-4 rounded-lg border border-blue-100 flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" /></svg>
                          <span className="font-semibold text-blue-700 text-sm">Seats</span>
                        </div>
                        <span className="break-words text-gray-900 text-base font-bold tracking-wide">{order.seat_no}</span>
                      </div>
                    )}
                    {order.zone && (
                      <div className="bg-white hover:shadow-lg transition-shadow p-4 rounded-lg border border-blue-100 flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                          <span className="font-semibold text-purple-700 text-sm">Zone</span>
                        </div>
                        <span className="break-words text-gray-900 text-base font-bold tracking-wide">{order.zone}</span>
                        <span className="text-xs text-gray-500 mt-1">Tickets: {order.numberOfTickets}</span>
                      </div>
                    )}
                    {order.hall_name && (
                      <div className="bg-white hover:shadow-lg transition-shadow p-4 rounded-lg border border-blue-100 flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2" /></svg>
                          <span className="font-semibold text-green-700 text-sm">Hall</span>
                        </div>
                        <span className="break-words text-gray-900 text-base font-bold tracking-wide">{order.hall_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code Section */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  Entry Pass
                </h3>
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white p-2 rounded-xl shadow-lg border-2 border-purple-200 flex items-center justify-center mb-3">
                    {qrLoading ? (
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-3 border-purple-200 border-t-purple-600"></div>
                    ) : qrCode ? (
                      <QRCode 
                        value={qrCode} 
                        size={window.innerWidth < 640 ? 96 : 128}
                        fgColor="#4c1d95"
                        bgColor="#ffffff"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">QR Code</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-purple-700 font-medium mb-1">Scan at Entry</p>
                    <p className="text-xs text-gray-500">Show this QR code at the venue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mt-6 sm:mt-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Order ID</p>
                  <p className="text-gray-600 break-all">{order.orderId}</p>
                </div>
                {order.paymentId && (
                  <div>
                    <p className="font-medium text-gray-700">Payment ID</p>
                    <p className="text-gray-600 break-all">{order.paymentId}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-700">Check-in Status</p>
                  <p className="text-gray-600">{order.checkInStatus.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 relative mx-3">
              {/* Loading Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/90 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-900">Processing Cancellation</p>
                      <p className="text-sm text-gray-600">Please wait while we process your refund...</p>
                      <div className="flex justify-center space-x-1 mt-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cancel Ticket</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  disabled={isProcessing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4 text-sm sm:text-base">
                  Are you sure you want to cancel your ticket for <strong className="break-words">{order.eventDetails?.eventName}</strong>?
                </p>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-800 font-medium mb-1 text-sm sm:text-base">Refund Policy</p>
                      <p className="text-blue-700 text-xs sm:text-sm">
                        Your refund will be processed within 5-7 business days. 
                        Cancellation charges may apply as per our terms and conditions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base"
                  disabled={isProcessing}
                >
                  Keep Ticket
                </button>
                <button
                  onClick={handleCancelTicket}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 text-sm sm:text-base"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Cancel Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Mobile Cancel Button at Bottom (not fixed) */}
      {canCancelTicket() && (
        <div className="sm:hidden mt-6 flex justify-center">
          <button
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold shadow-xl hover:bg-red-700 transition-all duration-200 focus:outline-none text-base"
            onClick={() => setShowCancelModal(true)}
          >
            ❌ Cancel Ticket
          </button>
        </div>
      )}
    </div>
    </>
  )
};

export default OrderDetails;