import React from 'react';

export const MeetzLoader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <img 
            src="/images/logo2.PNG" 
            alt="meetz" 
            className="w-32 h-32 mx-auto object-contain"
          />
        </div>
        
        {/* Loading Bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
         <div className="h-full bg-[#CD2128] rounded-full animate-loading-bar"></div>
        </div>
        
        {/* Loading Text */}
        <p className="mt-6 text-gray-600 font-medium text-lg animate-pulse">
          Loading amazing experiences... <br />
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