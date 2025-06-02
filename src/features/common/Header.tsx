import React from 'react';
import { 
    Bell,
    Search
} from 'lucide-react';


const Header = () => {
    return (
        <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Hello Robert 👋</h1>
                    <p className="text-sm text-gray-500">Good Morning</p>
                </div>
                
                <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                    
                    {/* Notification */}
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Bell className="w-5 h-5" />
                    </button>
                    
                    {/* Profile */}
                    <div className="flex items-center space-x-2">
                        <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                            alt="Robert Allen"
                            className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-gray-700">Robert Allen</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header
