import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Financials = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingReceipt, setSendingReceipt] = useState({}); // { [id]: boolean }
  const [showPaymentModal, setShowPaymentModal] = useState(null); // payout id or null
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/payment/payout-summary", {
            method: "GET",
            credentials: "include"
        });
        const data = await res.json();
        setPayouts(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setError("Failed to load payout summary.");
      }
      setLoading(false);
    };
    fetchPayouts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Payout Summary</h1>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Organizer Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Net Payable</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Payment Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No payout data available.</td>
                </tr>
              ) : (
                payouts.map((payout, idx) => (
                  <tr key={payout.id || idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{payout.eventName}</td>
                    <td className="px-4 py-3 text-gray-700">{payout.organiserName}</td>
                    <td className="px-4 py-3 text-right text-blue-700 font-semibold">₹{payout.totalRevenue?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">₹{payout.netPayable?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${payout.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{payout.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-center flex flex-col sm:flex-row gap-2 justify-center items-center">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition"
                        onClick={() => navigate(`/moderator/adm/payout/${payout.id}`)}
                      >View Receipt</button>
                      {/* Send Receipt Button Logic */}
                      {payout.availableToOrg ? (
                        <button className="bg-gray-400 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition cursor-not-allowed" disabled>Sent!</button>
                      ) : (
                        <button
                          className={`bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition flex items-center justify-center ${sendingReceipt[payout.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                          disabled={!!sendingReceipt[payout.id]}
                          onClick={async () => {
                            setSendingReceipt(prev => ({ ...prev, [payout.id]: true }));
                            try {
                              const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout/send-receipt/${payout.id}`, {
                                method: "POST",
                                credentials: "include"
                              });
                              if (res.ok) {
                                // Update availableToOrg for this payout
                                setPayouts(prev => prev.map(p => p.id === payout.id ? { ...p, availableToOrg: true } : p));
                              } 
                            } catch (e) {
                              // Optionally handle error
                            }
                            setSendingReceipt(prev => ({ ...prev, [payout.id]: false }));
                          }}
                        >
                          {sendingReceipt[payout.id] ? (
                            <span className="loader mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : null}
                          Send Receipt
                        </button>
                      )}
                      {/* Make Payment Button Logic */}
                      {payout.paymentToOrg ? (
                        <button className="bg-gray-400 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition cursor-not-allowed" disabled>Paid</button>
                      ) : (
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow transition"
                          onClick={() => {
                            setShowPaymentModal(payout.id);
                            setPaymentMethod('');
                          }}
                        >Make Payment</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setShowPaymentModal(null)}>&times;</button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Initiate Payment</h2>
            <p className="text-gray-600 mb-4 text-center">Select a payment method to proceed with the payout. Please confirm the details before continuing.</p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                disabled={paymentLoading}
              >
                <option value="">Select method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              className={`w-full bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition flex items-center justify-center ${paymentLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={paymentLoading || !paymentMethod}
              onClick={async () => {
                setPaymentLoading(true);
                try {
                  // Replace with actual adminId logic if needed
                  const adminId = user?.id || user?.userData?.id;   
                  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout/${showPaymentModal}/initiate`, {
                    method: "POST",
                    credentials: "include",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentMethod, adminId })
                  });
                  if (res.ok) {
                    setPayouts(prev => prev.map(p => p.id === showPaymentModal ? { ...p, paymentToOrg: true } : p));
                    setShowPaymentModal(null);
                  }
                } catch (e) {
                  // Optionally handle error
                }
                setPaymentLoading(false);
              }}
            >
              {paymentLoading ? (
                <span className="loader mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Proceed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;