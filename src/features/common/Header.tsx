import React, { useEffect, useState } from 'react';
import {
    Bell,
    Search,
    ChevronDown,
    LogOut,
    User
} from 'lucide-react';
import { useUser } from '../dashboard/context/DashboardContext';
import { getUserData,logout } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
const Header = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const UserDataAPI = async () => {
        const res = await getUserData();
        // console.log('User Data:', res);
        setUser(res.user);
    }

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return 'Good Morning';
        } else if (hour < 17) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    }
    const profile = () => {
        navigate('/profile');
    }
    const handleLogout = async() => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await logout()
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
    }

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    }

    // Close dropdown when clicking outside
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
        UserDataAPI()
    }, [])

    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Hello {user?.firstName || 'Guest'}
                    </h1>
                </div>
                <p className="text-gray-600 text-sm">
                    {getGreeting()}
                </p>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Icon */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Search className="w-5 h-5 text-gray-600" />
                </button>

                {/* Notification Bell */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {/* Optional notification badge */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* User Dropdown */}
                <div className="relative dropdown-container">
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                            {(user?.profilePicture)?                           
                                <img 
                                    src={user?.profilePicture} 
                                    alt="Profile" 
                                    className={`w-24 h-8 rounded-full object-cover transition-all duration-300`}
                                />
                                :
                                <span className="text-white text-sm font-medium">
                                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'G'}                                        
                                </span>                          
                                
                            }
                        </div>
                        <span className="text-gray-700 font-medium">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest'}
                        </span>
                        <ChevronDown 
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`} 
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.email || 'guest@example.com'}
                                </p>
                            </div>
                            
                            <button
                                onClick={profile}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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