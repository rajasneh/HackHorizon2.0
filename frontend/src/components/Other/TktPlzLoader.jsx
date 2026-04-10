import React from 'react';

export const TktPlzLoader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <img 
            src="/images/logo2.PNG" 
            alt="TktPlz" 
            className="w-32 h-32 mx-auto object-contain"
          />
        </div>
        
        {/* Loading Bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-loading-bar"></div>
        </div>
        
        {/* Loading Text */}
        <p className="mt-6 text-gray-600 font-medium text-lg animate-pulse">
          Loading amazing experiences... <br /> It may take a minute to load due to free hosting!
        </p>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};