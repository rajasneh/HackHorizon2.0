import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Monitor, Ticket, ClipboardList, TentTree, ImagePlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const eventTypes = [
    // { name: "Online", icon: Monitor },
    { name: "Seating", icon: Ticket },
    // { name: "Registration", icon: ClipboardList },
    { name: "Open", icon: TentTree }
];

const subTypes = {
    Online: ["Webinar", "Workshop", "Live Stream", "Other"],
    Seating: ["Movie", "Concert", "Conference", "Other"],
    Registration: ["Hackathon", "Concert", "Conference", "Other"],
    Open: ["Concert", "Other"]
};

export const CreateEvent = () => {
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const [halls, setHalls] = useState([]);
    const [screens, setScreens] = useState([]);
    const [selectedHall, setSelectedHall] = useState("");
    const [selectedScreen, setSelectedScreen] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const navigate = useNavigate();
    const [slotAvailable, setSlotAvailable] = useState(true);
    const [slotCheckMsg, setSlotCheckMsg] = useState("");
    const [eventMode, setEventMode] = useState(() => {
        const saved = localStorage.getItem("create-event-data-mode");
        return saved || "Offline";
    });

    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem("create-event-data");

        let parsedData = {};
        if (saved) {
            try {
                parsedData = JSON.parse(saved);
            } catch (error) {
                console.error("Error parsing localStorage data.", error);
            }
        }

        return {
            eventName: parsedData.eventName || "",
            organiserID: user.id || "", // Added organiserID
            type: parsedData.type || "",
            subtype: parsedData.subtype || "",
            onlineDetails: parsedData.onlineDetails || {},
            seatingDetails: parsedData.seatingDetails || {},
            isPaid: parsedData.isPaid || false,
            pricingOption: parsedData.pricingOption || "", // '' | 'flat' | 'categorized'
            flatPrice: parsedData.flatPrice || "", // flat price
            categorizedPrices: parsedData.categorizedPrices || [], // dynamic array
            agreed: parsedData.agreed || false,
            eventInstructions: parsedData.eventInstructions || "",
            description: parsedData.description || "",
            start: parsedData.start || "",
            end: parsedData.end || "", 
            bookingCutOffType: parsedData.bookingCutOffType || "",
            bookingCutoffMinutesBeforeStart: parsedData.bookingCutoffMinutesBeforeStart || 0,
            bookingCutoffCustomTime: parsedData.bookingCutoffCustomTime || "",
            location: parsedData.location || "",
            city: parsedData.city || "",
            state: parsedData.state || "",
            area_name: parsedData.area_name || "", 
            pin: parsedData.pin || "",
            maxParticipantAllowed: parsedData.maxParticipantAllowed || "",
            poster: parsedData.poster || null,
            posterPreview: parsedData.posterPreview || "",
            posterBase64: parsedData.posterBase64 || "",
            eligibility_age: parsedData.eligibility_age || "",
            genre: parsedData.genre || "",
            language: parsedData.language || "",
            ratingCode: parsedData.ratingCode || "",
            ticketsCancellable: parsedData.ticketsCancellable || false,
            isOnline: eventMode === "Online" ? true : false,
            eligibility_criteria: parsedData.eligibility_criteria || "",
            registrationFields: parsedData.registrationFields || [
                { name: '', type: 'Text' }
            ],
            isCompetition: parsedData.isCompetition || false,
            participationType: parsedData.participationType || [], // ["individual", "team"]
            minTeamMembers: parsedData.minTeamMembers || '',
            maxTeamMembers: parsedData.maxTeamMembers || '',
        };
    });

    useEffect(() => {
        localStorage.setItem("create-event-data", JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        localStorage.setItem("create-event-data-mode", eventMode);
    }, [eventMode]);

    const mutation = useMutation({
        mutationFn: async () => {
            setLoading(true);
            setLoadingMsg("Creating your event...");
            let jsonData = { ...formData };
            // Remove frontend-only or legacy fields
            if (formData.type === "Seating" && formData.pricingOption === "categorized") {
                jsonData.categorizedPrices = formData.categorizedPrices.map(item => {
                    const seatTypeObj = seatTypes.find(st => st.type === item.type);
                    return {
                        type: item.type,
                        price: item.price,
                        numberOfTickets: seatTypeObj?.count ?? 0,
                        numberOfSeats: seatTypeObj?.count ?? 0
                    };
                });
            }
            // Add hallID and screenID to payload if present
            if (selectedHall) {
                jsonData.hallID = selectedHall;
            }
            if (selectedScreen) {
                jsonData.screenID = selectedScreen;
            }
            // Convert eligibility_age to number
            jsonData.eligibility_age = parseInt(jsonData.eligibility_age) || 0;
            // Convert dates to UTC
            if (jsonData.start) {
                jsonData.start = new Date(jsonData.start).toISOString();
            }
            if (jsonData.end) {
                jsonData.end = new Date(jsonData.end).toISOString();
            }
            if (jsonData.bookingCutoffCustomTime) {
                jsonData.bookingCutoffCustomTime = new Date(jsonData.bookingCutoffCustomTime).toISOString();
            }
            // Remove file and base64 from payload
            delete jsonData.poster;
            delete jsonData.posterPreview;
            delete jsonData.posterBase64;
            // 1. Create the event
            setLoadingMsg("Creating your event...");
            console.log(formData.type);
            const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/event/create/${formData.type}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jsonData),
                credentials: "include"
            });
            if (!res.ok) {
                setLoading(false);
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to create event");
                throw new Error(errorData.message || "Failed to create event");
            }
            const eventData = await res.json();
            const eventId = eventData?.event?.id || eventData?.eventID || eventData?.data?.id;
            // 2. Upload the poster if present
            let posterUrl = null;
            console.log("Going to upload poster");
            // console.log("Form data", formData);
            console.log("Form data poster", formData.poster);
            console.log("Event id", eventId);


            if (formData.poster && eventId) {
                console.log("Uploading poster...");
                setLoadingMsg("Uploading poster...");

                const formDataObj = new FormData();
                formDataObj.append("poster", formData.poster);

                const posterRes = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/upload-poster", {
                    method: "POST",
                    body: formDataObj,
                });
                const posterData = await posterRes.json();
                if (posterData.success && posterData.data && posterData.data.secure_url) {
                    console.log("Poster uploaded successfully");
                    posterUrl = posterData.data.secure_url;
                    // 3. Update the event with the poster URL
                    setLoadingMsg("Finalizing event...");
                    console.log("Finalizing event...");
                    const updateRes = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/update-poster-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ eventId, posterUrl })
                    });
                    console.log("Updated event with poster URL");
                    if (!updateRes.ok) {
                        setLoading(false);
                        toast.error("Failed to update event with poster URL");
                        throw new Error("Failed to update event with poster URL");
                    }
                } else {
                    setLoading(false);
                    toast.error("Poster upload failed.");
                    throw new Error("Poster upload failed.");
                }
            }
            // console.log("Event created successfully");
            setLoading(false);
            toast.success("Event created successfully!");
            navigate("/organiser/events");
            localStorage.removeItem("create-event-data");
            return eventData;
        },
    });

    const handleTypeSelect = (type) => {
        setFormData((prev) => ({ ...prev, type, subtype: "" }));
    };

    const handleSubtypeSelect = (subtype) => {
        setFormData((prev) => ({ ...prev, subtype }));
    };

    const handleSeatingChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            seatingDetails: {
                ...prev.seatingDetails,
                [field]: value,
            },
        }));
    };

    const handleOnlineChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            onlineDetails: {
                ...prev.onlineDetails,
                [field]: value,
            },
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Limit to 2 MB
                alert("File size exceeds 2 MB limit.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                const previewUrl = URL.createObjectURL(file);
                setFormData((prev) => ({
                    ...prev,
                    poster: file,
                    posterPreview: previewUrl,
                    posterBase64: base64String,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Add useQuery for fetching all halls (no city/state filter)
    const { data: allHallsData, refetch: refetchHalls, isLoading } = useQuery({
        queryKey: ['all-halls'],
        queryFn: async () => {
            const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/event/available-halls', {
                method: 'GET'
            });
            const data = await response.json();
            return data.data?.hallsData || [];
        },
        enabled: false, // Only fetch when triggered
    });

    // Filter halls in-memory based on city and state
    const filteredHalls = (allHallsData || []).filter(hall => {
        if (!formData.city && !formData.state) return true;
        const cityMatch = formData.city ? hall.city?.toLowerCase() === formData.city.toLowerCase() : true;
        const stateMatch = formData.state ? hall.state?.toLowerCase() === formData.state.toLowerCase() : true;
        return cityMatch && stateMatch;
    });

    // Fetch available screens when a hall is selected
    useEffect(() => {
        if (selectedHall) {
            const fetchScreens = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/event/available-screens/${selectedHall}`);
                    const data = await response.json();
                    setScreens(data.data?.screens || []);
                } catch (error) {
                    console.error("Error fetching screens:", error);
                }
            };
            fetchScreens();
        } else {
            setScreens([]);
        }
    }, [selectedHall]);

    // Fetch seat types for the selected screen (Seating event only)
    const { data: seatTypes = [], refetch: refetchSeatTypes } = useQuery({
        queryKey: ['seat-types', selectedScreen],
        queryFn: async () => {
            if (!selectedScreen) return [];
            const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/halls/seat-types/${selectedScreen}`);
            const data = await res.json();
            return data.seatTypes || [];
        },
        enabled: !!selectedScreen && formData.type === "Seating",
    });

    // When seat types are fetched and categorized pricing is selected for seating, set categorizedPrices to match seat types
    useEffect(() => {
        if (
            formData.type === "Seating" &&
            formData.pricingOption === "categorized" &&
            seatTypes.length > 0
        ) {
            setFormData((prev) => ({
                ...prev,
                categorizedPrices: seatTypes.map(st => {
                    const found = prev.categorizedPrices.find(item => item.type === st.type);
                    return found
                        ? { ...found, numberOfTickets: st.count, numberOfSeats: st.count }
                        : { type: st.type, price: "", numberOfTickets: st.count, numberOfSeats: st.count };
                })
            }));
        }
        // eslint-disable-next-line
    }, [seatTypes, formData.type, formData.pricingOption]);

    // Check slot availability for seating events
    useEffect(() => {
        const checkSlot = async () => {
            if (
                formData.type === "Seating" &&
                selectedHall &&
                selectedScreen &&
                formData.start &&
                formData.end
            ) {
                try {
                    const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/event/check-seating-slot", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            hallID: selectedHall,
                            screenID: selectedScreen,
                            start: new Date(formData.start).toISOString(),
                            end: new Date(formData.end).toISOString()
                        })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        setSlotAvailable(true);
                        setSlotCheckMsg("");
                    } else {
                        setSlotAvailable(false);
                        setSlotCheckMsg(data.message || "Screen is unavailable for the selected time slot.");
                    }
                } catch (err) {
                    setSlotAvailable(false);
                    setSlotCheckMsg("Could not check slot availability. Please try again.");
                }
            } else {
                setSlotAvailable(true);
                setSlotCheckMsg("");
            }
        };
        checkSlot();
    }, [formData.type, selectedHall, selectedScreen, formData.start, formData.end]);

    // Validation functions for each step
    const isStepOneValid = () => {
        return formData.eventName && formData.type && formData.subtype;
    };

    const isStepTwoValid = () => {
        const commonFields = formData.start && formData.end && formData.description && formData.eventInstructions;
        const mandatoryFields = formData.language && formData.ratingCode && formData.eligibility_age !== "" && (formData.ticketsCancellable === true || formData.ticketsCancellable === false);

        if (formData.type === "Online") {
            return (
                commonFields &&
                mandatoryFields &&
                formData.onlineDetails.link &&
                formData.onlineDetails.platform &&
                formData.maxParticipantAllowed !== "" &&
                formData.posterPreview && 
                isValidPlatformLink(formData.onlineDetails.platform, formData.onlineDetails.link)
            );
        }

        if (formData.type === "Seating") {
            return commonFields && mandatoryFields && formData.seatingDetails.hall && formData.posterPreview;
        }

        if (formData.type === "Registration" || formData.type === "Open") {
            if (formData.isOnline) {
                // For online registration, skip location-related checks
                return (
                    commonFields &&
                    mandatoryFields &&
                    formData.maxParticipantAllowed !== "" &&
                    formData.posterPreview
                );
            } else {
                // For offline registration, require location details
                return (
                    commonFields &&
                    mandatoryFields &&
                    formData.location &&
                    formData.city &&
                    formData.state && 
                    formData.area_name &&
                    formData.pin !== "" &&
                    formData.maxParticipantAllowed !== "" &&
                    formData.posterPreview
                );
            }
        }

        return false;
    };

    const isStepThreeValid = () => {
        // Existing validation checks
        if (!formData.agreed) {
            return false;
        }

        if (formData.isPaid) {
            if (formData.pricingOption === "flat") {
                // Validate flat price
                return formData.flatPrice > 0;
            } else if (formData.pricingOption === "categorized") {
                if (formData.type === "Seating") {
                    // For seating, only require price for each seat type
                    return (
                        formData.categorizedPrices.length > 0 &&
                        formData.categorizedPrices.every(item => item.type && Number(item.price) > 0)
                    );
                } else {
                    // Validate categorized prices for non-seating
                    const totalTickets = formData.categorizedPrices.reduce(
                        (total, item) => total + Number(item.numberOfTickets),
                        0
                    );
                    const isCategorizedValid = formData.categorizedPrices.every(
                        (item) => item.type && item.numberOfTickets > 0 && item.price > 0
                    );

                    // Check if total tickets do not exceed maxParticipantAllowed
                    const isWithinMaxParticipants =
                        !!formData.maxParticipantAllowed &&
                        totalTickets === Number(formData.maxParticipantAllowed);

                    return isCategorizedValid && isWithinMaxParticipants;
                }
            }
        }

        return true; // Valid if event is not paid
    };

    // When 'Next' is clicked after choosing 'Seating', fetch all halls
    const handleNextStep = () => {
        if (step === 1 && formData.type === 'Seating') {
            refetchHalls();
        }
        setStep(step + 1);
    };

    // Helper for zone sum validation
    const getTotalTickets = (categories) => categories.reduce((total, item) => total + Number(item.numberOfTickets || 0), 0);
    const getTotalZoneParticipants = (zones) => zones.reduce((sum, z) => sum + Number(z.participants || 0), 0);

    const renderStepOne = () => (
        <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Event Basics</h2>
                <p className="text-gray-600 text-sm sm:text-base">Let's start with the fundamentals of your event</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Event Name</label>
                    <input
                        type="text"
                        placeholder="Enter your event name"
                        value={formData.eventName}
                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-base sm:text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    />
                </div>

                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-4">Event Type</label>
                    {/* Change made in gap-row-2 removed and eventType is commented for online and registration */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {eventTypes.map(({ name, icon: Icon }) => (
                            <button
                                key={name}
                                onClick={() => handleTypeSelect(name)}
                                className={`p-3 sm:p-6 border-2 rounded-lg sm:rounded-xl flex flex-row sm:flex-col items-center gap-2 sm:gap-3 transition-all hover:shadow-md ${
                                    formData.type === name 
                                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md" 
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                                style={{ minWidth: 0 }}
                            >
                                <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                                <span className="font-medium text-xs sm:text-base">{name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {formData.type && (
                    <div className="animate-fadeIn">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-4">Event Subtype</label>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {subTypes[formData.type].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => handleSubtypeSelect(st)}
                                    className={`px-3 py-2 sm:px-6 sm:py-3 border-2 rounded-full font-medium transition-all hover:shadow-sm text-xs sm:text-base ${
                                        formData.subtype === st 
                                            ? "bg-orange-50 border-orange-500 text-orange-700" 
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 border-t border-gray-200 gap-2 sm:gap-0">
                <div></div>
                <button
                    onClick={handleNextStep}
                    disabled={!isStepOneValid() || (formData.type === "Seating" && !slotAvailable)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-xs sm:text-base"
                >
                    Next Step
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );

    const isValidPlatformLink = (platform, link) => {
        const regexMap = {
            "Zoom": /^https:\/\/(?:[\w-]+\.)?zoom\.us\/(j|wc)\/\d{9,11}(\/join)?(\?pwd=[\w\d]+)?$/,
            "Google Meet": /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
            "Microsoft Teams": /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.+$/,
        };
    
        const regex = regexMap[platform];
        return regex ? regex.test(link) : true;
    };
    

    const renderStepTwo = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Step 2: Event Details</h2>

            {/* Mode Selection */}
            <div className="mb-4">
                <label className="block mb-1 font-medium text-gray-700">Select Mode of the Event</label>
                <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                        <input
                            type="radio"
                            name="eventMode"
                            value="Online"
                            checked={eventMode === "Online"}
                            onChange={() => setEventMode("Online")}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                        <span className="font-medium text-gray-700">Online</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                        <input
                            type="radio"
                            name="eventMode"
                            value="Offline"
                            checked={eventMode === "Offline"}
                            onChange={() => setEventMode("Offline")}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                        <span className="font-medium text-gray-700">Offline</span>
                    </label>
                </div>
            </div>

            {/* Online Event */}
            {formData.type === "Online" && (
                <div className="space-y-5">

                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Platform</label>
                        <select
                            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                            value={formData.onlineDetails.platform || ""}
                            onChange={(e) => handleOnlineChange("platform", e.target.value)}
                        >
                            <option value="" disabled>Select a platform</option>
                            <option value="Zoom">Zoom</option>
                            <option value="Google Meet">Google Meet</option>
                            <option value="Microsoft Teams">Microsoft Teams</option>
                        </select>
                    </div>


                    {formData.onlineDetails.platform && (
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Streaming Link</label>
                            <input
                                type="text"
                                placeholder="Enter meeting link"
                                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                value={formData.onlineDetails.link || ""}
                                onChange={(e) => handleOnlineChange("link", e.target.value)}
                            />
                            {!isValidPlatformLink(formData.onlineDetails.platform, formData.onlineDetails.link) && formData.onlineDetails.link && (
                                <p className="text-red-500 text-sm mt-1">Invalid link format for {formData.onlineDetails.platform}</p>
                            )}
                        </div>
                    )}


                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">
                            Is registration required for participants?
                        </label>
                        <input
                            type="checkbox"
                            className="w-5 h-5 mr-2 rounded-md border p-1"
                            checked={formData.onlineDetails.registrationRequired || false}
                            onChange={(e) => handleOnlineChange("registrationRequired", e.target.checked)}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Max Participants</label>
                        <input
                            type="number"
                            placeholder="e.g. 150"
                            className="w-full border p-3 rounded-xl"
                            min="0"
                            value={formData.maxParticipantAllowed}
                            onChange={(e) => setFormData({ ...formData, maxParticipantAllowed: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Seating Event */}
            {formData.type === "Seating" && (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">City</label>
                            <input
                                type="text"
                                placeholder="City"
                                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                value={formData.city}
                                onChange={(e) => {
                                    setFormData({ ...formData, city: e.target.value });
                                    setSelectedHall("");
                                    setScreens([]);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">State</label>
                            <input
                                type="text"
                                placeholder="State"
                                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                value={formData.state}
                                onChange={(e) => {
                                    setFormData({ ...formData, state: e.target.value });
                                    setSelectedHall("");
                                    setScreens([]);
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Select Hall</label>
                        {isLoading && step === 2 && formData.type === 'Seating' ? (
                            <div className="w-full border p-3 rounded-xl text-center text-gray-500">
                                Loading halls...
                            </div>
                        ) : (
                            <select
                                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                value={selectedHall}
                                onChange={async (e) => {
                                    setSelectedHall(e.target.value);
                                    setFormData({ ...formData, seatingDetails: { ...formData.seatingDetails, hall: e.target.value } });
                                }}
                                disabled={!formData.city || !formData.state}
                            >
                                <option value="">Choose a hall</option>
                                {filteredHalls.map((hall) => (
                                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    {/* Show screen dropdown when a hall is selected */}
                    {selectedHall && (
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Select Screen</label>
                            <select
                                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                value={selectedScreen}
                                onChange={(e) => {
                                    setSelectedScreen(e.target.value);
                                    setFormData({ ...formData, seatingDetails: { ...formData.seatingDetails, screen: e.target.value } });
                                }}
                            >
                                <option value="">Choose a screen</option>
                                {screens.map((screen) => (
                                    <option key={screen.id} value={screen.id}>{screen.name || `Screen ${screen.screen_no}`}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {formData.type === "Seating" && !slotAvailable && (
                        <div className="text-red-600 font-semibold text-center mt-2">{slotCheckMsg}</div>
                    )}
                    {/* <div>
                        <label className="block mb-1 font-medium text-gray-700">Venue Name</label>
                        <input
                            type="text"
                            placeholder="Venue Name"
                            className="w-full border p-3 rounded-xl"
                            value={formData.seatingDetails.venue || ""}
                            onChange={(e) => handleSeatingChange("venue", e.target.value)}
                        />
                    </div> */}
                </div>
            )}

            {/* Registration or Open Event */}
            {(formData.type === "Registration" || formData.type === "Open") && (
                <div className="space-y-5">
                    {eventMode === "Offline" && (
                        <>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Location</label>
                                <input
                                    type="text"
                                    placeholder="Location"
                                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        placeholder="State"
                                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700">Area Name</label>
                                    <input
                                        type="text"
                                        placeholder="Area Name"
                                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                        value={formData.area_name}
                                        onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700">PIN Code</label>
                                    <input
                                        type="number"
                                        placeholder="832107"
                                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                        min="0"
                                        value={formData.pin}
                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Max Participants</label>
                        <input
                            type="number"
                            placeholder="e.g. 150"
                            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                            min="0"
                            value={formData.maxParticipantAllowed}
                            onChange={(e) => setFormData({ ...formData, maxParticipantAllowed: e.target.value })}
                        />
                    </div>
                    {formData.type === "Registration" && (
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Eligibility Criteria</label>
                            <textarea
                                rows={3}
                                placeholder="Describe eligibility criteria for registration..."
                                className="w-full border-2 border-gray-200 p-3 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                                value={formData.eligibility_criteria || ""}
                                onChange={e => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                            />
                            {/* Competition Section */}
                            <div className="mt-6">
                                <label className="block font-semibold text-gray-700 mb-2">Is it a competition?</label>
                                <input
                                    type="checkbox"
                                    checked={formData.isCompetition}
                                    onChange={e => setFormData({ ...formData, isCompetition: e.target.checked, participationType: [], minTeamMembers: '', maxTeamMembers: '' })}
                                />
                                <span className="ml-2">Yes</span>
                                {formData.isCompetition && (
                                    <div className="mt-4 space-y-2">
                                        <label className="block font-medium text-gray-700 mb-1">Participation Type</label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.participationType.includes('individual')}
                                                    onChange={e => {
                                                        let updated = [...formData.participationType];
                                                        if (e.target.checked) {
                                                            updated.push('individual');
                                                        } else {
                                                            updated = updated.filter(t => t !== 'individual');
                                                        }
                                                        setFormData({ ...formData, participationType: updated });
                                                    }}
                                                />
                                                Individual Participation
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.participationType.includes('team')}
                                                    onChange={e => {
                                                        let updated = [...formData.participationType];
                                                        if (e.target.checked) {
                                                            updated.push('team');
                                                        } else {
                                                            updated = updated.filter(t => t !== 'team');
                                                        }
                                                        // If unchecked, clear min/max
                                                        setFormData({ ...formData, participationType: updated, minTeamMembers: e.target.checked ? formData.minTeamMembers : '', maxTeamMembers: e.target.checked ? formData.maxTeamMembers : '' });
                                                    }}
                                                />
                                                Team Based Participation
                                            </label>
                                        </div>
                                        {formData.participationType.includes('team') && (
                                            <div className="flex gap-4 mt-3">
                                                <div>
                                                    <label className="block text-gray-700 mb-1">Min Team Members</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="border p-2 rounded w-24"
                                                        value={formData.minTeamMembers}
                                                        onChange={e => setFormData({ ...formData, minTeamMembers: e.target.value })}
                                                        placeholder="Min"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 mb-1">Max Team Members</label>
                                                    <input
                                                        type="number"
                                                        min={formData.minTeamMembers || 1}
                                                        className="border p-2 rounded w-24"
                                                        value={formData.maxTeamMembers}
                                                        onChange={e => setFormData({ ...formData, maxTeamMembers: e.target.value })}
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Competition Section End */}
                            <div className="mt-6">
                                <label className="block mb-2 font-semibold text-gray-700">Add things to ask from the participant?</label>
                                {formData.registrationFields && formData.registrationFields.length > 0 && (
                                    <div className="space-y-3">
                                        {formData.registrationFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Field name"
                                                    className="border p-2 rounded w-1/2"
                                                    value={field.name}
                                                    onChange={e => {
                                                        const updated = [...formData.registrationFields];
                                                        updated[idx].name = e.target.value;
                                                        setFormData({ ...formData, registrationFields: updated });
                                                    }}
                                                />
                                                <select
                                                    className="border p-2 rounded w-1/4"
                                                    value={field.type}
                                                    onChange={e => {
                                                        const updated = [...formData.registrationFields];
                                                        updated[idx].type = e.target.value;
                                                        setFormData({ ...formData, registrationFields: updated });
                                                    }}
                                                >
                                                    <option value="Text">Text</option>
                                                    <option value="Number">Number</option>
                                                    <option value="Date">Date</option>
                                                    <option value="Media">Media</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                                                    title="Delete field"
                                                    onClick={() => {
                                                        const updated = formData.registrationFields.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, registrationFields: updated });
                                                    }}
                                                    disabled={formData.registrationFields.length === 1}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="mt-3 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            registrationFields: [
                                                ...formData.registrationFields,
                                                { name: '', type: 'Text' }
                                            ]
                                        });
                                    }}
                                >
                                    + Add Field
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4">
                <label className="block mb-1 font-medium text-gray-700">Genre</label>
                <select
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    value={formData.genre}
                    onChange={e => setFormData({ ...formData, genre: e.target.value })}
                >
                    <option value="" disabled>Select a genre</option>
                    <option value="Music">Music</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Action">Action</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Animation">Animation</option>
                    <option value="Biography">Biography</option>
                    <option value="Crime">Crime</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Drama">Drama</option>
                    <option value="Family">Family</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="History">History</option>
                    <option value="Horror">Horror</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Romance">Romance</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">Technology</option>
                    <option value="Education">Education</option>
                    <option value="Business">Business</option>
                    <option value="Health">Health</option>
                    <option value="Art">Art</option>
                    <option value="Theatre">Theatre</option>
                    <option value="Dance">Dance</option>
                    <option value="Literature">Literature</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Food & Drink">Food & Drink</option>
                    <option value="Charity">Charity</option>
                    <option value="Festival">Festival</option>
                    <option value="Party">Party</option>
                    <option value="Networking">Networking</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div className="mt-4">
                <label className="block mb-1 font-medium text-gray-700">Event Start</label>
                <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                />
            </div>

            <div className="mt-4">
                <label className="block mb-1 font-medium text-gray-700">Event End</label>
                <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                />
            </div>

            <div>
                <label className="block mb-2 font-medium text-gray-700">Booking Cutoff Type</label>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                        <input
                            type="radio"
                            name="cutoff"
                            value="before_start"
                            checked={formData.bookingCutOffType === "before_start"}
                            onChange={() => setFormData({ ...formData, bookingCutOffType: "before_start" })}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                        <span className="font-medium text-gray-700">Before Start</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                        <input
                            type="radio"
                            name="cutoff"
                            value="custom_time"
                            checked={formData.bookingCutOffType === "custom_time"}
                            onChange={() => setFormData({ ...formData, bookingCutOffType: "custom_time" })}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                        <span className="font-medium text-gray-700">Custom Time</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                        <input
                            type="radio"
                            name="cutoff"
                            value="none"
                            checked={formData.bookingCutOffType === "none"}
                            onChange={() => setFormData({ ...formData, bookingCutOffType: "none" })}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                        <span className="font-medium text-gray-700">None</span>
                    </label>
                </div>

                {formData.bookingCutOffType === "before_start" && (
                    <div className="mt-3">
                        <label className="block mb-1 text-gray-700">Minutes Before Start</label>
                        <input
                            type="number"
                            placeholder="e.g. 30"
                            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                            min="0"
                            value={formData.bookingCutoffMinutesBeforeStart}
                            onChange={(e) => setFormData({ ...formData, bookingCutoffMinutesBeforeStart: e.target.value })}
                        />
                    </div>
                )}

                {formData.bookingCutOffType === "custom_time" && (
                    <div className="mt-3">
                        <label className="block mb-1 text-gray-700">Select Custom Cutoff Time</label>
                        <input
                            type="datetime-local"
                            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                            value={formData.bookingCutoffCustomTime}
                            onChange={(e) => setFormData({ ...formData, bookingCutoffCustomTime: e.target.value })}
                        />
                    </div>
                )}
            </div>

            <div>
                <label className="block mb-2 font-medium text-gray-700">Event Poster</label>
                <div className="w-full border-2 border-dashed border-gray-300 p-6 rounded-xl text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <label htmlFor="poster-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                        <ImagePlus className="w-10 h-10 text-gray-500" />
                        <span className="text-gray-500 text-sm">Click to upload poster (JPG, PNG)</span>
                    </label>
                    <input
                        type="file"
                        id="poster-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {formData.posterPreview && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-1">Preview:</p>
                        <img
                            src={formData.posterPreview}
                            alt="Event Poster Preview"
                            className="w-1/3 max-w-xs rounded-xl border shadow"
                        />
                        <button
                            type="button"
                            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition cursor-pointer"
                            onClick={() => {
                                setFormData((prev) => ({
                                    ...prev,
                                    poster: null,
                                    posterPreview: "",
                                    posterBase64: "",
                                }));
                                const input = document.getElementById("poster-upload");
                                if (input) input.value = null;
                            }}
                        >
                            Remove Image
                        </button>
                    </div>
                )}
            </div>

            <div>
                <label className="block mb-1 font-medium text-gray-700">Event Description</label>
                <textarea
                    rows={4}
                    placeholder="Describe your event in detail..."
                    className="w-full border-2 border-gray-200 p-3 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="mt-4">
                <label className="block mb-1 font-medium text-gray-700">Event Instructions</label>
                <textarea
                    rows={3}
                    placeholder="Any specific instructions for attendees..."
                    className="w-full border-2 border-gray-200 p-3 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                    value={formData.eventInstructions}
                    onChange={(e) => setFormData({ ...formData, eventInstructions: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block mb-1 font-medium text-gray-700">Language</label>
                    <select
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                        value={formData.language}
                        onChange={e => setFormData({ ...formData, language: e.target.value })}
                    >
                        <option value="" disabled>Select Language</option>
                        <option value="Hindi">Hindi</option>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Kannada">Kannada</option>
                        <option value="Malayalam">Malayalam</option>
                        <option value="Punjabi">Punjabi</option>
                        <option value="Odia">Odia</option>
                        <option value="Assamese">Assamese</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Sanskrit">Sanskrit</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700">Rating Code</label>
                    <select
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                        value={formData.ratingCode}
                        onChange={e => setFormData({ ...formData, ratingCode: e.target.value })}
                    >
                        <option value="" disabled>Select Rating</option>
                        <option value="U">U (Universal)</option>
                        <option value="UA">UA (Parental Guidance)</option>
                        <option value="A">A (Adults Only)</option>
                        <option value="S">S (Restricted to Special Class)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block mb-1 font-medium text-gray-700">Minimum Eligibility Age</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                        value={formData.eligibility_age}
                        onChange={e => setFormData({ ...formData, eligibility_age: e.target.value })}
                        placeholder="e.g. 18"
                    />
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700">Are tickets cancellable?</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                            <input
                                type="radio"
                                name="ticketsCancellable"
                                value="true"
                                checked={formData.ticketsCancellable === true}
                                onChange={() => setFormData({ ...formData, ticketsCancellable: true })}
                                className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                            />
                            <span className="font-medium text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                            <input
                                type="radio"
                                name="ticketsCancellable"
                                value="false"
                                checked={formData.ticketsCancellable === false}
                                onChange={() => setFormData({ ...formData, ticketsCancellable: false })}
                                className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                            />
                            <span className="font-medium text-gray-700">No</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                    onClick={() => setStep(1)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <button
                    onClick={() => setStep(3)}
                    disabled={!isStepTwoValid() || (formData.type === "Seating" && !slotAvailable)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    Next Step
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );

    const renderStepThree = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Step 3: Payment Info</h2>

            <div>
                {/* Is this event paid? */}
                <div className="flex items-center gap-3 mb-2">
                    <input
                        type="checkbox"
                        checked={formData.isPaid}
                        onChange={(e) =>
                            setFormData({ ...formData, isPaid: e.target.checked })
                        }
                    />
                    <span>Is this event paid?</span>
                </div>

                {/* Radio options if event is paid */}
                {formData.isPaid && (
                    <div className="mb-4">
                        <label className="block font-semibold">Select pricing option</label>

                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                                <input
                                    type="radio"
                                    name="priceOption"
                                    value="flat"
                                    checked={formData.pricingOption === "flat"}
                                    onChange={(e) =>
                                        setFormData({ ...formData, pricingOption: e.target.value })
                                    }
                                    className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                />
                                <span className="font-medium text-gray-700">Flat price</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
                                <input
                                    type="radio"
                                    name="priceOption"
                                    value="categorized"
                                    checked={formData.pricingOption === "categorized"}
                                    onChange={(e) =>
                                        setFormData({ ...formData, pricingOption: e.target.value })
                                    }
                                    className="w-4 h-4 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                />
                                <span className="font-medium text-gray-700">Categorized price</span>
                            </label>
                        </div>

                        {/* Flat price inputs */}
                        {formData.pricingOption === "flat" && (
                            <div className="bg-gray-100 p-4 rounded-md mt-4">
                                <label className="block font-semibold">Type</label>
                                <input
                                    type="text"
                                    value="Flat"
                                    disabled
                                    className="w-full p-2 border rounded-md mt-1"
                                />

                                <label className="block font-semibold mt-4">
                                    Ticket price (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.flatPrice}
                                    onChange={(e) =>
                                        setFormData({ ...formData, flatPrice: e.target.value })
                                    }
                                    className="w-full p-2 border rounded-md mt-1"
                                    placeholder="Enter price in Rupees"
                                />
                            </div>
                        )}

                        {/* Categorized Price for Seating */}
                        {formData.pricingOption === "categorized" && formData.type === "Seating" && (
                            <div className="bg-gray-100 p-4 rounded-md mt-4">
                                <h4 className="font-semibold">Categories (Seat Types)</h4>
                                {seatTypes.length === 0 ? (
                                    <div className="text-red-500">No seat types available for the selected screen.</div>
                                ) : (
                                    formData.categorizedPrices.map((item, index) => {
                                        const seatTypeObj = seatTypes.find(st => st.type === item.type);
                                        return (
                                            <div key={index} className="mb-4 p-4 border rounded-md relative">
                                                {/* Type */}
                                                <label className="block font-semibold">Type {index + 1}</label>
                                                <input
                                                    type="text"
                                                    value={item.type}
                                                    disabled
                                                    className="w-full p-2 border rounded-md mt-1 bg-gray-200"
                                                />
                                                {/* Number of seats for this type */}
                                                <div className="text-gray-700 mb-2">
                                                    Number of seats: <span className="font-bold">{seatTypeObj?.count ?? '-'}</span>
                                                </div>
                                                {/* Ticket price (₹) */}
                                                <label className="block font-semibold mt-4">Ticket price (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const updated = [...formData.categorizedPrices];
                                                        updated[index].price = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            categorizedPrices: updated,
                                                        });
                                                    }}
                                                    className="w-full p-2 border rounded-md mt-1"
                                                    placeholder="Enter price in Rupees"
                                                />
                                            </div>
                                        );
                                    })
                                )}
                                {/* Validation: all seat types must have a price */}
                                {seatTypes.length > 0 && formData.categorizedPrices.some(item => !item.price) && (
                                    <div className="text-red-500 text-sm mt-2">Please enter a price for all seat types.</div>
                                )}
                            </div>
                        )}
                        {/* Categorized Price for Non-Seating */}
                        {formData.pricingOption === "categorized" && formData.type !== "Seating" && (
                            <div className="bg-blue-50 p-4 rounded-xl mt-4 border border-blue-200 shadow-sm">
                                <h4 className="font-semibold mb-4 text-blue-700 text-lg flex items-center gap-2">
                                    <span>Categories</span>
                                    <span className="text-xs text-blue-400 font-normal">(Sum of tickets must equal Max Participants Allowed)</span>
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead>
                                            <tr className="text-blue-800">
                                                <th className="px-2 py-1">Category Name</th>
                                                <th className="px-2 py-1">Number of Tickets</th>
                                                <th className="px-2 py-1">Price (₹)</th>
                                                <th className="px-2 py-1"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.categorizedPrices.map((item, index) => (
                                                <tr key={index} className="bg-white hover:bg-blue-100 transition rounded-lg shadow border border-blue-100">
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="text"
                                                            value={item.type}
                                                            onChange={e => {
                                                                const updated = [...formData.categorizedPrices];
                                                                updated[index].type = e.target.value;
                                                                setFormData({ ...formData, categorizedPrices: updated });
                                                            }}
                                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300"
                                                            placeholder="e.g. VIP, General, Balcony"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.numberOfTickets}
                                                            onChange={e => {
                                                                const updated = [...formData.categorizedPrices];
                                                                updated[index].numberOfTickets = e.target.value;
                                                                setFormData({ ...formData, categorizedPrices: updated });
                                                            }}
                                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300"
                                                            placeholder="e.g. 50"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.price}
                                                            onChange={e => {
                                                                const updated = [...formData.categorizedPrices];
                                                                updated[index].price = e.target.value;
                                                                setFormData({ ...formData, categorizedPrices: updated });
                                                            }}
                                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300"
                                                            placeholder="Enter price"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-center">
                                                        <button
                                                            type="button"
                                                            className="text-red-500 hover:text-red-700 text-xl font-bold rounded-full p-1 transition"
                                                            title="Remove category"
                                                            onClick={() => {
                                                                const updated = formData.categorizedPrices.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, categorizedPrices: updated });
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    type="button"
                                    className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            categorizedPrices: [
                                                ...formData.categorizedPrices,
                                                { type: "", numberOfTickets: "", price: "" }
                                            ]
                                        });
                                    }}
                                >
                                    <span className="text-lg font-bold">+</span> Add Category
                                </button>
                                {/* Validation: sum of tickets must equal maxParticipantAllowed */}
                                {formData.maxParticipantAllowed && (
                                    (() => {
                                        const total = formData.categorizedPrices.reduce((sum, item) => sum + Number(item.numberOfTickets || 0), 0);
                                        if (total !== Number(formData.maxParticipantAllowed)) {
                                            return <div className="text-red-500 text-sm mt-2">Total number of tickets across all categories must equal Max Participants Allowed ({formData.maxParticipantAllowed}).</div>;
                                        }
                                        return null;
                                    })()
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.agreed}
                        onChange={(e) =>
                            setFormData({ ...formData, agreed: e.target.checked })
                        }
                    />
                    <span>
                        I agree to the
                        <NavLink
                            to="/terms"
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-600 ml-1"
                        >
                            terms and conditions
                        </NavLink>
                    </span>
                </div>

                <div className="flex justify-between pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setStep(2)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <button
                        onClick={() => {
                            console.log("Form Data to be sent:", formData);
                            mutation.mutate();
                        }}
                        disabled={!isStepThreeValid() || loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Create Event
                    </button>
                </div>
            </div>
        </div>
    );

    const loadingCreateEvent = () => {
        return (
            <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4 bg-white/90 px-8 py-6 rounded-2xl shadow-2xl backdrop-blur-md">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-t-[#1A73E8] border-b-[#FF5722] border-l-transparent border-r-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            🎬
                        </div>
                    </div>
                    <div className="text-xl font-semibold text-[#1A73E8] text-center">
                        Creating your event...
                    </div>
                    {loadingMsg && (
                        <div className="text-sm text-gray-700 text-center">
                            {loadingMsg}
                        </div>
                    )}
                </div>
            </div>
        );
    }


    const renderStepThreeWithSpinner = () => {
        return (
            <>
                {renderStepThree()}
                {loading && loadingCreateEvent()}
            </>
        )
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8">
            <div className="max-w-4xl mx-auto px-2 sm:px-6">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Create Your Event</h1>
                    <p className="text-gray-600 text-base sm:text-lg">Step {step} of 3 - Let's bring your event to life</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                                    step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {stepNum}
                                </div>
                                {stepNum < 3 && (
                                    <div className={`w-10 h-1 sm:w-24 mx-1 sm:mx-2 rounded-full ${
                                        step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                        <span>Event Basics</span>
                        <span>Event Details</span>
                        <span>Payment Info</span>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
                    {step === 1 && renderStepOne()}
                    {step === 2 && renderStepTwo()}
                    {step === 3 && renderStepThreeWithSpinner()}
                </div>
            </div>
        </div>
    );
};

