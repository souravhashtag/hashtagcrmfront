import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Download, Edit, Check, X, Clock } from 'lucide-react';

interface Schedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface Employee {
  id: number;
  name: string;
  department: string;
  schedule: Schedule;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  isMultipleEdit?: boolean;
  selectedCount?: number;
  dayName?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, onClose, isMultipleEdit = false, selectedCount = 0, dayName = "" }) => {
  const [isOff, setIsOff] = useState(value === 'OFF');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endPeriod, setEndPeriod] = useState('PM');

  useEffect(() => {
    if (value && value !== 'OFF') {
      // Parse existing time format like "10am-7pm" or "9am-6pm"
      const timeMatch = value.match(/(\d{1,2})([ap]m)-(\d{1,2})([ap]m)/i);
      if (timeMatch) {
        const [, startHour, startPer, endHour, endPer] = timeMatch;
        setStartTime(`${startHour.padStart(2, '0')}:00`);
        setEndTime(`${endHour.padStart(2, '0')}:00`);
        setStartPeriod(startPer.toUpperCase());
        setEndPeriod(endPer.toUpperCase());
        setIsOff(false);
      }
    }
  }, [value]);

  const formatTime = () => {
    if (isOff) return 'OFF';
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    const formatHour = (hour: number, period: string) => {
      if (period === 'AM' && hour === 12) return '12';
      if (period === 'PM' && hour === 12) return '12';
      if (period === 'PM' && hour < 12) return hour.toString();
      return hour.toString();
    };

    return `${formatHour(startHour, startPeriod)}${startPeriod.toLowerCase()}-${formatHour(endHour, endPeriod)}${endPeriod.toLowerCase()}`;
  };

  const handleSave = () => {
    onChange(formatTime());
    onClose();
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 1; i <= 12; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  const hours = generateHours();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {isMultipleEdit ? `Set ${dayName} Schedule for ${selectedCount} Employees` : 'Set Schedule Time'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {isMultipleEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                You are editing the <strong>{dayName}</strong> schedule for <strong>{selectedCount}</strong> selected employees. 
                This will overwrite their current schedule for this day.
              </p>
            </div>
          )}

          {/* OFF Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="off-day"
              checked={isOff}
              onChange={(e) => setIsOff(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="off-day" className="text-sm font-medium text-gray-700">
              Day Off
            </label>
          </div>

          {!isOff && (
            <>
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {hours.map(hour => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {hours.map(hour => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-md p-3">
                <span className="text-sm text-gray-600">Preview: </span>
                <span className="font-medium">{formatTime()}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Roster = () => {
  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("All Departments");
  const options = ["All Departments", "DM Team", "HR", "CSR"];

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Date picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Table state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Edit state
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDay, setTimePickerDay] = useState<keyof Schedule | null>(null);
  const [timePickerValue, setTimePickerValue] = useState("");
  
  // Multiple edit state
  const [showMultipleEditModal, setShowMultipleEditModal] = useState(false);
  const [multipleEditDay, setMultipleEditDay] = useState<keyof Schedule | null>(null);
  
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Sample employee data with departments
  const [allEmployees, setAllEmployees] = useState<Employee[]>([
    {
      id: 1,
      name: 'Darlene Robertson',
      department: 'DM Team',
      schedule: {
        monday: '10am-7pm',
        tuesday: '10am-7pm',
        wednesday: '10am-7pm',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: 'OFF',
        sunday: 'OFF'
      }
    },
    {
      id: 2,
      name: 'Jenny Wilson',
      department: 'HR',
      schedule: {
        monday: '10am-7pm',
        tuesday: 'OFF',
        wednesday: 'OFF',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: '10am-7pm',
        sunday: '10am-7pm'
      }
    },
    {
      id: 3,
      name: 'Robert Johnson',
      department: 'CSR',
      schedule: {
        monday: '9am-6pm',
        tuesday: '9am-6pm',
        wednesday: '9am-6pm',
        thursday: '9am-6pm',
        friday: '9am-6pm',
        saturday: 'OFF',
        sunday: 'OFF'
      }
    },
    {
      id: 4,
      name: 'Sarah Davis',
      department: 'DM Team',
      schedule: {
        monday: '8am-5pm',
        tuesday: 'OFF',
        wednesday: '8am-5pm',
        thursday: '8am-5pm',
        friday: '8am-5pm',
        saturday: '8am-5pm',
        sunday: 'OFF'
      }
    },
    {
      id: 5,
      name: 'Michael Brown',
      department: 'HR',
      schedule: {
        monday: '10am-7pm',
        tuesday: '10am-7pm',
        wednesday: 'OFF',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: 'OFF',
        sunday: 'OFF'
      }
    },
    {
      id: 6,
      name: 'Lisa Anderson',
      department: 'CSR',
      schedule: {
        monday: '9am-6pm',
        tuesday: '9am-6pm',
        wednesday: '9am-6pm',
        thursday: 'OFF',
        friday: '9am-6pm',
        saturday: '9am-6pm',
        sunday: 'OFF'
      }
    }
  ]);

  // Filter employees based on search term and selected department
  const filteredEmployees = allEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selected === "All Departments" || employee.department === selected;
    return matchesSearch && matchesDepartment;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Edit functions
  const startEditing = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEditingSchedule({ ...employee.schedule });
  };

  const cancelEditing = () => {
    setEditingEmployeeId(null);
    setEditingSchedule(null);
  };

  const saveEditing = () => {
    if (editingEmployeeId && editingSchedule) {
      setAllEmployees(prev => 
        prev.map(emp => 
          emp.id === editingEmployeeId 
            ? { ...emp, schedule: editingSchedule }
            : emp
        )
      );
      setEditingEmployeeId(null);
      setEditingSchedule(null);
    }
  };

  const updateScheduleField = (day: keyof Schedule, value: string) => {
    if (editingSchedule) {
      setEditingSchedule(prev => prev ? { ...prev, [day]: value } : null);
    }
  };

  // Time picker functions
  const openTimePicker = (day: keyof Schedule, currentValue: string) => {
    setTimePickerDay(day);
    setTimePickerValue(currentValue);
    setShowTimePicker(true);
  };

  const closeTimePicker = () => {
    setShowTimePicker(false);
    setTimePickerDay(null);
    setTimePickerValue("");
  };

  const handleTimePickerSave = (newValue: string) => {
    if (timePickerDay) {
      updateScheduleField(timePickerDay, newValue);
    }
    closeTimePicker();
  };

  // Multiple edit functions
  const getDayName = (day: keyof Schedule): string => {
    const dayNames = {
      sunday: 'Sunday',
      monday: 'Monday', 
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday'
    };
    return dayNames[day];
  };

  const openMultipleEditModal = (day: keyof Schedule) => {
    if (selectedRows.size === 0) {
      alert('Please select at least one employee to edit.');
      return;
    }
    setMultipleEditDay(day);
    setTimePickerValue(""); // Start with empty value for multiple edit
    setShowMultipleEditModal(true);
  };

  const closeMultipleEditModal = () => {
    setShowMultipleEditModal(false);
    setMultipleEditDay(null);
    setTimePickerValue("");
  };

  const handleMultipleEditSave = (newValue: string) => {
    if (multipleEditDay && selectedRows.size > 0) {
      setAllEmployees(prev => 
        prev.map(emp => 
          selectedRows.has(emp.id) 
            ? { ...emp, schedule: { ...emp.schedule, [multipleEditDay]: newValue } }
            : emp
        )
      );
      // Clear selection after edit
      setSelectedRows(new Set());
    }
    closeMultipleEditModal();
  };

  // Render Multiple Edit Day Selection Modal
  const renderMultipleEditDayModal = () => {
    const dayOptions: { key: keyof Schedule; label: string }[] = [
      { key: 'sunday', label: 'Sunday' },
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Multiple Edit - Select Day
            </h3>
            <button
              onClick={() => setShowMultipleEditModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>{selectedRows.size}</strong> employees selected for editing.
                Choose which day you want to update:
              </p>
            </div>

            <div className="space-y-2">
              {dayOptions.map((day) => (
                <button
                  key={day.key}
                  onClick={() => openMultipleEditModal(day.key)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{day.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowMultipleEditModal(false)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Function to get week dates based on selected Sunday
  const getWeekDates = (sundayDate: Date | null) => {
    if (!sundayDate) {
      // Default to current week if no date selected
      const today = new Date();
      const currentSunday = new Date(today);
      currentSunday.setDate(today.getDate() - today.getDay());
      sundayDate = currentSunday;
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sundayDate);
      date.setDate(sundayDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  // Format date for header display
  const formatHeaderDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Add ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${getOrdinal(day)} ${month}`;
  };

  // Get the current week dates (starting with Sunday)
  const weekDates = getWeekDates(selectedDate);
  const [sunday, monday, tuesday, wednesday, thursday, friday, saturday] = weekDates;

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

  // Calendar functions
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a date is a Sunday
  const isSunday = (day: number | null): boolean => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay() === 0; // Sunday is 0
  };

  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day: number | null): void => {
    if (day && isSunday(day)) {
      const newDate = new Date(currentYear, currentMonth, day);
      setSelectedDate(newDate);
      setIsDatePickerOpen(false);
    }
  };

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

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number | null): boolean => {
    if (!selectedDate || !day) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  // Find next Sunday for "Today" button
  const getNextSunday = (): Date => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday;
  };

  // Table functions
  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === filteredEmployees.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredEmployees.map(item => item.id)));
    }
  };

  const calendarDays = generateCalendarDays();
  const pageNumbers: number[] = [1, 2, 3, 4];

  // Render schedule cell (editable or display)
  const renderScheduleCell = (employee: Employee, day: keyof Schedule) => {
    const isEditing = editingEmployeeId === employee.id;
    const value = isEditing && editingSchedule ? editingSchedule[day] : employee.schedule[day];
    
    if (isEditing) {
      return (
        <button
          onClick={() => openTimePicker(day, value)}
          className="w-full px-2 py-1 text-center text-sm border border-gray-300 rounded hover:border-teal-500 focus:outline-none focus:border-teal-500 transition-colors bg-white"
        >
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{value}</span>
          </div>
        </button>
      );
    }
    
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="p-4 w-full">
      <div className='w-full mx-auto bg-white shadow-sm rounded-lg p-6 mb-6'>
        <div className='text-[20px] font-semibold'>Roster</div>
        <p className='text-[#A2A1A8] text-[14px]'>All Employee Roster List</p>
      </div>
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-end">
        {/* Department Filter Dropdown */}
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
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Name Search Input */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
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
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-white border border-[#14b8a6] cursor-pointer"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            >
              <span className={`${selectedDate ? 'text-gray-900' : 'text-gray-500'}`}>
                {selectedDate ? formatDate(selectedDate) : 'Select a Sunday'}
              </span>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            {isDatePickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
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

                <div className="grid grid-cols-7 gap-0 p-2">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day)}
                      disabled={!day || !isSunday(day)}
                      className={`
                        h-10 w-10 text-sm rounded-full transition-all duration-200
                        ${!day ? 'cursor-default' : 
                          isSunday(day) 
                            ? 'cursor-pointer hover:bg-blue-50' 
                            : 'cursor-not-allowed opacity-30'
                        }
                        ${isSelected(day) && isSunday(day)
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : isToday(day) && isSunday(day)
                          ? 'bg-blue-100 text-blue-600 font-semibold'
                          : day && isSunday(day)
                          ? 'text-gray-700 hover:text-blue-600'
                          : day && !isSunday(day)
                          ? 'text-gray-300 bg-gray-50'
                          : ''
                        }
                      `}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => {
                      const nextSunday = getNextSunday();
                      setSelectedDate(nextSunday);
                      setCurrentMonth(nextSunday.getMonth());
                      setCurrentYear(nextSunday.getFullYear());
                      setIsDatePickerOpen(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Next Sunday
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

        {/* Export Button */}
        <button className="flex items-center gap-2 w-36 justify-center px-4 py-3 rounded-lg bg-[#0BB8A7] border border-[#14b8a6] text-white hover:bg-[#0aa596] transition cursor-pointer">
          <Download />
          Export
        </button>
      </div>
</div>
      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} 
        {searchTerm && ` matching "${searchTerm}"`}
        {selected !== "All Departments" && ` in ${selected}`}
        {selectedDate && (
          <span className="ml-2 font-medium">
            • Week of {formatDate(selectedDate)}
          </span>
        )}
      </div>

      {/* Employee Schedule Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    checked={selectedRows.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={toggleAllRows}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[180px]">
                  Employee Name
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Sunday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(sunday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Monday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(monday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Tuesday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(tuesday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Wednesday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(wednesday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Thursday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(thursday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Friday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(friday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Saturday</span>
                    <span className="text-xs font-normal">{formatHeaderDate(saturday)}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium w-24">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No employees found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee: Employee) => (
                  <tr key={employee.id} className={`hover:bg-gray-50 ${editingEmployeeId === employee.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={selectedRows.has(employee.id)}
                        onChange={() => toggleRowSelection(employee.id)}
                        disabled={editingEmployeeId === employee.id}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      <div>
                        <div>{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.department}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'sunday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'monday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'tuesday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'wednesday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'thursday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'friday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, 'saturday')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingEmployeeId === employee.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={saveEditing}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditing(employee)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Edit schedule"
                          disabled={editingEmployeeId !== null}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMultipleEditModal(true)}
              disabled={selectedRows.size === 0}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedRows.size === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
            >
              Multiple Edit {selectedRows.size > 0 && `(${selectedRows.size})`}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm h-[30px]">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing 1 to {Math.min(10, filteredEmployees.length)} out of {filteredEmployees.length} records
            </span>
            
            <div className="flex items-center gap-1">
              <button 
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {pageNumbers.map((page: number) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded ${
                    currentPage === page
                      ? 'text-black border border-[#14b8a6]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setCurrentPage(Math.min(4, currentPage + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <TimePicker
          value={timePickerValue}
          onChange={handleTimePickerSave}
          onClose={closeTimePicker}
        />
      )}

      {/* Multiple Edit Time Picker Modal */}
      {showMultipleEditModal && multipleEditDay && (
        <TimePicker
          value={timePickerValue}
          onChange={handleMultipleEditSave}
          onClose={closeMultipleEditModal}
          isMultipleEdit={true}
          selectedCount={selectedRows.size}
          dayName={getDayName(multipleEditDay)}
        />
      )}

      {/* Multiple Edit Day Selection Modal */}
      {showMultipleEditModal && !multipleEditDay && renderMultipleEditDayModal()}
    </div>
  );
};

export default Roster;