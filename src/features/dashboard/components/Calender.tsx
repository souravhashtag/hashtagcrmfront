import React, { useState, useEffect } from 'react';
import { Calendar as Cal, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { 
  useGetEventsMapQuery, 
  useCreateEventMutation,
  useDeleteEventMutation,
  useUpdateEventMutation 
} from '../../../services/eventService';

interface EventData {
  type?: string;
  label?: string;
  emoji?: string;
}

interface EventsMap {
  [key: number]: EventData;
}

interface CalendarProps {
  userId?: string;
}

const Calendar: React.FC<CalendarProps> = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ day: number; event: EventData } | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = monthNames[currentMonth];

  // RTK Query hooks
  const { 
    data: eventsResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetEventsMapQuery({
    year: currentYear,
    month: currentMonth+1,
  });

  console.log('Events Response:', eventsResponse);
  // Get events data from API response
  const events: EventsMap = eventsResponse?.data || {};

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
    return firstDay === 0 ? 6 : firstDay - 1; 
  };

  const getDayClass = (day: number): string => {
    const event = events[day];
    if (!event || !event.label || event.label.trim() === '') {
      return 'bg-white';
    }
    // console.log('Event Type:', event.type);
    // Color coding based on event type
    switch (event.type?.toLowerCase()) {
      case 'holiday':
        return 'bg-teal-100';
      case 'leave':
        return 'bg-red-200';
      case 'beach':
        return 'bg-blue-100';
      case 'memorial':
        return 'bg-teal-100';
      case 'meeting':
        return 'bg-yellow-100';
      case 'appointment':
        return 'bg-purple-100';
      case 'birthday':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  

  const handleDayClick = (day: number) => {
    const event = events[day];
    
    if (event && event.label && event.label.trim() !== '') {
      // Show event popup for existing events only
      setSelectedEvent({ day, event });
      setShowEventPopup(true);
    }
    // Do nothing for empty days - no modal
  };

  const EventPopup = () => {
    if (!showEventPopup || !selectedEvent) return null;

    const { day, event } = selectedEvent;

    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 `}>
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-[90vw]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthName} {day}, {currentYear}
            </h3>
            <button
              onClick={() => {
                setShowEventPopup(false);
                setSelectedEvent(null);
              }}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3"> 
            
            <div>
              <span className="text-sm font-medium text-gray-600 block mb-2"></span>
              <div className="bg-gray-50 p-3 rounded border text-sm text-gray-800 leading-relaxed">
                {event.label}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowEventPopup(false);
                setSelectedEvent(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
            
          </div>
        </div>
      </div>
    );
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
      const hasEvent = event && event.label && event.label.trim() !== '';
      
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
              <span className="text-sm">{event?.emoji}</span>
            )}
          </div>
          {hasEvent && (
            <div className="mt-1">
              <div className="text-xs text-gray-700 leading-tight">
                {event?.label && event.label.split(' ').length > 3 
                  ? `${event.label.split(' ').slice(0, 3).join(' ')}...` 
                  : event?.label}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-[#65e3d7] p-5 pb-10">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-red-300 p-5 pb-10">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="text-red-600 mb-4">
            <Cal className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Failed to load calendar</h3>
            <p className="text-sm text-gray-600 mt-1">
              {error ? 'Error loading events' : 'Something went wrong'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-[#65e3d7] p-5 pb-10 relative">
        {/* Header */}
        <div className="bg-white border-b px-6 py-5 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cal className="w-5 h-5 text-gray-600 border" />
              <h1 className="text-lg font-semibold text-gray-900">Attendance Schedule</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                onClick={() => navigateMonth('prev')}
                aria-label="Previous month"
                disabled={isLoading}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-900 px-3 min-w-[120px] text-center">
                {monthName} {currentYear}
              </span>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                onClick={() => navigateMonth('next')}
                aria-label="Next month"
                disabled={isLoading}
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

      <EventPopup />
    </>
  );
};

export default Calendar;