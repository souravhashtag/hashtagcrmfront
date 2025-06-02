import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  UserCheck, 
  Palmtree, 
  Settings
} from 'lucide-react';

const sidebarItems = [
  { icon: Building2, label: 'Dashboard', active: true },
  { icon: Users, label: 'All Employees' },
  { icon: Building2, label: 'All Departments' },
  { icon: UserCheck, label: 'Attendance' },
  { icon: DollarSign, label: 'Payroll' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Users, label: 'Candidates' },
  { icon: Palmtree, label: 'Leaves' },
  { icon: Calendar, label: 'Holidays' },
  { icon: Settings, label: 'Settings' }
];

const Sidebar = (): React.ReactElement => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [theme, setTheme] = useState('Light');

  return (
    <div className="w-64 bg-gray-50 min-h-screen p-6 flex flex-col border-r border-gray-200">
      {/* Logo Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600">HASHTAG</h1>
        <p className="text-sm text-blue-500 -mt-1">SOLUTIONS</p>
      </div>
      
      {/* Navigation Section */}
      <nav className="space-y-2 flex-1">
        {sidebarItems.map((item, index) => (
          <div
            key={index}
            onClick={() => setActiveItem(item.label)}
            className={`flex items-center py-3 px-4 cursor-pointer transition-all duration-200 ${
              item.label === activeItem 
                ? 'bg-teal-100 text-teal-700 rounded-lg' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg'
            }`}
          >
            <item.icon className="w-5 h-5 mr-4 flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </nav>
      
      {/* Theme Toggle Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setTheme('Light')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              theme === 'Light' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Light
          </button>
          <button 
            onClick={() => setTheme('Dark')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              theme === 'Dark' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;