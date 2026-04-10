import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Trash, Eye, Image as ImageIcon, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import EditEventModal from "../../components/Other/EditEventModal";
import { toast } from "react-hot-toast";

const EVENT_TYPES = [
    { label: "All Types", value: "" },
    { label: "Seating", value: "seating" },
    { label: "Online", value: "online" },
    { label: "Open", value: "open" },
    { label: "Register", value: "register" },
];
const STATUS_OPTIONS = [
    { label: "All Statuses", value: "" },
    { label: "Upcoming", value: "Upcoming" },
    { label: "Ongoing", value: "Ongoing" },
    { label: "Completed", value: "Completed" },
];

const MyEvents = () => {
    const userData = useAuth();
    const navigate = useNavigate();
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editEventData, setEditEventData] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const { data, isPending, error, isError, refetch } = useQuery({
        queryKey: ['events'],
        queryFn: fetchEvents,
        staleTime: 1000 * 60 * 10,
    });

    async function fetchEvents() {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/event/get-events/${userData.user.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch events");
        return response.json();
    }

    if (isPending) return <div className="text-center mt-10 text-blue-600 font-semibold animate-pulse">Loading events...</div>;
    if (isError) {
        console.error('Failed to load events:', error);
        return (
            <div className="flex flex-col items-center justify-center mt-16 gap-4">
                <div className="text-red-500 font-semibold text-lg">Failed to load events</div>
                {error?.message && (
                    <div className="text-gray-500 text-sm max-w-md text-center">{error.message}</div>
                )}
                <button
                    onClick={() => refetch()}
                    className="mt-2 bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    const events = data?.organiserEvents || [];

    // Filtering logic
    const filteredEvents = events.filter((event) => {
        // Type filter
        const typeMatch = !typeFilter || (event.type && event.type.toLowerCase() === typeFilter);
        // Status filter
        const now = new Date();
        const start = new Date(event.scheduleStart);
        const end = new Date(event.scheduleEnd);
        let status = "Upcoming";
        if (now >= start && now <= end) status = "Ongoing";
        else if (now > end) status = "Completed";
        const statusMatch = !statusFilter || status === statusFilter;
        return typeMatch && statusMatch;
    });

    // Sort: Ongoing > Upcoming > Completed, then by start time/date ascending
    const sortedEvents = [...filteredEvents].sort((a, b) => {
        const now = new Date();
        const getStatusOrder = (event) => {
            const start = new Date(event.scheduleStart);
            const end = new Date(event.scheduleEnd);
            if (now >= start && now <= end) return 0; // Ongoing
            if (now < start) return 1; // Upcoming
            return 2; // Completed
        };
        const statusA = getStatusOrder(a);
        const statusB = getStatusOrder(b);
        if (statusA !== statusB) return statusA - statusB;
        // If same status, sort by start time
        return new Date(a.scheduleStart) - new Date(b.scheduleStart);
    });

    // Improved empty state handling
    if (events.length === 0) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-32">
                    <ImageIcon className="w-20 h-20 text-gray-300 mb-6" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">You haven't created any events yet</h2>
                    <p className="text-gray-500 mb-6">Start by creating your first event and make your mark as an organiser!</p>
                    {/* You can add a button to create event if you have a route for it */}
                    <button onClick={() => navigate('/organiser/create-event')} className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition">Create Event</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-8">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-0">My Events</h1>
                    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-2 py-1 sm:px-4 sm:py-2 min-w-[140px] sm:min-w-[220px]">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <span className="font-medium text-gray-700 text-xs sm:text-sm">Filter by:</span>
                        <select
                            className="border border-gray-200 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                        >
                            {EVENT_TYPES.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            className="border border-gray-200 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {sortedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl shadow">
                        <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg text-gray-500 font-medium">No events found for the selected filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedEvents.map((event) => {
                            const now = new Date();
                            const start = new Date(event.scheduleStart);
                            const end = new Date(event.scheduleEnd);
                            let status = "Upcoming";
                            let badgeClass = "bg-yellow-100 text-yellow-800";
                            if (now >= start && now <= end) {
                                status = "Ongoing";
                                badgeClass = "bg-green-100 text-green-800";
                            } else if (now > end) {
                                status = "Completed";
                                badgeClass = "bg-gray-200 text-gray-700";
                            }
                            return (
                                <div key={event.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
                                    {/* Poster or icon */}
                                    <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {event.posterUrl ? (
                                            <img src={event.posterUrl} alt={event.name} className="object-cover w-full h-full" />
                                        ) : (
                                            <ImageIcon className="w-12 h-12 text-gray-300" />
                                        )}
                                    </div>
                                    {/* Event info */}
                                    <div className="flex-1 flex flex-col p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-xl font-semibold text-gray-800 truncate" title={event.name}>{event.name}</h2>
                                            <span className={`px-3 py-1 text-xs rounded-full font-semibold ${badgeClass}`}>{status}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <span className="font-medium">{event.type}</span>
                                            <span className="mx-1">·</span>
                                            <span>{new Date(event.scheduleStart).toLocaleString('en-IN', {
                                                weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                                            })}</span>
                                        </div>
                                        <div className="flex-1" />
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button
                                                className="p-2 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition cursor-pointer"
                                                title="View"
                                                onClick={() => { navigate(`/organiser/event-details/${event.id}`) }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {status === "Upcoming" && (
                                            <button
                                                className="p-2 rounded hover:bg-green-50 text-green-600 hover:text-green-800 transition cursor-pointer"
                                                title="Edit"
                                                onClick={() => {
                                                    setEditEventData(event);
                                                    setEditModalOpen(true);
                                                }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            )}
                                            <button
                                                className="p-2 rounded hover:bg-red-50 text-red-600 hover:text-red-800 transition cursor-pointer"
                                                title="Delete"
                                                onClick={() => {
                                                    setEventToDelete(event);
                                                    setDeleteModalOpen(true);
                                                }}
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <EditEventModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    eventData={editEventData}
                    onSuccess={() => { setEditModalOpen(false); refetch(); }}
                />
                {/* Delete Warning Modal */}
                {deleteModalOpen && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-red-600 mb-4">Delete Event?</h2>
                            <p className="text-gray-700 mb-4">
                                <span className="font-semibold">Warning:</span> Deleting this event is <span className="text-red-600 font-bold">permanent</span> and cannot be undone.<br/>
                                This action may affect your records, including <span className="font-semibold">financial data, ticket sales, participant records, and analytics</span> associated with this event.<br/>
                                Please ensure you have exported or reviewed all necessary data before proceeding.
                            </p>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => setDeleteModalOpen(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                                    onClick={async () => {
                                        setDeleting(true);
                                        try {
                                            const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/delete-event", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ eventId: eventToDelete.id })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                toast.success("Event deleted successfully");
                                                setDeleteModalOpen(false);
                                                setEventToDelete(null);
                                                refetch();
                                            } else {
                                                toast.error(data.message || "Failed to delete event");
                                            }
                                        } catch (err) {
                                            toast.error("Failed to delete event");
                                        } finally {
                                            setDeleting(false);
                                        }
                                    }}
                                    disabled={deleting}
                                >
                                    Yes, Delete Event
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyEvents;