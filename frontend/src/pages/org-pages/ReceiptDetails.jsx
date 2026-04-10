import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";

const logoUrl = 'https://res.cloudinary.com/dgxc8nspo/image/upload/v1749873899/maw2lnlkowbftjvtldna.png';

const ReceiptDetails = () => {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/payout/${id}`, {
          method: "GET",
          credentials: "include"
        });
        const data = await res.json();
        if (data.success) {
          setReceipt(data.data);
        } else {
          setError("Failed to load receipt details.");
        }
      } catch (e) {
        setError("Failed to load receipt details.");
      }
      setLoading(false);
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10 text-lg text-gray-500">Loading...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-500 font-semibold text-lg">{error}</div>;
  }
  if (!receipt) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-0">
  <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-xl shadow-2xl p-0 mx-2 sm:mx-4 my-6 sm:my-10">
        {/* Receipt Header */}
        <div className="flex flex-col items-center py-8 border-b border-gray-200">
          {/* <img src={logoUrl} alt="TKTPLZ Logo" className="h-20 w-auto mb-2" style={{objectFit: 'cover', objectPosition: 'center top', borderRadius: '12px'}} /> */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">Income Receipt</span>
            {receipt.status === 'paid' ? (
              <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow">Paid</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold shadow">Pending</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">Receipt ID: <span className="font-mono">{receipt.id}</span></div>
        </div>
        {/* Main Info Section */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500">Event Name</div>
              <div className="text-lg font-bold text-indigo-700">{receipt.eventName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Organizer Name</div>
              <div className="text-lg font-bold text-indigo-700">{receipt.organiserName}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500">Total Revenue</div>
              <div className="text-lg font-bold text-blue-700">₹{Number(receipt.totalRevenue).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Deductions</div>
              <div className="text-lg font-bold text-red-700">₹{Number(receipt.deductions).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Net Payable</div>
              <div className="text-lg font-bold text-green-700">₹{Number(receipt.netPayable).toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500">Created At</div>
              <div className="text-sm font-mono text-gray-900">{formatInTimeZone(receipt.createdAt, 'UTC', 'yyyy-MM-dd HH:mm:ss')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Updated At</div>
              <div className="text-sm font-mono text-gray-900">{formatInTimeZone(receipt.updatedAt, 'UTC', 'yyyy-MM-dd HH:mm:ss')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Paid At</div>
              <div className="text-sm font-mono text-gray-900">{receipt.paidAt ? formatInTimeZone(receipt.paidAt, 'UTC', 'yyyy-MM-dd HH:mm:ss') : 'Not Paid'}</div>
            </div>
          </div>
          {/* <div className="mb-6">
            <span className={`px-2 py-1 rounded-full text-sm font-bold ${receipt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{receipt.status.toUpperCase()}</span>
          </div> */}
        </div>
        {/* Tickets Table Section */}
        <div className="px-8 pb-8">
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
                {receipt.allTicketsDetails.map((ticket, idx) => (
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
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-gray-500">Payment Method</div>
              <div className="text-base text-gray-900 uppercase">{receipt.paymentMethod || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Transaction Reference</div>
              <div className="text-base text-gray-900">{receipt.transactionReference || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Notes</div>
              <div className="text-base text-gray-900">{receipt.notes || 'N/A'}</div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 text-xs text-gray-400 text-center">
          Thank you for using TKTPLZ. This is a system generated receipt.
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetails;
