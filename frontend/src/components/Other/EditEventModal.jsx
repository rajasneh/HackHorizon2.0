import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Save, Ticket, Info, FileEdit } from "lucide-react";
import { toast } from "react-hot-toast";

const TABS = [
  { label: "Basic Details", icon: Info },
  { label: "Ticket Details", icon: Ticket },
  { label: "Change Poster", icon: ImageIcon },
];

function toLocalDatetimeString(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date - tzOffset).toISOString().slice(0, 16);
  return localISO;
}

export default function EditEventModal({ isOpen, onClose, eventData, onSuccess }) {
  const [activeTab, setActiveTab] = useState(0);
  const [basicDetails, setBasicDetails] = useState({});
  const [ticketDetails, setTicketDetails] = useState({});
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(eventData?.posterUrl || "");
  const [loading, setLoading] = useState(false);
  const [eventStatus, setEventStatus] = useState("Upcoming");
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    if (eventData) {
      // Determine event status
      const now = new Date();
      const start = new Date(eventData.scheduleStart);
      const end = new Date(eventData.scheduleEnd);
      let status = "Upcoming";
      if (now >= start && now <= end) status = "Ongoing";
      else if (now > end) status = "Completed";
      setEventStatus(status);
      // Filter out non-editable fields
      const exclude = [
        "id", "createdAt", "updatedAt", "hallID", "screenID", "verificationStatus", "isPaid", "posterUrl", "organiserID", "isVerified", "isPublished", "isOnline", "bookingCutoffType", "requiresRegistration", "type", "ticketsAvailable", "rating", "totalReviews", "totalBookings"
      ];
      const basic = {};
      Object.keys(eventData).forEach(key => {
        if (!exclude.includes(key) && typeof eventData[key] !== "object") {
          basic[key] = eventData[key];
        }
      });
      setBasicDetails(basic);
      setPosterPreview(eventData.posterUrl || "");
      setPosterFile(null);
      // Fetch ticket details
      setTicketLoading(true);
      fetch(`${import.meta.env.VITE_BASE_URL}/api/event/ticket-details/${eventData.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setTicketDetails({
              pricingOption: data.data.price?.pricingOption || "",
              flatPrice: data.data.price?.flatPrice || "",
              categorizedPrices: (data.data.categories || []).map(cat => ({
                type: cat.type,
                price: cat.price,
                numberOfTickets: cat.numberOfTickets
              })),
            });
          }
        })
        .finally(() => setTicketLoading(false));
    }
  }, [eventData]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleBasicChange = (field, value) => {
    setBasicDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleTicketChange = (field, value) => {
    setTicketDetails(prev => ({ ...prev, [field]: value }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  // --- API Calls ---
  const handleSaveBasic = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/update-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventData.id, details: basicDetails })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Event details updated!");
        onSuccess && onSuccess();
      } else {
        toast.error(data.message || "Failed to update event");
      }
    } catch (err) {
      toast.error("Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/update-ticket-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventData.id,
          pricingOption: ticketDetails.pricingOption,
          flatPrice: ticketDetails.flatPrice,
          categorizedPrices: ticketDetails.categorizedPrices
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ticket details updated!");
        onSuccess && onSuccess();
      } else {
        toast.error(data.message || "Failed to update ticket details");
      }
    } catch (err) {
      toast.error("Failed to update ticket details");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePoster = async () => {
    if (!posterFile) return toast.error("No new poster selected");
    setLoading(true);
    try {
      // 1. Upload poster
      const formData = new FormData();
      formData.append("poster", posterFile);
      const uploadRes = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/upload-poster", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.data?.secure_url) {
        throw new Error("Poster upload failed");
      }
      // 2. Update poster URL
      const updateRes = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/update-poster-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventData.id, posterUrl: uploadData.data.secure_url })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        toast.success("Poster updated!");
        onSuccess && onSuccess();
      } else {
        throw new Error(updateData.message || "Failed to update poster URL");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update poster");
    } finally {
      setLoading(false);
    }
  };

  // --- Renderers ---
  const renderBasicDetails = () => (
    <div className="space-y-4">
      {Object.entries(basicDetails).map(([key, value]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
          {key === "scheduleStart" || key === "scheduleEnd" ? (
            <input
              type="datetime-local"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={toLocalDatetimeString(value)}
              onChange={e => handleBasicChange(key, new Date(e.target.value).toISOString())}
              disabled={loading}
            />
          ) : (
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={value || ""}
              onChange={e => handleBasicChange(key, e.target.value)}
              disabled={loading}
            /> 
          )}
        </div>
      ))}
      <button
        className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-60"
        onClick={handleSaveBasic}
        disabled={loading}
        type="button"
      >
        <Save className="w-5 h-5" /> Save Basic Details
      </button>
    </div>
  );

  const renderTicketDetails = () => (
    <div className="space-y-4">
      {eventStatus !== "Upcoming" && (
        <div className="p-3 bg-yellow-50 text-yellow-700 rounded text-center font-medium mb-2">
          Only upcoming events can be edited.
        </div>
      )}
      {/* Pricing Option */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Option</label>
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={ticketDetails.pricingOption || ""}
          onChange={e => handleTicketChange("pricingOption", e.target.value)}
          disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
        >
          <option value="">Select</option>
          <option value="flat">Flat</option>
          <option value="categorized">Categorized</option>
        </select>
      </div>
      {/* Flat Price */}
      {ticketDetails.pricingOption === "flat" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flat Price</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={ticketDetails.flatPrice || ""}
            onChange={e => handleTicketChange("flatPrice", e.target.value)}
            disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
          />
        </div>
      )}
      {/* Categorized Prices */}
      {ticketDetails.pricingOption === "categorized" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categorized Prices</label>
          {(ticketDetails.categorizedPrices || []).map((cat, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Type"
                value={cat.type || ""}
                onChange={e => {
                  const arr = [...ticketDetails.categorizedPrices];
                  arr[idx].type = e.target.value;
                  handleTicketChange("categorizedPrices", arr);
                }}
                disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
              />
              <input
                type="number"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Price"
                value={cat.price || ""}
                onChange={e => {
                  const arr = [...ticketDetails.categorizedPrices];
                  arr[idx].price = e.target.value;
                  handleTicketChange("categorizedPrices", arr);
                }}
                disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
              />
              <input
                type="number"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="No. of Tickets"
                value={cat.numberOfTickets || ""}
                onChange={e => {
                  const arr = [...ticketDetails.categorizedPrices];
                  arr[idx].numberOfTickets = e.target.value;
                  handleTicketChange("categorizedPrices", arr);
                }}
                disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
              />
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  const arr = [...ticketDetails.categorizedPrices];
                  arr.splice(idx, 1);
                  handleTicketChange("categorizedPrices", arr);
                }}
                disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={() => handleTicketChange("categorizedPrices", [...(ticketDetails.categorizedPrices || []), { type: "", price: "", numberOfTickets: "" }])}
            disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
          >
            Add Category
          </button>
        </div>
      )}
      <button
        className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-60"
        onClick={handleSaveTicket}
        disabled={loading || eventStatus !== "Upcoming" || ticketLoading}
        type="button"
      >
        <Save className="w-5 h-5" /> Save Ticket Details
      </button>
    </div>
  );

  const renderPosterTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {posterPreview ? (
          <img src={posterPreview} alt="Poster Preview" className="w-48 h-64 object-cover rounded-lg shadow" />
        ) : (
          <div className="w-48 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="w-full flex flex-col items-center">
          <label htmlFor="poster-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg shadow hover:bg-blue-100 cursor-pointer transition">
            <ImageIcon className="w-5 h-5" />
            {posterFile ? "Change Poster" : "Choose Poster"}
          </label>
          <input
            id="poster-upload"
            type="file"
            accept="image/*"
            onChange={handlePosterChange}
            className="hidden"
            disabled={loading}
          />
          {posterFile && (
            <span className="mt-2 text-xs text-gray-500 truncate max-w-xs">{posterFile.name}</span>
          )}
        </div>
      </div>
      <button
        className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-60"
        onClick={handleSavePoster}
        disabled={loading || !posterFile}
        type="button"
      >
        <Save className="w-5 h-5" /> Save Poster
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" tabIndex={-1}>
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[80vh] mt-12 overflow-y-auto" tabIndex={-1}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab, idx) => (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors focus:outline-none ${
                activeTab === idx
                  ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(idx)}
              disabled={loading}
              type="button"
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 0 && renderBasicDetails()}
          {activeTab === 1 && renderTicketDetails()}
          {activeTab === 2 && renderPosterTab()}
        </div>
      </div>
    </div>
  );
} 