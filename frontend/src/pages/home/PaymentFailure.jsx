import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function PaymentFailure() {
  const location = useLocation();
  const navigate = useNavigate();
  const failureData = location.state;

  const { error = "Payment failed", eventDetails = {}, orderId = "" } = failureData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6">
        {/* Failure Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">Your payment could not be processed</p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Details</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          {orderId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
          )}
        </div>

        {/* Event Details Card */}
        {eventDetails.eventName && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="flex gap-4">
              <img
                src={eventDetails.poster || '/images/default-poster.jpg'}
                alt={eventDetails.eventName}
                className="w-16 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{eventDetails.eventName}</h3>
                <p className="text-gray-600 text-sm">{eventDetails.hallName}</p>
                <p className="text-gray-600 text-sm">{eventDetails.date}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailure;