import React, { useState } from 'react';
import { Calendar as Cal, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface EventData {
  type?: string;
  label?: string;
  emoji: string;
}

interface EventsMap {
  [key: number]: EventData;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1)); // April 2025 (month is 0-indexed)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = monthNames[currentMonth];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };
  const events: EventsMap = {
    1: { type: 'holiday', label: 'Add your holiday', emoji: '😊' },
    2: { type: 'holiday', label: 'Orthodox Easter', emoji: '😊' },
    3: { emoji: '😊' },
    4: { emoji: '😊' },
    5: { type: 'holiday', label: 'Cinco de Mayo', emoji: '😊' },
    6: { emoji: '😊' },
    7: { emoji: '😊' },
    8: { emoji: '😊' },
    9: { type: 'holiday', label: "Mother's Day", emoji: '😊' },
    10: { emoji: '😊' },
    11: { emoji: '😊' },
    12: { type: 'holiday', label: 'Eid al-Fitr', emoji: '😊' },
    13: { emoji: '😊' },
    14: { emoji: '😊' },
    15: { emoji: '😊' },
    16: { emoji: '😊' },
    17: { type: 'tax', label: 'Tax Day', emoji: '😊' },
    18: { emoji: '😊' },
    19: { emoji: '😊' },
    20: { emoji: '😊' },
    21: { emoji: '😊' },
    22: { emoji: '😊' },
    23: { emoji: '😊' },
    24: { emoji: '😊' },
    25: { emoji: '😊' },
    26: { emoji: '😊' },
    27: { type: 'beach', label: 'Beach day 🏖️🏄', emoji: '😊' },
    28: { type: 'beach', label: 'Beach day 🏖️🏄', emoji: '😊' },
    29: { type: 'beach', label: 'Beach day 🏖️🏄', emoji: '😊' },
    30: { type: 'beach', label: 'Beach day 🏖️🏄', emoji: '😊' },
    31: { type: 'memorial', label: 'Memorial Day', emoji: '😊' }
  };

  const getDayClass = (day: number): string => {
    const event = events[day];
    if (!event) return 'bg-white';
    
    switch (event.type) {
      case 'holiday':
        return day === 1 ? 'bg-teal-100' : 'bg-teal-100';
      case 'tax':
        return 'bg-pink-200';
      case 'beach':
        return 'bg-blue-100';
      case 'memorial':
        return 'bg-teal-100';
      default:
        return 'bg-white';
    }
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfWeek(currentYear, currentMonth);

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const event = events[day];
      const dayOfWeek = (day + firstDayOffset - 1) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Saturday or Sunday
      
      days.push(
        <div
          key={day}
          className={`h-20 border border-gray-200 p-2 relative cursor-pointer hover:bg-gray-50 transition-colors ${getDayClass(day)} ${isWeekend ? 'opacity-60' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          <div className="flex items-start justify-between">
            <span className={`text-sm font-medium ${isWeekend ? 'text-gray-400' : 'text-gray-700'}`}>
              {day}
            </span>
            {event && (
              <span className="text-sm">{event.emoji}</span>
            )}
          </div>
          {event && event.label && (
            <div className="mt-1">
              <div className="text-xs text-gray-600 leading-tight">
                {event.label}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const handleDayClick = (day: number) => {
    console.log(`Clicked on day ${day} of ${monthName} ${currentYear}`);
    // Add your day click logic here
  };

  return (
    <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-[#65e3d7] p-5 pb-10">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cal className="w-5 h-5 text-gray-600 border" />
            <h1 className="text-lg font-semibold text-gray-900">Attendance Schedule</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              onClick={() => navigateMonth('prev')}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-900 px-3 min-w-[120px] text-center">
              {monthName} {currentYear}
            </span>
            <button 
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              onClick={() => navigateMonth('next')}
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekdays.map((day) => (
          <div key={day} className="px-4 py-3 text-sm font-medium text-gray-700 text-center border">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;