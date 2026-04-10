import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllApprovals, setShowAllApprovals] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const STATUS_OPTIONS = [
    { label: "All Statuses", value: "" },
    { label: "Upcoming", value: "Upcoming" },
    { label: "Ongoing", value: "Ongoing" },
    { label: "Completed", value: "Completed" },
  ];

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.scheduleStart);
    const end = new Date(event.scheduleEnd);
    if (now >= start && now <= end) return "Ongoing";
    if (now < start) return "Upcoming";
    return "Completed";
  };

  // Fetch logic moved to a function
  const fetchData = () => {
    setLoading(true);
    fetch(import.meta.env.VITE_BASE_URL + '/api/event/get-all-events')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvents(data.data || []);
      })
      .catch(() => toast.error('Failed to fetch events'))
      .finally(() => setLoading(false));
    setLoadingApprovals(true);
    fetch(import.meta.env.VITE_BASE_URL + '/api/admin/event-approval')
      .then(res => res.json())
      .then(data => {
        if (data.success) setApprovalRequests(data.data || []);
      })
      .catch(() => toast.error('Failed to fetch approval requests'))
      .finally(() => setLoadingApprovals(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (eventId) => {
    try {
      const res = await fetch(import.meta.env.VITE_BASE_URL + '/api/admin/approve-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Event approved');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to approve');
      }
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (eventId) => {
    try {
      const res = await fetch(import.meta.env.VITE_BASE_URL + '/api/admin/reject-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Event rejected');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to reject');
      }
    } catch {
      toast.error('Failed to reject');
    }
  };

  // Filter and sort events
  const filteredEvents = events.filter(event => {
    const status = getEventStatus(event);
    return !statusFilter || status === statusFilter;
  });
  const eventsToShow = filteredEvents.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>

      {/* Event List Section */}
      <section id="event-list" className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Event List</h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="font-medium text-gray-700">Filter by Status:</span>
            <select
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {loading ? <div>Loading events...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Event Name</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Organizer</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Tickets Sold</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsToShow.map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4 text-gray-800">{event.name}</td>
                        <td className="p-4 text-gray-600">{event.organiserName || event.organizer}</td>
                        <td className="p-4 text-gray-600">{event.ticketsSold ?? '-'}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status === 'Ongoing'
                              ? 'bg-green-100 text-green-700'
                              : status === 'Upcoming'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEvents.length > 5 && (
                <div className="flex justify-end mt-2">
                  <button
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => setShowAllEvents(true)}
                  >
                    Show All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Show All Events Modal */}
      {showAllEvents && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">All Events</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAllEvents(false)}>Close</button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-medium text-gray-700">Filter by Status:</span>
              <select
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Event Name</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Organizer</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Tickets Sold</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{event.name}</td>
                      <td className="p-4 text-gray-600">{event.organiserName || event.organizer}</td>
                      <td className="p-4 text-gray-600">{event.ticketsSold ?? '-'}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status === 'Ongoing'
                            ? 'bg-green-100 text-green-700'
                            : status === 'Upcoming'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Requests Section */}
      <section id="approval-requests" className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Approval Requests</h2>
          {loadingApprovals ? <div>Loading approval requests...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Event Name</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Organizer</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="p-4 text-sm font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalRequests.map((request) => (
                    <tr key={request.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{request.name}</td>
                      <td className="p-4 text-gray-600">{request.organiserName || request.organizer}</td>
                      <td className="p-4 text-gray-600">
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : (request.dateTime
                              ? new Date(request.dateTime).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-')
                        }
                      </td>
                      <td className="p-4 flex gap-2">
                        <button
                          className="bg-[#1A73E8] text-white px-4 py-1 rounded-lg hover:bg-[#1664c1] transition-colors text-sm font-semibold"
                          onClick={() => handleApprove(request.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="bg-[#FF5722] text-white px-4 py-1 rounded-lg hover:bg-[#e64a19] transition-colors text-sm font-semibold"
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {approvalRequests.length > 5 && (
                <div className="flex justify-end mt-2">
                  <button
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => setShowAllApprovals(true)}
                  >
                    Show All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Show All Approvals Modal */}
      {showAllApprovals && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">All Approval Requests</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAllApprovals(false)}>Close</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Event Name</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Organizer</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalRequests.map((request) => (
                  <tr key={request.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{request.name}</td>
                    <td className="p-4 text-gray-600">{request.organiserName || request.organizer}</td>
                    <td className="p-4 text-gray-600">{request.dateTime || request.scheduleStart}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        className="bg-[#1A73E8] text-white px-4 py-1 rounded-lg hover:bg-[#1664c1] transition-colors text-sm font-semibold"
                        onClick={() => handleApprove(request.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="bg-[#FF5722] text-white px-4 py-1 rounded-lg hover:bg-[#e64a19] transition-colors text-sm font-semibold"
                        onClick={() => handleReject(request.id)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};