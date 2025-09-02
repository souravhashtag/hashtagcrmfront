import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Filter, Search, Download, ChevronDown, CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react';
import { useGetAttendanceByDateQuery } from '../../../services/AttendanceRedxService'; // Import your RTK Query hook

// Type definitions
interface Employee {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'work-from-home';
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  location?: string;
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

type ViewType = 'table';
type StatusType = 'present' | 'absent' | 'late' | 'work-from-home' | 'half-day';

// Helper function to get current date in PST
const getCurrentPSTDate = (): string => {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

  // Format to YYYY-MM-DD in Pacific Time
  const year = pstDate.getFullYear();
  const month = String(pstDate.getMonth() + 1).padStart(2, '0');
  const day = String(pstDate.getDate()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  // console.log("Pacific Time Date (YYYY-MM-DD):", formattedDate);
  return formattedDate;
};

// Helper function to convert date to PST format for display
const formatDateToPST = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper function to convert time to PST
const formatTimeToPST = (timeString?: string): string => {
  if (!timeString) return '--';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      timeZone: 'America/Los_Angeles',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return timeString;
  }
};

// Helper function to convert date input to PST date string
const convertToPSTDateString = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const pstDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pstDate.toISOString().split('T')[0];
};

const Attendance: React.FC = () => {
  const [selectedView, setSelectedView] = useState<ViewType>('table');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentPSTDate());

  // RTK Query hook to fetch attendance data
  const { 
    data: attendanceResponse, 
    error, 
    isLoading, 
    refetch 
  } = useGetAttendanceByDateQuery(selectedDate);

  // Extract attendance data from API response
  // console.log('Attendance Response:', attendanceResponse);
  const attendanceData: Employee[] = attendanceResponse?.data?.attendance || [];
  const apiSummary = attendanceResponse?.data?.summary || {};

  const getStatusIcon = (status: StatusType): React.ReactNode => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'work-from-home': return <Home className="w-4 h-4 text-blue-500" />;
      case 'half-day': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'work-from-home': return 'bg-blue-100 text-blue-800';
      case 'half-day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFullName = (employee: Employee): string => {
    if (!employee.userId) return 'Unknown';
    return `${employee.userId.firstName || ''} ${employee.userId.lastName || ''}`.trim() || 'Unknown';
  };

  const filteredData: Employee[] = attendanceData.filter(employee => {
    const fullName = getFullName(employee);
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getAttendanceStats = (): AttendanceStats => {
    // Use API summary if available, otherwise calculate from filtered data
    if (apiSummary.totalRecords !== undefined) {
      return {
        total: apiSummary.totalRecords || 0,
        present: apiSummary.statusBreakdown?.present || 0,
        absent: apiSummary.statusBreakdown?.absent || 0,
        late: apiSummary.statusBreakdown?.late || 0,
        wfh: apiSummary.statusBreakdown?.['work-from-home'] || 0,
        halfDay: apiSummary.statusBreakdown?.['half-day'] || 0,
      };
    }

    // Fallback to manual calculation
    const total = attendanceData.length;
    const present = attendanceData.filter(emp => emp.status === 'present').length;
    const absent = attendanceData.filter(emp => emp.status === 'absent').length;
    const late = attendanceData.filter(emp => emp.status === 'late').length;
    const wfh = attendanceData.filter(emp => emp.status === 'work-from-home').length;
    const halfDay = attendanceData.filter(emp => emp.status === 'half-day').length;
    
    return { total, present, absent, late, wfh, halfDay };
  };

  const stats: AttendanceStats = getAttendanceStats();

  const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon,bgcolor }) => (
    <div className={`bg-white p-6 rounded-lg shadow-lg border border-gray-100 ${bgcolor}`}>
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

  const formatStatus = (status: StatusType): string => {
    switch (status) {
      case 'work-from-home': return 'Work from Home';
      case 'half-day': return 'Half Day';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const TableView: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Employee Attendance Details</h3>
            {/* <p className="text-sm text-gray-500 mt-1">
              Showing data for {formatDateToPST(selectedDate)} (PST)
            </p> */}
          </div>
          {isLoading && (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-[#fff] uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#fff] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#fff] uppercase tracking-wider">Check In (PST)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#fff] uppercase tracking-wider">Check Out (PST)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#fff] uppercase tracking-wider">Hours</th>
              {/* {attendanceData.some(emp => emp.location) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-[#fff] uppercase tracking-wider">Location</th>
              )} */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
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
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-4"></div></td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={attendanceData.some(emp => emp.location) ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-gray-300" />
                    <span>No attendance records found for {formatDateToPST(selectedDate)} (PST)</span>
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
                    {formatTimeToPST(employee.clockIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimeToPST(employee.clockOut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.totalHours ? `${employee.totalHours}h` : '--'}
                  </td>
                  {/* {attendanceData.some(emp => emp.location) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {JSON.parse(employee?.location||"").city}
                    </td>
                  )} */}
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
    if (!attendanceData.length) {
      alert('No data to export');
      return;
    }

    // Create CSV content with PST timestamps
    const headers = ['Employee Name', 'Email', 'Status', 'Check In (PST)', 'Check Out (PST)', 'Hours', 'Location', 'Date (PST)'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(emp => [
        `"${getFullName(emp)}"`,
        `"${emp.userId?.email || '--'}"`,
        `"${formatStatus(emp.status)}"`,
        `"${formatTimeToPST(emp.clockIn)}"`,
        `"${formatTimeToPST(emp.clockOut)}"`,
        `"${emp.totalHours || 0}"`,
        `"${emp.location || '--'}"`,
        `"${formatDateToPST(emp.date)}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${selectedDate}-PST.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 ">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance efficiently (PST)</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Employees"
            value={stats.total}
            color="bg-[#fff] shadow-lg"
            bgcolor="bg-[#4fd1c5] shadow-lg"
            icon={<Users className="w-6 h-6 text-[#000]"
              />}
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

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-end">
            <div className="flex flex-wrap gap-4 items-center">
              {/* View Toggle */}
              

              {/* Date Picker */}
              <div className="flex items-center gap-2 w-[500px]">
                <Calendar className="absolute left-3 h-4 text-gray-400  " />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-[500px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
          
              </div>

              {/* Search */}
              <div className="relative w-[500px] flex items-center">
                <Search className="absolute left-3 h-4 text-gray-400  " />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-[500px] border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Export Button */}
            <button 
              onClick={handleExport}
              disabled={isLoading || !attendanceData.length}
              className="bg-[#129990] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#1dbfb4] transition-colors "
            >
              <Download className="w-4 h-4" />
              Export (PST)
            </button>
          </div>
        </div>

        {/* Content */}
        {selectedView === 'table' ? <TableView /> : ""}
      </div>
    </div>
  );
};

export default Attendance;