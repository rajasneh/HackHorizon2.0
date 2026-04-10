import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaChartLine, FaSignOutAlt, FaHome, FaBars, FaTimes, FaQrcode, FaBug, FaFileInvoice } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Menu, X, CreditCard, Building2 } from "lucide-react";

export const ProtectedOrganiserLayout = () => {
    const { user, setUser, setEmailData } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [checkingDetails, setCheckingDetails] = useState(true);
    const [upiId, setUpiId] = useState('');
    const [bankingName, setBankingName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const logout = async () => {
        try {
            const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/logout", {
                method: 'GET',
                credentials: "include",
            });

            const data = await res.json();

            if (data.success) {
                setUser(null);
                setEmailData("");
                localStorage.removeItem('userCity');
                localStorage.removeItem('userState');
                navigate("/org-login");
                toast.success("Logged out successfully!")
            } else {
                toast.error(data.message);
            }

        } catch (err) {
            console.log("Error in Logging Out ", err);
            toast.error("Can't Log Out");
        }
    };


    const handleClick = () => {
        navigate("/organiser/create-event");
    }

    useEffect(() => {
        const checkBankingDetails = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/organizer/details-exist/${user.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                const result = await response.json();

                if (!result.exists) {
                    setShowPaymentModal(true);
                }
            } catch (err) {
                console.error('Error checking banking details:', err);
            } finally {
                setCheckingDetails(false);
            }
        };

        checkBankingDetails();
    }, [user?.id]);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (!upiId || !bankingName) {
            toast.error('Please fill all fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(import.meta.env.VITE_BASE_URL + '/api/organizer/add-banking-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    orgId: user.id,
                    upiID: upiId,
                    bankingName: bankingName
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Payment details added successfully!');
                setShowPaymentModal(false);
                navigate('/organiser/dashboard');
            } else {
                toast.error(result.message || 'Failed to add payment details');
            }
        } catch (err) {
            console.error('Error adding payment details:', err);
            toast.error('Something went wrong!');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 text-gray-800 font-inter">
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-40 transform transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between px-6 py-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo2.PNG"
                            alt="TktPlz"
                            className="w-24 h-10 object-contain"
                        />
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="hover:bg-slate-700/50 p-2 rounded-lg transition-all duration-200"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{user?.name?.charAt(0) || "O"}</span>
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">{user?.name || "Organiser"}</p>
                            <p className="text-slate-400 text-xs">Event Organiser</p>
                        </div>
                    </div>
                </div>
                <nav className="flex flex-col gap-1 sm:gap-2 px-4 py-6">
                    <NavLink
                        to="/organiser/dashboard"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`
                        }
                    >
                        <FaHome className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/organiser/events"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`
                        }
                    >
                        <FaCalendarAlt className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>My Events</span>
                    </NavLink>
                    <NavLink
                        to="/organiser/analytics"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`
                        }
                    >
                        <FaChartLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Analytics</span>
                    </NavLink>
                    <NavLink
                        to="/organiser/scan-qr"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`
                        }
                    >
                        <FaQrcode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Scan QR</span>
                    </NavLink>
                    <NavLink
                        to="/organiser/invoice"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`
                        }
                    >
                        <FaFileInvoice className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Income Receipt</span>
                    </NavLink>
                    <NavLink
                        to="/organiser/report-issue"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`
                        }
                    >
                        <FaBug className="w-5 h-5 group-hover:scale-110 transition-transform max-sm:relative max-sm:right-1" />
                        <span className="max-sm:relative max-sm:right-2">Report an Issue</span>


                    </NavLink>
                </nav>

                <div className="absolute bottom-6 left-4 right-4">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group border border-red-500/20 hover:border-red-500/40"
                    >
                        <FaSignOutAlt className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* --------------------------------------- */}

            {/* Top Bar */}
            <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Logo and Brand */}
                    <div className="flex flex-col items-center gap-1">
                        <img
                            src="https://res.cloudinary.com/dgxc8nspo/image/upload/v1749873899/maw2lnlkowbftjvtldna.png"
                            alt="TktPlz"
                            className="w-26 h-8 object-cover object-center"
                        />
                        {/* <p className="text-xs text-gray-500 font-medium">Organiser Dashboard</p> */}
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="hidden md:block text-center">
                    <p className="text-sm text-gray-500">Welcome back,</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.name || "Organiser"}</p>
                </div>

                {/* Create Event Button */}
                <button
                    onClick={handleClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md 
             hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
             transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span className="hidden sm:inline">Create Event</span>
                </button>

            </header>

            {/* Content */}
            <main className="p-6 z-10 relative">
                {checkingDetails ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    </div>
                ) : showPaymentModal ? (
                    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 mt-5">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-8 h-8 text-gray-600" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Payment Details Required</h2>
                                <p className="text-blue-100">Complete your profile to start receiving payments</p>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Building2 className="w-4 h-4 inline mr-2" />
                                        Account Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={bankingName}
                                        onChange={(e) => setBankingName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter account holder name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <CreditCard className="w-4 h-4 inline mr-2" />
                                        UPI ID
                                    </label>
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="yourname@upi"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${submitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                                        } text-white shadow-lg`}
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                        </div>
                                    ) : (
                                        'Save Payment Details'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <Outlet />
                )}
            </main>
        </div>
    );
};
