import React, { useState, useMemo } from 'react';
import { useGetRosterForallEmployeeQuery } from '../../../services/rosterServices';
import { useGetAttendanceForallEmployeeQuery } from '../../../services/AttendanceRedxService';
import { ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';

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
  };
  employeeId: string;
  workingTimezone: string;
}

interface RosterEmployee {
  employee: {
    salary: {
      amount: number;
      currency: string;
      paymentFrequency: string;
    };
    _id: string;
    userId: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    employeeId: string;
    joiningDate: string;
    workingTimezone: string;
    issetrosterauto: boolean;
    deductionDetails: string[];
  };
  week_start_date: string;
  week_end_date: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  roster: {
    [date: string]: {
      start_time: string;
      end_time: string;
    };
  };
}

interface MonthlyAttendanceData {
  employeeId: string;
  employeeName: string;
  title: string;
  monthlyData: {
    [date: string]: {
      startTime: string;
      endTime: string;
      totalHours: number;
      status: any;
    };
  };
  monthlyTotal: number;
}

interface AttendanceMonthlyViewProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  employeesData: Employee[];
  attendanceData?: any[];
  isLoading?: boolean;
  formatTimeInTimezone:any;
}

const AttendanceMonthlyView: React.FC<AttendanceMonthlyViewProps> = ({
  selectedMonth,
  onMonthChange,
  employeesData,
  attendanceData = [],
  isLoading = false,
  formatTimeInTimezone
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  // Get start and end dates for the selected month
  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
  const endDate = new Date(`${year}-${String(month).padStart(2, "0")}-31`);  
  const { 
    data: rosterResponse,
    isLoading: rosterLoading 
  } = useGetRosterForallEmployeeQuery({
    employeeId: 'all',
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  });
  const { 
    data: attendanceResponse,
    isLoading: attendanceLoading 
  } = useGetAttendanceForallEmployeeQuery({
    employeeId: 'all',
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  });

  // Get unique departments from employees data
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employeesData.forEach(emp => {
      if (emp.userId?.department?.name) {
        deptSet.add(emp.userId.department.name);
      }
    });
    return Array.from(deptSet).sort();
  }, [employeesData]);

  // Filter employees based on selected department
  const filteredEmployeesData = useMemo(() => {
    if (selectedDepartment === 'all') {
      return employeesData;
    }
    return employeesData.filter(emp => 
      emp.userId?.department?.name === selectedDepartment
    );
  }, [employeesData, selectedDepartment]);

  // Generate days of the month
  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    });
  };

  const daysInMonth = getDaysInMonth(selectedMonth);

  // Helper function to check if employee is scheduled for a specific date
  const getEmployeeRosterForDate = (employeeId: string, date: string): { start_time: string; end_time: string } | null => {
    if (!rosterResponse?.data) return null;
    
    const employeeRoster = rosterResponse.data.find((emp: RosterEmployee) => 
      emp.employee._id === employeeId
    );
    
    if (!employeeRoster) return null;
    
    const [year, month, day] = date.split("-");
    const formatteddate = `${day}/${month}/${year}`;
    // Check if the date exists in roster and is scheduled
    const rosterForDate = employeeRoster.roster[formatteddate];
    // console.log(`Roster for employee ${employeeId} on ${date}:`, rosterForDate);
    if (rosterForDate && 
        rosterForDate.start_time !== 'OFF' && 
        rosterForDate.start_time !== '-' && 
        rosterForDate.start_time !== '') {
      return rosterForDate;
    }
    
    return null;
  };

  const generateMonthlyData = (): MonthlyAttendanceData[] => {
    // console.log('attendanceResponse:', attendanceResponse);
    return filteredEmployeesData.map((emp, empIndex) => {
      
      const mockData: { [date: string]: any } = {};
      let monthlyTotal = 0;
      const attendanceFilterData = attendanceResponse?.data?.find(
        (atten: any) => atten?.userId?.employeeId === emp._id
      );
      // console.log(`daysInMonth===>`, daysInMonth);
      daysInMonth.forEach((date, dayIndex) => {
        const rosterSchedule = getEmployeeRosterForDate(emp._id, date);
        //  console.log('Processing rosterSchedule:', date);
        const formattedDate = date.split('-').reverse().join('/');
        const dayAttendance = attendanceFilterData?.attendance?.[formattedDate] || null;
        // console.log(`Attendance for employee ${emp._id} on ${formattedDate}:`, dayAttendance);
        if (dayAttendance) {
          mockData[date] = {
            startTime: formatTimeInTimezone(dayAttendance?.clockIn,attendanceFilterData?.userId?.workingTimezone) || '-',
            endTime: formatTimeInTimezone(dayAttendance?.clockOut,attendanceFilterData?.userId?.workingTimezone) || '-',  
            totalHours: (dayAttendance?.totalHours !== 0) ? dayAttendance?.totalHours : "-",
            status: (dayAttendance?.status==="leave")? dayAttendance?.notes : dayAttendance?.status || '-'
          };
          monthlyTotal += dayAttendance?.totalHours || 0;
        }else{
          if (rosterSchedule && rosterSchedule.start_time === 'OFF' && rosterSchedule.end_time === 'OFF') {
            mockData[date] = {
              startTime: 'OFF',
              endTime: 'OFF',
              totalHours: 0,
              status: 'off'
            };
          }else{
             mockData[date] = {
              startTime: '-',
              endTime: '-',
              totalHours: '-',
              status: '-'
            };
          }
        }
        
      });

      // Get employee title from roster data or fallback to mock titles
      const rosterEmployee = rosterResponse?.data?.find((rEmp: RosterEmployee) => 
        rEmp.employee._id === emp._id
      );

      return {
        employeeId: emp._id,
        employeeName: `${emp.userId?.firstName || 'Unknown'} ${emp.userId?.lastName || ''}`.trim() || 'Unknown Employee',
        title: emp.userId?.role?.display_name || 
               emp.userId?.department?.name || 'Employee',
        monthlyData: mockData,
        monthlyTotal: parseFloat(monthlyTotal.toFixed(2))
      };
    });
  };
  const monthlyData = generateMonthlyData();
  
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    onMonthChange(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    onMonthChange(`${nextYear}-${nextMonth.toString().padStart(2, '0')}`);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const handleExport = () => {
    const headers = ['Employee', 'Title', 'Month', ...daysInMonth.map(date => {
      const day = new Date(date).getDate().toString().padStart(2, '0');
      return day;
    }), 'Monthly Total'];
    
    const csvContent = [
      headers.join(','),
      ...monthlyData.map(emp => [
        `"${emp.employeeName}"`,
        `"${emp.title}"`,
        `"${selectedMonth.split('-')[1]}"`,
        ...daysInMonth.map(date => {
          const dayData = emp.monthlyData[date];
          if (dayData.status === 'W/O' || dayData.status === 'off') {
            return `"${dayData.status}"`;
          } else if (!dayData.startTime || dayData.startTime === '-') {
            return '"-"';
          } else {
            return `"${dayData.startTime}-${dayData.endTime} (${dayData.totalHours}h)"`;
          }
        }),
        `"${emp.monthlyTotal}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-attendance-${selectedMonth}${selectedDepartment !== 'all' ? `-${selectedDepartment}` : ''}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || rosterLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading monthly data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Monthly Attendance Report</h3>
            <p className="text-sm text-gray-500 mt-1">
              Employee attendance summary with roster-based scheduling
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h4 className="text-lg font-medium min-w-[160px] text-center">
              {getMonthName(selectedMonth)}
            </h4>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="bg-[#129990] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1dbfb4] transition-colors ml-4"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <tbody>
            {/* Process employees in groups of 3 */}
            {Array.from({ length: Math.ceil(monthlyData.length / 3) }, (_, groupIndex) => {
              const employeeGroup = monthlyData.slice(groupIndex * 3, (groupIndex * 3) + 3);
              
              return (
                <React.Fragment key={`group-${groupIndex}`}>
                  {/* Employee Header Row */}
                  <tr className="bg-gray-100">
                    {employeeGroup.map((employee) => (
                      <td key={`header-${employee.employeeId}`} colSpan={5} className="px-3 py-2 text-center font-semibold text-gray-800 border border-gray-300">
                        Employee: {employee.employeeName}
                      </td>
                    ))}
                    {employeeGroup.length < 3 && Array.from({ length: (3 - employeeGroup.length) * 4 }, (_, i) => (
                      <td key={`empty-header-${i}`} className="border border-gray-300"></td>
                    ))}
                  </tr>
                  
                  {/* Title Row */}
                  <tr className="bg-gray-50">
                    {employeeGroup.map((employee) => (
                      <td key={`title-${employee.employeeId}`} colSpan={5} className="px-3 py-1 text-center font-medium text-gray-700 border border-gray-300">
                        Title: {employee.title}
                      </td>
                    ))}
                    {employeeGroup.length < 3 && Array.from({ length: (3 - employeeGroup.length) * 4 }, (_, i) => (
                      <td key={`empty-title-${i}`} className="border border-gray-300"></td>
                    ))}
                  </tr>
                  
                  {/* Month Row */}
                  <tr className="bg-gray-50">
                    {employeeGroup.map((employee) => (
                      <td key={`month-${employee.employeeId}`} colSpan={5} className="px-3 py-1 text-center font-medium text-gray-700 border border-gray-300">
                        Month: {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' })}
                      </td>
                    ))}
                    {employeeGroup.length < 3 && Array.from({ length: (3 - employeeGroup.length) * 4 }, (_, i) => (
                      <td key={`empty-month-${i}`} className="border border-gray-300"></td>
                    ))}
                  </tr>

                  {/* Column Headers */}
                  <tr className="bg-blue-50">
                    {employeeGroup.map((employee, empIdx) => (
                      <React.Fragment key={`headers-${employee.employeeId}`}>
                        <th className="px-3 py-2 text-center font-semibold text-gray-800 border border-gray-300 min-w-[80px]">
                          {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short' })}
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-800 border border-gray-300 min-w-[80px]">
                          Start Time
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-800 border border-gray-300 min-w-[80px]">
                          End Time
                        </th>
                        <th className={`px-3 py-2 text-center font-semibold text-gray-800 border border-gray-300 min-w-[100px] `}>
                          Total Work Hours
                        </th>
                        <th className={`px-3 py-2 text-center font-semibold text-gray-800 border border-gray-300 min-w-[100px] ${empIdx < employeeGroup.length - 1 ? 'border-r-4 border-r-gray-400' : ''}`}>
                          Status
                        </th>
                      </React.Fragment>
                    ))}
                    {employeeGroup.length < 3 && Array.from({ length: (3 - employeeGroup.length) * 4 }, (_, i) => (
                      <th key={`empty-header-col-${i}`} className="border border-gray-300"></th>
                    ))}
                  </tr>

                  {/* Data Rows */}
                  {daysInMonth.map((date) => {
                    const day = new Date(date).getDate().toString().padStart(2, '0');
                    const formattedDate = `${day}-${selectedMonth.split('-')[1]}-${selectedMonth.split('-')[0]}`;
                    // console.log('Rendering date row for:', employeeGroup);
                    return (
                      <tr key={`${groupIndex}-${date}`} className="hover:bg-gray-50">
                        {employeeGroup.map((employee, empIdx) => {
                          const dayData = employee.monthlyData[date];
                          return (
                            <React.Fragment key={`${employee.employeeId}-${date}`}>
                              <td className="px-3 py-2 text-center border border-gray-300 font-medium">
                                {formattedDate}
                              </td>
                              <td className="px-3 py-2 text-center border border-gray-300">
                                {dayData.status === 'W/O' ? (
                                  <span className="text-blue-600 font-semibold">W/O</span>
                                ) : dayData.status === 'off' ? (
                                  <span className="text-red-600 font-semibold">OFF</span>
                                ) : dayData.startTime && dayData.startTime !== '-' ? (
                                  <span className="text-gray-800">{dayData.startTime}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center border border-gray-300">
                                {dayData.status === 'W/O' ? (
                                  <span className="text-blue-600 font-semibold">W/O</span>
                                ) : dayData.status === 'off' ? (
                                  <span className="text-red-600 font-semibold">OFF</span>
                                ) : dayData.endTime && dayData.endTime !== '-' ? (
                                  <span className="text-gray-800">{dayData.endTime}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className={`px-3 py-2 text-center border border-gray-300 `}>
                                {dayData.status === 'W/O' || dayData.status === 'off' || dayData.totalHours === 0 ? (
                                  <span className="text-blue-600 font-semibold">{dayData.totalHours}</span>
                                ) : (
                                  <span className="text-gray-800 font-medium">{dayData.totalHours}</span>
                                )}
                              </td>
                              <td className={`px-3 py-2 text-center border border-gray-300 ${empIdx < employeeGroup.length - 1 ? 'border-r-4 border-r-gray-400' : ''}`}>
                                {dayData.status}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        {employeeGroup.length < 3 && Array.from({ length: (3 - employeeGroup.length) * 4 }, (_, i) => (
                          <td key={`empty-data-${i}`} className="border border-gray-300"></td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Monthly Total Row */}
                  <tr className="bg-blue-100 font-bold">
                    {employeeGroup.map((employee, empIdx) => (
                      <React.Fragment key={`total-${employee.employeeId}`}>
                        <td className="px-3 py-3 text-center border border-gray-300 font-bold text-gray-900">
                          MONTHLY TOTAL
                        </td>
                        <td className="px-3 py-3 text-center border border-gray-300 bg-blue-50">
                          -
                        </td>
                        <td className="px-3 py-3 text-center border border-gray-300 bg-blue-50">
                          -
                        </td>
                        <td className="px-3 py-3 text-center border border-gray-300 bg-blue-50">
                          {employee.monthlyTotal.toFixed(2)}
                        </td>
                        <td className={`px-3 py-3 text-center border border-gray-300 bg-blue-50 font-bold text-blue-700 text-sm ${empIdx < employeeGroup.length - 1 ? 'border-r-4 border-r-gray-400' : ''}`}>
                          -
                        </td>
                        
                      </React.Fragment>
                    ))}
                    {employeeGroup.length < 3 && Array.from({ length: (3 - employeeGroup.length) * 4 }, (_, i) => (
                      <td key={`empty-total-${i}`} className="border border-gray-300 bg-blue-50"></td>
                    ))}
                  </tr>

                  {/* Spacer Row between groups */}
                  {groupIndex < Math.ceil(monthlyData.length / 3) - 1 && (
                    <tr>
                      <td colSpan={15} className="py-4 bg-gray-100"></td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {monthlyData.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <span>No attendance data found for {getMonthName(selectedMonth)}</span>
            {selectedDepartment !== 'all' && (
              <span className="text-sm">in department: {selectedDepartment}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMonthlyView;