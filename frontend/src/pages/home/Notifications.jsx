import React from "react";

const Notifications = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-2xl p-10 flex flex-col items-center max-w-md w-full">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#6366f1" className="mb-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Notifications Yet</h2>
        <p className="text-gray-500 mb-4 text-center">You're all caught up! When you have notifications, they'll appear here.</p>
      </div>
    </div>
  );
};

export default Notifications;