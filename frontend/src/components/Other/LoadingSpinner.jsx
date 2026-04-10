function LoadingSpinner({ message }) {
    // Using specific blue and orange colors from the tktplz logo
    const blueColor = '#007bff'; // A vibrant blue
    const orangeColor = '#fd7e14'; // A vibrant orange
  
    return (
      <div className="fixed inset-0  bg-opacity-75 flex flex-col justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center max-w-sm w-full">
          {/* Dotted Spinner animation with blue and orange colors */}
          <div className="flex space-x-2 mb-6">
            <div
              className="w-4 h-4 rounded-full animate-bounce-dot"
              style={{ backgroundColor: blueColor, animationDelay: '0s' }}
            ></div>
            <div
              className="w-4 h-4 rounded-full animate-bounce-dot"
              style={{ backgroundColor: orangeColor, animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-4 h-4 rounded-full animate-bounce-dot"
              style={{ backgroundColor: blueColor, animationDelay: '0.4s' }}
            ></div>
          </div>
  
          {/* Loading message */}
          <p className="text-gray-700 text-xl font-semibold text-center leading-relaxed">
            {message}
          </p>
          {/* Optional: A small, subtle hint or additional text */}
          <p className="text-gray-500 text-sm mt-2 text-center">
            Please wait a moment while we prepare your view.
          </p>
        </div>
  
        {/* Custom CSS for the dotted animation */}
        <style>
          {`
          @keyframes bounce-dot {
            0%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
          }
          .animate-bounce-dot {
            animation: bounce-dot 1.2s infinite ease-in-out;
          }
          `}
        </style>
      </div>
    );
  }

  export default LoadingSpinner;