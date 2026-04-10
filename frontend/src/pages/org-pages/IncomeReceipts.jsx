import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const IncomeReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(null); // receipt id or null
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const organiserId = user?.id || user?.userData?.id;

  useEffect(() => {
    const fetchReceipts = async () => {
      setLoading(true);
      setError("");
      try {
        // Replace with your actual API endpoint for organiser receipts
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout-for-organiser/${organiserId}`, {
          method: "GET",
          credentials: "include"
        });
        const data = await res.json();
        setReceipts(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setError("Failed to load receipts.");
      }
      setLoading(false);
    };
    fetchReceipts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Income Receipts</h1>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 font-semibold text-lg">{error}</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Event Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">View</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">No receipts available.</td>
                </tr>
              ) : (
                receipts.map((receipt, idx) => (
                  <tr key={receipt.id || idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{receipt.eventName}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition"
                        onClick={() => navigate(`/organiser/receipt/${receipt.id}`)}
                      >View</button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {receipt.paymentToOrg && receipt.status === 'pending' ? (
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition"
                          onClick={() => {
                            setShowVerifyModal(receipt.id);
                            setVerifyCode("");
                          }}
                        >Accept Payment</button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Accept Payment Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setShowVerifyModal(null)}>&times;</button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Verify Payment</h2>
            <p className="text-gray-600 mb-4 text-center">To accept this payment, please enter the verification code provided to you. This ensures secure and authorized payout processing.</p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                disabled={verifyLoading}
                placeholder="Enter code"
              />
            </div>
            <button
              className={`w-full bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition flex items-center justify-center ${verifyLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={verifyLoading || !verifyCode}
              onClick={async () => {
                setVerifyLoading(true);
                try {
                  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout/${showVerifyModal}/mark-as-paid`, {
                    method: "POST",
                    credentials: "include",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ verificationText: verifyCode })
                  });
                  if (res.ok) {
                    toast.success("Payment marked as paid successfully!");
                    setShowVerifyModal(null);
                    setReceipts(prev => prev.map(r => r.id === showVerifyModal ? { ...r, paymentToOrg: false } : r));
                  } else {
                    toast.error("Verification failed. Please check your code.");
                  }
                } catch (e) {
                  toast.error("An error occurred. Please try again.");
                }
                setVerifyLoading(false);
              }}
            >
              {verifyLoading ? (
                <span className="loader mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeReceipts;
