import React from 'react';

const PaymentVerificationLoader = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
              <span className="text-2xl text-green-600 animate-bounce">₹</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Verifying Payment
        </h3>
        
        <p className="text-gray-600 text-sm mb-4">
          Please wait while we confirm your payment...
        </p>
        
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationLoader;