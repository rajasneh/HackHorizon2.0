import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";

const PayoutDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sendingReceipt, setSendingReceipt] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout/${id}`, {credentials: 'include'});
        const data = await res.json();
        setReceipt(data.data || null);
      } catch (e) {
        setError("Failed to load receipt details.");
      }
      setLoading(false);
    };
    fetchReceipt();
  }, [id]);

return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-10 relative">
            <button
                className="absolute top-4 left-4 bg-gray-100 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold shadow transition"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Payout Receipt</h1>
            {loading ? (
                <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
            ) : error ? (
                <div className="text-center py-10 text-red-500 font-semibold text-lg">{error}</div>
            ) : !receipt ? (
                <div className="text-center py-10 text-gray-400">No receipt data found.</div>
            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Event Name:</span>
                                            <span className="font-bold text-blue-900">{receipt.eventName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Organizer Name:</span>
                                            <span className="font-bold text-purple-900">{receipt.organiserName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Created At:</span>
                                            <span className="font-mono text-gray-900">{formatInTimeZone(receipt.createdAt, 'UTC', 'yyyy-MM-dd HH:mm:ss')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Updated At:</span>
                                            <span className="font-mono text-gray-900">{formatInTimeZone(receipt.updatedAt, 'UTC', 'yyyy-MM-dd HH:mm:ss')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Paid At:</span>
                                            <span className="font-mono text-gray-900">{receipt.paidAt ? formatInTimeZone(receipt.paidAt, 'UTC', 'yyyy-MM-dd HH:mm:ss') : 'Not Paid'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Total Revenue:</span>
                                            <span className="font-bold text-blue-700">₹{Number(receipt.totalRevenue).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Deductions:</span>
                                            <span className="font-bold text-red-700">₹{Number(receipt.deductions).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Net Payable:</span>
                                            <span className="font-bold text-green-700">₹{Number(receipt.netPayable).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Payment Method:</span>
                                            <span className="text-gray-900">{receipt.paymentMethod || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Transaction Reference:</span>
                                            <span className="text-gray-900">{receipt.transactionReference || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">Notes:</span>
                                            <span className="text-gray-900">{receipt.notes || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-700">Payment Status:</span>
                                            <span className="flex items-center gap-2">
                                                {receipt.status === 'paid' ? (
                                                    <span className="inline-flex items-center px-4 py-1 rounded-full bg-green-600 text-white font-bold text-sm shadow">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-4 py-1 rounded-full bg-yellow-500 text-white font-bold text-sm shadow">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                        </svg>
                                                        Pending
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Tickets Table Section */}
                                    <div className="mt-8">
                                        <div className="text-lg font-bold text-gray-800 mb-4">Tickets Details</div>
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow mb-6">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-blue-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase border-b">User Name</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase border-b">Email</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase border-b">Seat No</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase border-b">Seat Type</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase border-b">Base Amount</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase border-b">Convenience Fee</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase border-b">Total Amount</th>
                                                        <th className="px-4 py-3 text-center font-semibold text-gray-700 uppercase border-b">Tickets</th>
                                                        <th className="px-4 py-3 text-center font-semibold text-gray-700 uppercase border-b">Status</th>
                                                        <th className="px-4 py-3 text-center font-semibold text-gray-700 uppercase border-b">Booked At</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {receipt.allTicketsDetails && receipt.allTicketsDetails.length > 0 ? (
                                                        receipt.allTicketsDetails.map((ticket, idx) => (
                                                            <tr key={ticket.ticketId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50 hover:bg-blue-50 transition"}>
                                                                <td className="px-4 py-3 border-b">{ticket.userName}</td>
                                                                <td className="px-4 py-3 border-b">{ticket.userEmail}</td>
                                                                <td className="px-4 py-3 border-b">{ticket.seatNo}</td>
                                                                <td className="px-4 py-3 border-b">{ticket.seatType}</td>
                                                                <td className="px-4 py-3 text-right border-b">₹{Number(ticket.baseAmount).toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right border-b">₹{Number(ticket.convenienceFee).toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right border-b">₹{Number(ticket.totalAmount).toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-center border-b">{ticket.numberOfTicket}</td>
                                                                <td className="px-4 py-3 text-center border-b">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ticket.status}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-mono text-xs border-b">{formatInTimeZone(ticket.createdAt, 'UTC', 'yyyy-MM-dd HH:mm:ss')}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan={10} className="text-center py-6 text-gray-400">No ticket details available.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                                                            {/* Send Receipt Button Logic */}
                                                            {receipt.availableToOrg ? (
                                                                <button className="bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold shadow transition cursor-not-allowed" disabled>Sent!</button>
                                                            ) : (
                                                                <button
                                                                    className={`bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition flex items-center justify-center ${sendingReceipt ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                                    disabled={sendingReceipt}
                                                                    onClick={async () => {
                                                                        setSendingReceipt(true);
                                                                        try {
                                                                            const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout/send-receipt/${receipt.id}`, {
                                                                                method: "POST",
                                                                                credentials: "include"
                                                                            });
                                                                            if (res.ok) {
                                                                                setReceipt(prev => ({ ...prev, availableToOrg: true }));
                                                                            }
                                                                        } catch (e) {
                                                                            // Optionally handle error
                                                                        }
                                                                        setSendingReceipt(false);
                                                                    }}
                                                                >
                                                                    {sendingReceipt ? (
                                                                        <span className="loader mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                                    ) : null}
                                                                    Send Receipt
                                                                </button>
                                                            )}
                                                            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition">Make Payment</button>
                                                        </div>
                                </div>
            )}
        </div>
    </div>
);
};

export default PayoutDetails;