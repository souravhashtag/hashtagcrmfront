import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search, Download, CheckCircle, XCircle, AlertCircle, Home, Eye } from 'lucide-react';
import { useGetAttendanceByDateQuery } from '../../../services/AttendanceRedxService';
import { useGetWeekRosterQuery } from '../../../services/rosterServices';
import { useGetEmployeesQuery } from '../../../services/employeeServices';
import AttendanceMonthlyView from './AttendanceMonthlyView';

// Type definitions
interface Employee {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    department?: {
      _id: string;
      name: string;
      description: string;
    };
    role?: {
      _id: string;
      name: string;
      display_name: string;
      level: number;
    };
    gender?: string;
    phone?: string;
  };
  employeeId: string;
  workingTimezone: string;
  joiningDate?: string;
  dob?: string;
  salary?: {
    amount: number;
    currency: string;
    paymentFrequency: string;
  };
  date: string;
  status: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  location?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  isScheduled?: boolean;
  isEarlyArrival?: boolean;
  isLateArrival?: boolean;
  isEarlyDeparture?: boolean;
  isLateDeparture?: boolean;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  wfh: number;
  halfDay: number;
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  bgcolor?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  type?: string;
  time?: string;
  checkinTime?: string;
  checkoutTime?: string;
  timestamp?: string;
  timezone: string;
  status: string;
  workingHours?: number;
}

type ViewType = 'daily' | 'monthly';
type StatusType = '';

// Helper function to get current date in employee's timezone
const getCurrentDateInTimezone = (timezone: string): string => {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: timezone });
};

// Helper function to get week number and year from date
const getWeekInfo = (dateString: string) => {
  const date = new Date(dateString);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  
  return {
    year: date.getFullYear(),
    weekNumber: weekNumber
  };
};

// Helper function to get day name from date
const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// Helper function to parse time string to minutes
const parseTimeToMinutes = (timeString: string): number => {
  if (!timeString || timeString === 'OFF') return 0;
  
  // Handle formats like "10:00", "10am", "10:30am", "19-08-2025 20:00"
  let cleanTime = timeString;
  
  // Extract time from datetime format "19-08-2025 20:00"
  const datetimeMatch = timeString.match(/\d{2}-\d{2}-\d{4}\s+(\d{1,2}:\d{2})/);
  if (datetimeMatch) {
    cleanTime = datetimeMatch[1];
  }
  
  const time24Match = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
  if (time24Match) {
    return parseInt(time24Match[1]) * 60 + parseInt(time24Match[2]);
  }
  
  const time12Match = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (time12Match) {
    let hours = parseInt(time12Match[1]);
    const minutes = parseInt(time12Match[2] || '0');
    const ampm = time12Match[3].toLowerCase();
    
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  }
  
  return 0;
};

// Helper function to convert minutes to time string
const minutesToTimeString = (minutes: number): string => {
  if (minutes === null || minutes === undefined) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to format date in employee's timezone
const formatDateInTimezone = (dateString: string, timezone: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper function to format time in employee's timezone
const formatTimeInTimezone = (timeString?: string, timezone?: string): string => {
  if (!timeString || !timezone) return '--';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      timeZone: timezone,
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return timeString;
  }
};

// Helper function to convert UTC time to employee timezone and get minutes
const convertUTCToTimezoneMinutes = (utcTimeString: string, timezone: string): number => {
  if (!utcTimeString || !timezone) return 0;
  try {
    const utcDate = new Date(utcTimeString);
    const timezoneDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    return timezoneDate.getHours() * 60 + timezoneDate.getMinutes();
  } catch {
    return 0;
  }
};

// Get current time in employee's timezone
const getCurrentTimeInTimezone = (timezone: string) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
};

const Attendance: React.FC = () => {
  const [selectedView, setSelectedView] = useState<ViewType>('daily');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] // Format: YYYY-MM-DD
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 100;

  // Initialize selected date based on first employee's timezone
  const {
    data: employeesResponse,
    isLoading: employeesLoading,
    refetch: refetchEmployees,
    isFetching
  } = useGetEmployeesQuery(
    { page: currentPage, limit, search },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  // Set initial date when employees data loads
  useEffect(() => {
    if (employeesResponse?.data?.length > 0 && !selectedDate) {
      const firstEmployee = employeesResponse.data[0];
      if (firstEmployee.workingTimezone) {
        setSelectedDate(getCurrentDateInTimezone(firstEmployee.workingTimezone));
      }
    }
  }, [employeesResponse, selectedDate]);

  // Get week info for roster query
  const weekInfo = getWeekInfo(selectedDate || new Date().toISOString().split('T')[0]);
  
  console.log("employeesResponse", employeesResponse);

  // RTK Query hooks
  const { 
    data: attendanceResponse, 
    error, 
    isLoading, 
    refetch 
  } = useGetAttendanceByDateQuery(selectedDate);

  const { 
    data: rosterResponse,
    isLoading: rosterLoading 
  } = useGetWeekRosterQuery({
    year: weekInfo.year,
    weekNumber: weekInfo.weekNumber
  });

  // Extract data from API responses
  const attendance: Employee[] = attendanceResponse?.data?.attendance || [];
  const employeeData: Employee[] = employeesResponse?.data || [];
  const attendanceMap = new Map(attendance.map(item => [item.userId._id, item]));
  console.log("attendanceMap", attendanceMap);
  
  const attendanceData: Employee[] = employeeData.map(emp => { 
    const attendanceGet = attendanceMap.get(emp?.userId?._id);
    return attendanceGet ? { ...emp, ...attendanceGet } : { 
      ...emp, 
      date: selectedDate, 
      status: 'Not logged in yet', 
      clockIn: undefined, 
      clockOut: undefined, 
      totalHours: 0,
      isScheduled: false,
      isEarlyArrival: false,
      isLateArrival: false,
      isEarlyDeparture: false,
      isLateDeparture: false
    };
  });
  // console.log("mergedAttendanceData", attendanceData); 

  const rosterData = rosterResponse?.data || [];
  const apiSummary = attendanceResponse?.data?.summary || {};

  const getEmployeeSchedule = (employeeId: string, date: string) => {
    const dayName = getDayName(date) as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    
    const employeeRoster = rosterData.find((roster: any) => {
      return roster.employee?._id == employeeId;
    });
    
    if (employeeRoster && employeeRoster.schedule && employeeRoster.schedule[dayName]) {
      const dayScheduleString = employeeRoster.schedule[dayName];
      // console.log(`Roster for Employee ID: ${employeeId} on ${dayName}:`, dayScheduleString);
      
      if (dayScheduleString && dayScheduleString !== 'OFF' && dayScheduleString !== '---') {
        if (dayScheduleString.includes('-')) {
          const [start, end] = [
            dayScheduleString?.split(" ")[1].split("-")[0], 
            dayScheduleString?.split(" ")[2] ? dayScheduleString.split(" ")[2] : dayScheduleString.split(" ")[3].split("-")[0]
          ];
          return {
            startTime: start.trim(),
            endTime: end.trim(),
            isScheduled: true
          };
        } else {
          return {
            startTime: dayScheduleString.trim(),
            endTime: dayScheduleString.trim(),
            isScheduled: true
          };
        }
      }
    }

    return null;
  };

  const enhancedAttendanceData: Employee[] = attendanceData.map(employee => {
    const schedule = getEmployeeSchedule(employee?.userId?.employeeId ?? employee?._id, employee.date);

    if (!schedule) {
      return {
        ...employee,
        scheduledStartTime: '--',
        scheduledEndTime: '--',
        isScheduled: false,
        isEarlyArrival: false,
        isLateArrival: false,
        isEarlyDeparture: false,
        isLateDeparture: false
      };
    }

    const scheduledStartMinutes = parseTimeToMinutes(schedule.startTime);
    const scheduledEndMinutes = parseTimeToMinutes(schedule.endTime);
    
    let actualClockInMinutes = 0;
    let actualClockOutMinutes = 0;
    
    // Convert UTC stored times to employee's timezone before parsing
    if (employee.clockIn) {
      actualClockInMinutes = convertUTCToTimezoneMinutes(employee.clockIn, employee.workingTimezone);
    }
    
    if (employee.clockOut) {
      actualClockOutMinutes = convertUTCToTimezoneMinutes(employee.clockOut, employee.workingTimezone);
    }
    
    // Calculate attendance status based on roster in employee's timezone
    let enhancedStatus = employee.status;
    let isEarlyArrival = false;
    let isLateArrival = false;
    let isEarlyDeparture = false;
    let isLateDeparture = false;

    if (employee.clockIn && scheduledStartMinutes > 0 && actualClockInMinutes > 0) {
      const timeDifference = actualClockInMinutes - scheduledStartMinutes;
      const gracePerodMinutes = 15; // 15 min grace period
      
      // Early arrival: clocked in before scheduled time
      isEarlyArrival = timeDifference < -gracePerodMinutes;
      
      // Late arrival: clocked in after grace period
      isLateArrival = timeDifference > gracePerodMinutes;
      
      // Update status based on timezone-converted times
      if (isLateArrival) {
        enhancedStatus = 'late';
      } else if (employee.clockIn && !isLateArrival) {
        enhancedStatus = 'present';
      }
    }

    if (employee.clockOut && scheduledEndMinutes > 0 && actualClockOutMinutes > 0) {
      isEarlyDeparture = actualClockOutMinutes < (scheduledEndMinutes - 15); // 15 min before scheduled end
      isLateDeparture = actualClockOutMinutes > (scheduledEndMinutes + 15); // 15 min after scheduled end
    }

    // If no clock in/out but scheduled, mark as absent
    if (schedule.isScheduled && !employee.clockIn && !employee.clockOut && 
        (enhancedStatus === 'Not logged in yet' || enhancedStatus === 'absent')) {
      enhancedStatus = 'absent';
    }

    return {
      ...employee,
      status: enhancedStatus,
      scheduledStartTime: schedule.startTime,
      scheduledEndTime: schedule.endTime, 
      isScheduled: true,
      isEarlyArrival,
      isLateArrival,
      isEarlyDeparture,
      isLateDeparture
    };
  });

  const getStatusIcon = (status: any): React.ReactNode => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'work-from-home': return <Home className="w-4 h-4 text-blue-500" />;
      case 'half-day': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'not-logged': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: any): string => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'work-from-home': return 'bg-blue-100 text-blue-800';
      case 'half-day': return 'bg-orange-100 text-orange-800';
      case 'not-logged': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFullName = (employee: Employee): string => {
    if (!employee.userId) return 'Unknown';
    return `${employee.userId.firstName || ''} ${employee.userId.lastName || ''}`.trim() || 'Unknown';
  };

  const filteredData: Employee[] = enhancedAttendanceData.filter(employee => {
    const fullName = getFullName(employee);
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getAttendanceStats = (): AttendanceStats => {
    // Recalculate stats based on enhanced data
    const total = enhancedAttendanceData.length;
    const present = enhancedAttendanceData.filter(emp => emp.status === 'present').length;
    const absent = enhancedAttendanceData.filter(emp => emp.status === 'absent').length;
    const late = enhancedAttendanceData.filter(emp => emp.status === 'late').length;
    const wfh = enhancedAttendanceData.filter(emp => emp.status === 'work-from-home').length;
    const halfDay = enhancedAttendanceData.filter(emp => emp.status === 'half-day').length;
    
    return { total, present, absent, late, wfh, halfDay };
  };

  const stats: AttendanceStats = getAttendanceStats();

  const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon, bgcolor }) => (
    <div className={`p-6 rounded-lg shadow-lg border border-gray-100 ${bgcolor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-white">{title}</p>
          <p className="text-4xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const getEmployeeInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatStatus = (status: any): string => {
    switch (status) {
      case 'work-from-home': return 'Work from Home';
      case 'half-day': return 'Half Day';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const DailyTableView: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Employee Attendance Details</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing attendance with roster-based calculations for {selectedDate} (Employee Timezone)
            </p>
          </div>
          {(isLoading || rosterLoading) && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-6 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">
              Error loading attendance data: {(error as any)?.message || 'Something went wrong'}
            </span>
            <button 
              onClick={() => refetch()}
              className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual In/Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(isLoading || rosterLoading) ? (
              // Loading skeleton rows
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-gray-300" />
                    <span>No attendance records found for {selectedDate}</span>
                    {searchTerm && <span className="text-sm">Try adjusting your search filters</span>}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                          {getEmployeeInitials(getFullName(employee))}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{getFullName(employee)}</div>
                        {employee.userId?.email && (
                          <div className="text-sm text-gray-500">{employee.userId.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                      {getStatusIcon(employee.status)}
                      <span className="ml-1">{formatStatus(employee.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        {employee.scheduledStartTime !== '--' ? (
                          <span>{employee.scheduledStartTime} - {employee.scheduledEndTime}</span>
                        ) : (
                          <span className="text-gray-500 italic">No roster schedule</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className={employee.isLateArrival ? 'text-red-600' : employee.isEarlyArrival ? 'text-green-600' : ''}>
                        In: {formatTimeInTimezone(employee.clockIn, employee.workingTimezone)}
                      </span>
                      <span className={employee.isEarlyDeparture ? 'text-red-600' : employee.isLateDeparture ? 'text-green-600' : ''}>
                        Out: {formatTimeInTimezone(employee.clockOut, employee.workingTimezone)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.totalHours ? `${employee.totalHours}h` : '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* {employee.workingTimezone} */}
                    <Eye size={18} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleViewChange = (view: ViewType): void => {
    setSelectedView(view);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedDate(event.target.value);
  };

  const handleExport = (): void => {
    if (selectedView === 'monthly') {
      // Let the monthly component handle its own export
      return;
    }

    if (!enhancedAttendanceData.length) {
      alert('No data to export');
      return;
    }

    // Create CSV content with timezone information
    const headers = [
      'Employee Name', 
      'Email', 
      'Status', 
      'Scheduled Start', 
      'Scheduled End', 
      'Actual Check In', 
      'Actual Check Out', 
      'Hours', 
      'Has Roster Schedule',
      'Attendance Variance',
      'Working Timezone',
      'Date'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(emp => {
        const varianceNotes = [
          emp.isEarlyArrival ? 'Early Arrival' : '',
          emp.isLateArrival ? 'Late Arrival' : '',
          emp.isEarlyDeparture ? 'Early Departure' : '',
          emp.isLateDeparture ? 'Overtime' : '',
          !emp.isScheduled ? 'No Roster Schedule' : ''
        ].filter(Boolean).join('; ');
        
        return [
          `"${getFullName(emp)}"`,
          `"${emp.userId?.email || '--'}"`,
          `"${formatStatus(emp.status)}"`,
          `"${emp.scheduledStartTime}"`,
          `"${emp.scheduledEndTime}"`,
          `"${formatTimeInTimezone(emp.clockIn, emp.workingTimezone)}"`,
          `"${formatTimeInTimezone(emp.clockOut, emp.workingTimezone)}"`,
          `"${emp.totalHours || 0}"`,
          `"${emp.isScheduled ? 'Yes' : 'No'}"`,
          `"${varianceNotes || 'On Time'}"`,
          `"${emp.workingTimezone}"`,
          `"${formatDateInTimezone(emp.date, emp.workingTimezone)}"`
        ].join(',');
      })
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-timezone-analysis-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance with timezone support</p>
        </div>

        {/* View Tabs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView('daily')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedView === 'daily' 
                    ? 'bg-[#129990] text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setSelectedView('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedView === 'monthly' 
                    ? 'bg-[#129990] text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly View
              </button>
            </div>

            {/* Controls - Only show for daily view since monthly has its own controls */}
            {selectedView === 'daily' && (
              <div className="flex flex-wrap gap-4 items-center">
                {/* Date Picker */}
                <div className="flex items-center gap-2 w-[200px]">
                  <Calendar className="absolute left-3 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-[200px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Search */}
                <div className="relative w-[300px] flex items-center">
                  <Search className="absolute left-3 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-[300px] border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Export Button */}
                <button 
                  onClick={handleExport}
                  disabled={isLoading || rosterLoading || !enhancedAttendanceData.length}
                  className="bg-[#129990] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#1dbfb4] transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export Daily
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Only show for daily view */}
        {selectedView === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Employees"
              value={stats.total}
              color="bg-[#fff] shadow-lg"
              bgcolor="bg-[#4fd1c5] shadow-lg"
              icon={<Users className="w-6 h-6 text-[#000]" />}
            />
            <StatCard
              title="Present"
              value={stats.present}
              color="bg-[#fff]" 
              bgcolor="bg-[#007170]"
              icon={<CheckCircle className="w-6 h-6 text-[#000]" />}
            />
            <StatCard
              title="Absent"
              value={stats.absent}
              color="bg-[#fff]"
              bgcolor="bg-[#34bebd]"
              icon={<XCircle className="w-6 h-6 text-[#000]" />}
            />
            <StatCard
              title="Late/WFH"
              value={stats.late + stats.wfh}
              color="bg-[#fff]"
              bgcolor="bg-[#202c74] shadow-lg"
              icon={<AlertCircle className="w-6 h-6 text-[#000]" />}
            />
          </div>
        )}

        {/* Content */}
        {selectedView === 'daily' ? (
          <DailyTableView />
        ) : (
          <AttendanceMonthlyView 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            employeesData={employeeData}
            // rosterData={rosterData}
            attendanceData={attendanceData}
            isLoading={isLoading || rosterLoading || employeesLoading}
            formatTimeInTimezone={formatTimeInTimezone}
          />
        )}
      </div>
    </div>
  );
};

export default Attendance;