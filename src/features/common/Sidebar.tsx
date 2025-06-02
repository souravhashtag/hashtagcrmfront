import React, { useState } from 'react';
import logo from '../../images/logo.png'; // relative path to file in src


import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  CalendarCheck,
  Wallet,
  Briefcase,
  UserCheck,
  ClipboardList,
  CalendarDays,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type MenuItem = {
  name: string;
  icon: LucideIcon;
};

const Sidebar = (): React.ReactElement => {
  const [active, setActive] = useState('Dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    // Optional: apply theme to document.body or via context
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'All Employees', icon: Users },
    { name: 'All Departments', icon: BriefcaseBusiness },
    { name: 'Attendance', icon: CalendarCheck },
    { name: 'Payroll', icon: Wallet },
    { name: 'Jobs', icon: Briefcase },
    { name: 'Candidates', icon: UserCheck },
    { name: 'Leaves', icon: ClipboardList },
    { name: 'Holidays', icon: CalendarDays },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
      <img src={logo} alt="Hashtag Biz Logo" style={{ width: '90%', height: 'auto'}} />

      </div>

      <ul className="nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li
              key={item.name}
              className={active === item.name ? 'active' : ''}
              onClick={() => setActive(item.name)}
              style={{ cursor: 'pointer' }}
            >
              <span className="icon">
                <IconComponent className="w-5 h-5" />
              </span>
              {item.name}
            </li>
          );
        })}
      </ul>

      <div className="theme-toggle">
        <button
          className={theme === 'light' ? 'light active' : 'light'}
          onClick={() => handleThemeToggle('light')}
        >
          <Sun className="w-4 h-4" /> Light
        </button>
        <button
          className={theme === 'dark' ? 'dark active' : 'dark'}
          onClick={() => handleThemeToggle('dark')}
        >
          <Moon className="w-4 h-4" /> Dark
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
