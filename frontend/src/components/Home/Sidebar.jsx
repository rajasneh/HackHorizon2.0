import { useEffect, useRef } from "react";
import { useModal } from "../../context/ModalContext";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FiBell, FiUser, FiBookOpen, FiLogOut, FiChevronRight, FiSettings, FiHelpCircle, FiGift, FiLock, FiPlus, FiPercent, FiArrowLeft, FiX } from "react-icons/fi";
import { Ticket } from "lucide-react";

export const Sidebar = () => {
    const { isSidebarOpen, setSidebarOpen, showLoginModal } = useModal();
    const sidebarRef = useRef(null);
    const { user, setUser, setEmailData } = useAuth();

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setSidebarOpen(false);
            }
        };
        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSidebarOpen, setSidebarOpen]);

    const handleLogout = async () => {
        try {
            const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/logout", {
                method: 'GET',
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setUser(null);
                setEmailData("");
                setSidebarOpen(false);
                localStorage.removeItem('userCity');
                localStorage.removeItem('userState');
                toast.success("Logged out successfully!")
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.log("Error in Logging Out ", err);
            alert("Can't Log Out");
        }
    };

    // console.log("User : ", user);

    return (
        <>
            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 right-0 h-full w-80 sm:w-90 bg-white z-[100] shadow-2xl flex flex-col transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Back Button - Mobile Only */}
                <div className="sm:hidden flex items-center justify-between p-4 border-b border-gray-100">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 touch-manipulation"
                        aria-label="Close sidebar"
                    >
                        <FiArrowLeft className="text-lg" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    {/* <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 touch-manipulation"
                        aria-label="Close sidebar"
                    >
                        <FiX className="text-lg text-gray-600" />
                    </button> */}
                </div>
                
                {user ? (
                    /* User Profile Section for logged-in users */
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 border-b border-gray-100">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl sm:text-3xl font-bold mb-2">
                            {user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U")}
                        </div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1 text-center px-4">{user?.name || user?.userData?.name || "Hey!"}</div>
                        <div className="text-xs text-blue-500 cursor-pointer hover:underline text-center px-4 truncate max-w-full">{user?.email || user?.userData?.email}</div>
                    </div>
                ) : (
                    /* Prominent Sign In Section for non-logged-in users */
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                        <div className="text-center mb-4">
                            <FiUser className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                            <h3 className="text-lg font-semibold text-gray-800">Welcome to TktPlz</h3>
                            <p className="text-sm text-gray-600 mt-1">Sign in to access your bookings and offers</p>
                        </div>
                        <button
                            onClick={() => {
                                showLoginModal();
                                setSidebarOpen(false);
                            }}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Sign In / Register
                        </button>
                    </div>
                )}
                {/* Menu */}
                <nav className="flex-1 overflow-y-auto">
                    <ul className="py-2 divide-y divide-gray-100">
                        {/* Mobile-only menu items */}
                        <li className="sm:hidden">
                            <NavLink to="/org-login" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                <FiPlus className="text-lg sm:text-xl text-orange-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <span className="flex-1 text-gray-800 text-sm sm:text-base">List My Show</span>
                                <FiChevronRight className="text-gray-400 group-hover:text-orange-500 flex-shrink-0" />
                            </NavLink>
                        </li>
                        {/* <li className="sm:hidden">
                            <NavLink to="/" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                <FiPercent className="text-lg sm:text-xl text-orange-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <span className="flex-1 text-gray-800 text-sm sm:text-base">Offers</span>
                                <FiChevronRight className="text-gray-400 group-hover:text-orange-500 flex-shrink-0" />
                            </NavLink>
                        </li> */}
                        <li>
                            <NavLink to="/notifications" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                <FiBell className="text-lg sm:text-xl text-blue-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <span className="flex-1 text-gray-800 text-sm sm:text-base">Notifications</span>
                                <FiChevronRight className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            </NavLink>
                        </li>
                        {user && (
                            <li>
                                <NavLink to="/your-orders" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                    <Ticket className="text-lg sm:text-xl text-blue-500 mr-3 sm:mr-4 flex-shrink-0" />
                                    <span className="flex-1 text-gray-800 text-sm sm:text-base">My Tickets</span>
                                    <FiChevronRight className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                                </NavLink>
                            </li>
                        )}
                        {/* {user && (
                            <li>
                                <NavLink to="/profile" className="flex items-center px-6 py-4 hover:bg-gray-50 transition group" onClick={() => setSidebarOpen(false)}>
                                    <FiUser className="text-xl text-blue-500 mr-4" />
                                    <span className="flex-1 text-gray-800">Account & Settings</span>
                                    <FiChevronRight className="text-gray-400 group-hover:text-blue-500" />
                                </NavLink>
                            </li>
                        )} */}
                        <li>
                            <NavLink to="/report-issue" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                <FiHelpCircle className="text-lg sm:text-xl text-blue-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <span className="flex-1 text-gray-800 text-sm sm:text-base">Report an Issue</span>
                                <FiChevronRight className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            </NavLink>
                        </li>
                        {/* <li>
                            <NavLink to="/rewards" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                <FiGift className="text-lg sm:text-xl text-blue-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <span className="flex-1 text-gray-800 text-sm sm:text-base">Rewards</span>
                                <FiChevronRight className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            </NavLink>
                        </li> */}
                        <li>
                            <NavLink to="/privacy-policy" className="flex items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition group touch-manipulation" onClick={() => setSidebarOpen(false)}>
                                <FiLock className="text-lg sm:text-xl text-blue-500 mr-3 sm:mr-4 flex-shrink-0" />
                                <span className="flex-1 text-gray-800 text-sm sm:text-base">Privacy Policy</span>
                                <FiChevronRight className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            </NavLink>
                        </li>
                    </ul>
                </nav>
                {/* Sign Out Button */}
                {user && (
                    <div className="p-4 sm:p-6 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 sm:py-3 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition text-base sm:text-lg touch-manipulation"
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

