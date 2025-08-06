import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react';
import RosterList from './RosterList';


const Roster = () => {
  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Select an option");
  const options = ["DM Team", "HR", "CSR"];

  // Date picker state - these were missing in your original code
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Ref for date picker - this was missing
  const datePickerRef = useRef<HTMLDivElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get days in month
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (day: number | null): void => {
    if (day) {
      const newDate = new Date(currentYear, currentMonth, day);
      setSelectedDate(newDate);
      setIsDatePickerOpen(false);
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next'): void => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if date is today
  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day: number | null): boolean => {
    if (!selectedDate || !day) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="p-4 w-full">
      <div className='w-full mx-auto bg-white shadow-lg rounded-lg p-6 mb-6'>
        <div className='text-[20px] font-semibold'>Roster</div>
        <p className='text-[#A2A1A8] text-[14px]'>All Employee Roster List</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-end">
        {/* Dropdown */}
        <div className="relative w-64 border border-[#14b8a6] rounded-lg">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="border border-gray-300 rounded-lg p-3 flex justify-between items-center cursor-pointer bg-white"
          >
            <span>{selected}</span>
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isOpen && (
            <ul className="absolute z-10 border border-gray-300 mt-1 w-full bg-white rounded-lg shadow-md">
              {options.map((option, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Name..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg border border-[#14b8a6]"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-3.5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        </div>

        {/* Date Picker */}
        <div className="w-64">
          <div className="relative" ref={datePickerRef}>
            <div
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-white border border-[#14b8a6]"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            >
              <span className={`${selectedDate ? 'text-gray-900' : 'text-gray-500'}`}>
                {selectedDate ? formatDate(selectedDate) : 'Select a date'}
              </span>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            {isDatePickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <h3 className="text-lg font-semibold text-gray-800">
                    {months[currentMonth]} {currentYear}
                  </h3>
                  
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0 p-2">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day)}
                      disabled={!day}
                      className={`
                        h-10 w-10 text-sm rounded-full transition-all duration-200
                        ${!day ? 'cursor-default' : 'cursor-pointer hover:bg-blue-50'}
                        ${isSelected(day) 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : isToday(day)
                          ? 'bg-blue-100 text-blue-600 font-semibold'
                          : day
                          ? 'text-gray-700 hover:text-blue-600'
                          : ''
                        }
                      `}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today);
                      setCurrentMonth(today.getMonth());
                      setCurrentYear(today.getFullYear());
                      setIsDatePickerOpen(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Today
                  </button>
                  
                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

        
        </div>
      <button className="flex items-center gap-2 w-36 justify-center px-4 py-3 rounded-lg bg-[#0BB8A7] border border-[#14b8a6] text-white hover:bg-[#0aa596] transition cursor-pointer">
     <Download />
      Export
    </button>
      </div>

        <RosterList />
      
    </div>
  );
};

export default Roster;