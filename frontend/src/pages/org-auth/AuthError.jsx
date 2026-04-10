import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdErrorOutline } from "react-icons/md";

export const AuthError = () => {
  const [error, setError] = useState("Authentication failed");
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const errorMessage = queryParams.get("error");
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center border border-red-300 p-8 rounded-2xl shadow-md">
        <MdErrorOutline className="text-5xl text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-[#1A73E8] text-white rounded-xl hover:bg-blue-600 transition cursor-pointer"
        >
          Go Back to Home Page
        </button>
      </div>
    </div>
  );
};

