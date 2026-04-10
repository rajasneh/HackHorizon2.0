import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function formatCurrency(amount) {
  if (typeof amount !== "number") return "";
  return "₹" + amount.toLocaleString();
}

function SuccessfulPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">No Payment Data Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { paymentId, orderId, eventDetails, summary, totalAmount } = paymentData;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto p-3 sm:p-6">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <span className="text-green-600 text-xl sm:text-2xl">✓</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-sm sm:text-base">Your booking has been confirmed</p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Payment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-sm sm:text-base">Payment ID</span>
              <span className="font-mono text-xs sm:text-sm text-right break-all ml-2">{paymentId}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-sm sm:text-base">Order ID</span>
              <span className="font-mono text-xs sm:text-sm text-right break-all ml-2">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm sm:text-base">Amount Paid</span>
              <span className="font-semibold text-green-600 text-sm sm:text-base">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Event Details Card - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
          <button
            onClick={() => setIsBookingDetailsOpen(!isBookingDetailsOpen)}
            className="w-full p-4 sm:p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Booking Details</h2>
            <span className={`transform transition-transform ${isBookingDetailsOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isBookingDetailsOpen && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t">
              <div className="flex gap-3 sm:gap-4 mb-4 mt-4">
                <img
                  src={eventDetails.poster || '/images/default-poster.jpg'}
                  alt={eventDetails.eventName}
                  className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{eventDetails.eventName}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{eventDetails.hallName}</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{eventDetails.date}</p>
                </div>
              </div>
              
              {/* Ticket Summary */}
              <div className="border-t pt-3 sm:pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Tickets</span>
                    <span>{formatCurrency(summary.totalSeatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Platform Fees</span>
                    <span>{formatCurrency(summary.totalConvenienceFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 text-xs sm:text-sm">
                    <span>Total</span>
                    <span>{formatCurrency(summary.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
          >
            Book More Tickets
          </button>
          <button
            onClick={async () => {
              if (isDownloading) return;
              setIsDownloading(true);
              try {
                const response = await axios.post(import.meta.env.VITE_BASE_URL + '/api/ticket/download', 
                  { orderId },
                  { responseType: 'blob' }
                );
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `ticket-${orderId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (error) {
                console.error('Error downloading ticket:', error);
                alert('Failed to download ticket');
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 border border-gray-300 rounded-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base ${
              isDownloading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isDownloading && (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            )}
            {isDownloading ? 'Downloading...' : 'Print Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuccessfulPayment;