import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Settings, Users, LayoutDashboard, Calendar, TrendingUp, UsersRound, MessageSquare, BarChart, Landmark, ChevronRight, Bell, Search } from "lucide-react";

export const AdminLayout = () => {

    const { user, setUser, setEmailData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationCount, setNotificationCount] = useState(3); // Example notification count
    
    // Handle search submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Implement search functionality here
            console.log('Searching for:', searchQuery);
            // You could navigate to a search results page or filter content
            // navigate(`/moderator/adm/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };
    
    useEffect(() => {
        const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
        
        // Create breadcrumb items
        const breadcrumbItems = [];
        let currentPath = '';
        
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            // Format the segment for display (capitalize, replace hyphens with spaces)
            const formattedSegment = segment
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
                
            breadcrumbItems.push({
                label: formattedSegment,
                path: currentPath,
                isLast: index === pathSegments.length - 1
            });
        });
        
        setBreadcrumbs(breadcrumbItems);
    }, [location]);
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
                localStorage.removeItem('userCity');
                localStorage.removeItem('userState');
                toast.success("Logged out successfully!")
                navigate("/admin/login");
            } else {
                toast.error(data.message);
            }

        } catch (err) {
            console.log("Error in Logging Out ", err);
            toast.error("Can't Log Out");
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-100">
            {/* Backdrop overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out" 
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-blue-600">Admin Panel</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded hover:bg-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink
                        to="/moderator/adm/dashboard"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/organizer-management"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <Users className="w-4 h-4" /> Organizer Management
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/event-management"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <Calendar className="w-4 h-4" /> Event Management
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/hall-management"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <Landmark className="w-4 h-4" /> Hall Management
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/financials"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <TrendingUp className="w-4 h-4" /> Financial Summary
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/attendees"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <UsersRound className="w-4 h-4" /> Attendees
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/support"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <MessageSquare className="w-4 h-4" /> Messages or Support
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/analytics"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <BarChart className="w-4 h-4" /> Analytics
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/invite-admin"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <Users className="w-4 h-4" /> Invite Admin
                    </NavLink>
                    <NavLink
                        to="/moderator/adm/others"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200">
                        <Settings className="w-4 h-4" /> Other Tools
                    </NavLink>
                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            handleLogout();
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-red-100 text-red-600 w-full">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </nav>

            </div>

            {/* Topbar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-md sticky top-0 z-30">
                {/* Upper section with menu and user profile */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-full hover:bg-blue-700 transition-colors duration-200 mr-3"
                        >
                            <Menu className="w-6 h-6 text-white" />
                        </button>
                        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Search bar - hidden on mobile */}
                        <div className="hidden md:flex items-center relative">
                            <form onSubmit={handleSearch} className="relative">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..." 
                                    className="pl-9 pr-4 py-1 rounded-full text-sm bg-blue-700 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white w-40 lg:w-64"
                                />
                                <button 
                                    type="submit" 
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                                {searchQuery && (
                                    <button 
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </form>
                        </div>
                        
                        {/* Notification bell */}
                        <button className="relative p-2 rounded-full hover:bg-blue-700 transition-colors duration-200">
                            <Bell className="w-5 h-5 text-white" />
                            {notificationCount > 0 && (
                                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </button>
                        
                        <div className="hidden md:flex items-center text-white">
                            <span className="text-sm font-medium">Welcome,</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Breadcrumb navigation */}
                {breadcrumbs.length > 0 && (
                    <div className="px-4 py-2 bg-blue-700 text-blue-100 text-sm flex items-center overflow-x-auto whitespace-nowrap">
                        <NavLink to="/moderator/adm/dashboard" className="hover:text-white">
                            Home
                        </NavLink>
                        {breadcrumbs.map((breadcrumb, index) => (
                            <div key={index} className="flex items-center">
                                <ChevronRight className="w-4 h-4 mx-2" />
                                {breadcrumb.isLast ? (
                                    <span className="font-medium text-white">{breadcrumb.label}</span>
                                ) : (
                                    <NavLink to={breadcrumb.path} className="hover:text-white">
                                        {breadcrumb.label}
                                    </NavLink>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <main className="p-6 z-10 relative max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}