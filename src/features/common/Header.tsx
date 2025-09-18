import React, { useEffect, useState } from 'react';
import {
    Bell,
    Search,
    ChevronDown,
    LogOut,
    User
} from 'lucide-react';
import { useUser } from '../dashboard/context/DashboardContext';
import { getUserData, logout } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const UserDataAPI = async () => {
        const res = await getUserData();
        if (!res.user) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            window.location.href = '/';
        }
        setUser(res.user);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const profile = () => {
        navigate('/profile');
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await logout();
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setUser(null);
            setIsDropdownOpen(false);
            window.location.href = `/${process.env.REACT_APP_URL}`;
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        UserDataAPI();
    }, []);

    return (
        <div className="flex flex-wrap items-center justify-between p-1 sm:p-4 bg-white">
            {/* Greeting Section */}
            <div className="flex flex-col mb-2 sm:mb-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-2xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-none">
                        Hello {user?.firstName || 'Guest'}
                    </h1>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                    {getGreeting()}
                </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Search */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Search className="w-5 h-5 text-gray-600" />
                </button>

                {/* Notifications */}
                <button className="p-1.5 sm:p2 bg-[#E1F7EF] rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* User Dropdown */}
                <div className="relative dropdown-container hover:bg-gray-100 rounded-lg transition-colors">
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center gap-1 sm:gap-2 p-2 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 overflow-hidden ">
                            {user?.profilePicture ? (
                                <img
                                    src={user?.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white text-sm font-medium">
                                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'G'}
                                </span>
                            )}
                        </div>

                        {/* Hide name on mobile */}
                        <span className="hidden sm:block text-gray-700 font-medium truncate max-w-[120px]">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest'}
                        </span>

                        <ChevronDown
                            className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 sm:w-60 bg-white rounded-lg shadow-lg py-1 z-50">
                            <div className="px-4 py-2">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email || 'guest@example.com'}
                                </p>
                            </div>

                            <button
                                onClick={profile}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
