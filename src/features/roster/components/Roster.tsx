import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Edit,
  Check,
  X,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";
import {
  useGetWeekRosterQuery,
  useCreateRosterMutation,
  useBulkCreateRosterMutation,
  useUpdateRosterMutation,
  useDeleteRosterMutation,
  useCopyRosterFromPreviousWeekMutation,
  useGetRosterStatsQuery,
} from "../../../services/rosterServices";
import { useGetEmployeesQuery } from "../../../services/employeeServices";

const TimePicker: React.FC<any> = ({
  value,
  onChange,
  onClose,
  isMultipleEdit = false,
  selectedCount = 0,
  dayName = "",
  ShowMultipleEditModal = (show: boolean) => {},
  selectedDate = null, 
}) => {
  const [isOff, setIsOff] = useState(value === "OFF");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endPeriod, setEndPeriod] = useState("PM");
  const [fullWeek, setFullWeek] = useState(false);

  useEffect(() => {
    if (value && value !== "OFF") {
      const timeMatch = value.match(/(\d{1,2})([ap]m)-(\d{1,2})([ap]m)/i);
      if (timeMatch) {
        const [, startHour, startPer, endHour, endPer] = timeMatch;
        setStartTime(`${startHour.padStart(2, "0")}:00`);
        setEndTime(`${endHour.padStart(2, "0")}:00`);
        setStartPeriod(startPer.toUpperCase());
        setEndPeriod(endPer.toUpperCase());
        setIsOff(false);
      }
    }
  }, [value]);

  const formatTimeToBackend = () => {
    if (isOff) return { start_time: "OFF", end_time: "OFF" };
    // console.log("startTime===>", startTime);
    let start24 = parseInt(startTime.split(":")[0]);
    let end24 = parseInt(endTime.split(":")[0]);

    if (startPeriod === "PM" && start24 !== 12) start24 += 12;
    if (startPeriod === "AM" && start24 === 12) start24 = 0;
    if (endPeriod === "PM" && end24 !== 12) end24 += 12;
    if (endPeriod === "AM" && end24 === 12) end24 = 0;

    // const today = new Date();
    // const startDate = new Date(today);
    // const endDate = new Date(today);

    // if (end24 < start24) {
    //   endDate.setDate(endDate.getDate() + 1);
    // }

    // const formatDate = (date: Date) => {
    //   const day = String(date.getDate()).padStart(2, "0");
    //   const month = String(date.getMonth() + 1).padStart(2, "0");
    //   const year = date.getFullYear();
    //   return `${day}-${month}-${year}`;
    // };
    const getDateForDay = (dayName: string, selectedWeekDate: Date | null) => {
    const dayMap: any = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
      thursday: 4, friday: 5, saturday: 6
    };
    
    const baseDate = selectedWeekDate || new Date();
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - baseDate.getDay());
    
    const targetDate = new Date(sunday);
    targetDate.setDate(sunday.getDate() + dayMap[dayName.toLowerCase()]);
    
    return targetDate;
  };

  const actualDate = getDateForDay(dayName, selectedDate);
  const startDate = new Date(actualDate);
  const endDate = new Date(actualDate);

  if (end24 < start24) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
    const startDateTime = `${formatDate(startDate)} ${String(start24).padStart(
      2,
      "0"
    )}:00`;
    const endDateTime = `${formatDate(endDate)} ${String(end24).padStart(
      2,
      "0"
    )}:00`;
    // console.log("startDateTime===>", startDateTime);
    if (fullWeek) {
      return {
        sunday: { start_time: startDateTime, end_time: endDateTime },
        monday: { start_time: startDateTime, end_time: endDateTime },
        tuesday: { start_time: startDateTime, end_time: endDateTime },
        wednesday: { start_time: startDateTime, end_time: endDateTime },
        thursday: { start_time: startDateTime, end_time: endDateTime },
        friday: { start_time: startDateTime, end_time: endDateTime },
        saturday: { start_time: "OFF", end_time: "OFF" },
      };
    }

    return {
      start_time: startDateTime,
      end_time: endDateTime,
    };
  };

  const formatTime = () => {
    if (isOff) return "OFF";

    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);

    const formatHour = (hour: number, period: string) => {
      if (period === "AM" && hour === 12) return "12";
      if (period === "PM" && hour === 12) return "12";
      if (period === "PM" && hour < 12) return hour.toString();
      return hour.toString();
    };

    return `${formatHour(
      startHour,
      startPeriod
    )}${startPeriod.toLowerCase()}-${formatHour(
      endHour,
      endPeriod
    )}${endPeriod.toLowerCase()}`;
  };

  const handleSave = () => {
    // console.log("Saving time:", formatTimeToBackend());
    onChange(formatTimeToBackend());
    onClose();
    ShowMultipleEditModal(true);
  };

  const generateHours = () => {
    const hours = [];
    for (let i = 1; i <= 12; i++) {
      hours.push(`${i.toString().padStart(2, "0")}:00`);
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
            {isMultipleEdit
              ? `Set ${dayName} Schedule for ${selectedCount} Employees`
              : "Set Schedule Time"}
          </h3>
          <button
            onClick={() => {
              onClose();
              ShowMultipleEditModal(true);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {isMultipleEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                You are editing the <strong>{dayName}</strong> schedule for{" "}
                <strong>{selectedCount}</strong> selected employees. This will
                overwrite their current schedule for this day.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* <input
              type="checkbox"
              id="full-week"
              checked={fullWeek}
              onChange={(e) => setFullWeek(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="full-week"
              className="text-sm font-medium text-gray-700"
            >
              Apply to Full Week (Excluding Saturday)
            </label> */}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="off-day"
              checked={isOff}
              onChange={(e) => setIsOff(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label
              htmlFor="off-day"
              className="text-sm font-medium text-gray-700"
            >
              Day Off
            </label>
          </div>

          {!isOff && (
            <>
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
                    {hours.map((hour) => (
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
                    {hours.map((hour) => (
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
            onClick={() => {
              onClose();
              ShowMultipleEditModal(true);
            }}
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

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Date picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Table state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Edit state
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null
  );
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDay, setTimePickerDay] = useState<string | null>(null);
  const [timePickerValue, setTimePickerValue] = useState("");

  // Multiple edit state
  const [showMultipleEditModal, setShowMultipleEditModal] = useState(false);
  const [multipleEditDay, setMultipleEditDay] = useState<string | null>(null);

  // Loading states
  const [isCreatingRoster, setIsCreatingRoster] = useState(false);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const [multipleEditSetDays, setMultipleEditSetDays] = useState<Set<string>>(new Set());
  // Get current week info
  const getCurrentWeekInfo = () => {
    const baseDate = selectedDate || new Date();
    // console.log("selectedDate",baseDate)
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - baseDate.getDay());

    const year = sunday.getFullYear();
    const weekNumber = Math.ceil(
      ((sunday.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    )+1;
    // console.log("Current Week Info:", { year, weekNumber });
    return { year, weekNumber };
  };
  
  const { year, weekNumber } = getCurrentWeekInfo();

  // RTK Query hooks
  const {
    data: weekRosterData,
    isLoading: isLoadingRoster,
    error: rosterError,
    refetch: refetchRoster,
  } = useGetWeekRosterQuery({ year, weekNumber });
  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployeesQuery({ page: 1, limit: 100 });

  const { data: rosterStats } = useGetRosterStatsQuery({ year, weekNumber });

  const [createRoster] = useCreateRosterMutation();
  const [bulkCreateRoster] = useBulkCreateRosterMutation();
  const [updateRoster] = useUpdateRosterMutation();
  const [deleteRoster] = useDeleteRosterMutation();
  const [copyFromPreviousWeek] = useCopyRosterFromPreviousWeekMutation();

  // Get all employees and merge with roster data
  const allEmployees = employeesData?.data?.data || employeesData?.data || [];
  const rosterEmployees = weekRosterData?.data || [];
  // console.log("Roster Employees:", rosterEmployees);
  // Create a map of roster data by employee ID
  const rosterMap = rosterEmployees.reduce((acc: any, roster: any) => {
    acc[roster.employee._id] = roster;
    return acc;
  }, {});

  // Merge employees with their roster data (if exists)
  const employeesWithRoster = allEmployees.map((employee: any) => {
    const rosterData = rosterMap[employee._id];

    if (rosterData) {
      // Employee has roster data
      return {
        _id: rosterData._id, // roster ID
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId || "N/A",
          name:
            employee.userId?.firstName + " " + employee.userId?.lastName ||
            "Unknown",
          department: employee.userId?.department?.name || "Unknown",
          role: employee.userId?.role?.name || "Unknown",
        },
        schedule: rosterData.schedule,
        totalHours: rosterData.totalHours || 0,
        workingDays: rosterData.workingDays || 0,
        notes: rosterData.notes || "",
        hasRoster: true,
      };
    } else {
      // Employee doesn't have roster data - show empty schedule
      return {
        _id: `temp-${employee._id}`, // temporary ID for employees without roster
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId || "N/A",
          name:
            employee.userId?.firstName + " " + employee.userId?.lastName ||
            "Unknown",
          department: employee.userId?.department?.name || "Unknown",
          role: employee.userId?.role?.name || "Unknown",
        },
        schedule: {
          sunday: "-",
          monday: "-",
          tuesday: "-",
          wednesday: "-",
          thursday: "-",
          friday: "-",
          saturday: "-",
        },
        totalHours: 0,
        workingDays: 0,
        notes: "",
        hasRoster: false,
      };
    }
  });

  // Dynamic department options from employee data
  const getDepartmentOptions = () => {
    const departments = new Set(["All Departments"]);
    employeesWithRoster.forEach((employee: any) => {
      if (
        employee.employee.department &&
        employee.employee.department !== "Unknown"
      ) {
        departments.add(employee.employee.department);
      }
    });
    return Array.from(departments);
  };

  const options = getDepartmentOptions();

  // Filter employees based on search term and selected department
  const filteredEmployees = employeesWithRoster.filter((employee: any) => {
    const employeeName = String(employee?.employee?.name || "");
    const employeeDepartment = String(employee?.employee?.department || "");

    const matchesSearch = employeeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selected === "All Departments" || employeeDepartment === selected;
    return matchesSearch && matchesDepartment;
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper functions
  const getWeekDates = (sundayDate: Date | null) => {
    if (!sundayDate) {
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

  const formatHeaderDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });

    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${getOrdinal(day)} ${month}`;
  };

  // Edit functions
  const startEditing = (employee: any) => {
    setEditingEmployeeId(employee._id);
    setEditingSchedule({ ...employee.schedule });
  };

  const cancelEditing = () => {
    setEditingEmployeeId(null);
    setEditingSchedule(null);
  };

  const saveEditing = async () => {
    // console.log("Saving editing for employee:", editingSchedule);return false
    if (editingEmployeeId && editingSchedule) {
      try {
        const employee = employeesWithRoster.find(
          (emp: any) => emp._id === editingEmployeeId
        );

        // The schedule is already in the correct format from TimePicker
        // Just pass it directly without additional formatting
        const scheduleData: any = {};
        Object.keys(editingSchedule).forEach((day) => {
          // Check if it's already an object with start_time and end_time
          if (
            typeof editingSchedule[day] === "object" &&
            editingSchedule[day].start_time
          ) {
            scheduleData[day] = editingSchedule[day];
          } else if (editingSchedule[day] === "OFF") {
            scheduleData[day] = { start_time: "OFF", end_time: "OFF" };
          } else if (editingSchedule[day] === "-") {
            scheduleData[day] = { start_time: "-", end_time: "-" };
          } else {
            // This shouldn't happen if TimePicker is working correctly
            // scheduleData[day] = { start_time: "OFF", end_time: "OFF" };
          }
        });

        if (employee?.hasRoster) {
          // Update existing roster
          await updateRoster({
            id: editingEmployeeId,
            ...scheduleData,
            year,
            week_number: weekNumber,
          }).unwrap();
        } else {
          // Create new roster for employee
          const weekDates = getWeekDates(selectedDate);
          // console.log("Creating roster with data:", weekDates);return false
          await createRoster({
            employee_id: employee?.employee._id,
            year,
            week_number: weekNumber,
            week_start_date: weekDates[0].toISOString().split("T")[0],
            week_end_date: weekDates[6].toISOString().split("T")[0],
            ...scheduleData,
          }).unwrap();
        }

        setEditingEmployeeId(null);
        setEditingSchedule(null);
        refetchRoster();
      } catch (error) {
        console.error("Failed to save roster:", error);
        alert("Failed to save roster. Please try again.");
      }
    }
  };

  const updateScheduleField = (day: string, value: any) => {
    if (editingSchedule) {
      // Store the raw value object for backend
      setEditingSchedule((prev: any) =>
        prev ? { ...prev, [day]: value } : null
      );
    }
  };

  // Time picker functions
  const openTimePicker = (day: string, currentValue: string) => {
    setTimePickerDay(day);
    setTimePickerValue(currentValue);
    setShowTimePicker(true);
  };

  const closeTimePicker = () => {
    setShowTimePicker(false);
    setTimePickerDay(null);
    setTimePickerValue("");
  };

  const handleTimePickerSave = (newValue: any) => {
    // console.log("Saving time picker value:", timePickerDay);
    if (timePickerDay) {
      updateScheduleField(timePickerDay, newValue);
    }
    closeTimePicker();
  };

  // Multiple edit functions
  const getDayName = (day: string): string => {
    const dayNames: any = {
      sunday: "Sunday",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
    };
    return dayNames[day];
  };

  const openMultipleEditModal = (day: string) => {
    if (selectedRows.size === 0) {
      alert("Please select at least one employee to edit.");
      return;
    }
    // console.log("day===>",day)
    // if (!day) {
    //   setMultipleEditSetDays(new Set());
    // }
    setMultipleEditDay(day);
    setTimePickerValue("");
    setShowMultipleEditModal(true);
  };

  const closeMultipleEditModal = () => {
    setShowMultipleEditModal(false);
    setMultipleEditDay(null);
    setTimePickerValue("");
    // setMultipleEditSetDays(new Set());
  };

  const handleMultipleEditSave = async (newValue: any) => {
    console.log("Saving multiple edit for day:",  newValue);
    if (multipleEditDay && selectedRows.size > 0) {
      try {
        const updatePromises = Array.from(selectedRows).map(
          async (employeeRowId) => {
            const employee = employeesWithRoster.find(
              (emp: any) => emp._id === employeeRowId
            );
            const scheduleUpdate = { [multipleEditDay]: newValue };

            if (employee?.hasRoster) {
              // Update existing roster
              return updateRoster({
                id: employeeRowId,
                ...scheduleUpdate,
                year,
                week_number: weekNumber,
              }).unwrap();
            } else {
              // Create new roster for employee
              const weekDates = getWeekDates(selectedDate);
              return createRoster({
                employee_id: employee?.employee._id,
                year,
                week_number: weekNumber,
                week_start_date: weekDates[0].toISOString().split("T")[0],
                week_end_date: weekDates[6].toISOString().split("T")[0],
                sunday:
                  multipleEditDay === "sunday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
                monday:
                  multipleEditDay === "monday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
                tuesday:
                  multipleEditDay === "tuesday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
                wednesday:
                  multipleEditDay === "wednesday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
                thursday:
                  multipleEditDay === "thursday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
                friday:
                  multipleEditDay === "friday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
                saturday:
                  multipleEditDay === "saturday"
                    ? newValue
                    : { start_time: "-", end_time: "-" },
              }).unwrap();
            }
          }
        );

        await Promise.all(updatePromises);
        // setSelectedRows(new Set());
        setMultipleEditSetDays(prev => new Set(prev).add(multipleEditDay as string));
        console.log("multipleEditSetDays ===>", multipleEditSetDays);
        refetchRoster();
      } catch (error) {
        console.error("Failed to update multiple rosters:", error);
        alert("Failed to update rosters. Please try again.");
      }
    }
    // closeMultipleEditModal();
  };

  // Bulk operations
  // const handleCreateRosterForAllEmployees = async () => {
  //   if (!allEmployees || allEmployees.length === 0) {
  //     alert('No employees found to create roster for.');
  //     return;
  //   }

  //   const employeesWithoutRoster = employeesWithRoster.filter((emp: any) => !emp.hasRoster);

  //   if (employeesWithoutRoster.length === 0) {
  //     alert('All employees already have roster for this week.');
  //     return;
  //   }

  //   const employeeIds = employeesWithoutRoster.map((emp: any) => emp.employee._id);
  //   const { year, weekNumber } = getCurrentWeekInfo();
  //   const weekDates = getWeekDates(selectedDate);

  //   try {
  //     setIsCreatingRoster(true);
  //     await bulkCreateRoster({
  //       employees: employeeIds,
  //       year,
  //       week_number: weekNumber,
  //       week_start_date: weekDates[0].toISOString().split('T')[0],
  //       week_end_date: weekDates[6].toISOString().split('T')[0],
  //       defaultSchedule: {
  //         monday: { start_time: "09:00", end_time: "18:00" },
  //         tuesday: { start_time: "09:00", end_time: "18:00" },
  //         wednesday: { start_time: "09:00", end_time: "18:00" },
  //         thursday: { start_time: "09:00", end_time: "18:00" },
  //         friday: { start_time: "09:00", end_time: "18:00" },
  //         saturday: { start_time: "OFF", end_time: "OFF" },
  //         sunday: { start_time: "OFF", end_time: "OFF" }
  //       }
  //     }).unwrap();

  //     refetchRoster();
  //     alert(`Roster created successfully for ${employeeIds.length} employees!`);
  //   } catch (error) {
  //     console.error('Failed to create roster:', error);
  //     alert('Failed to create roster. Please try again.');
  //   } finally {
  //     setIsCreatingRoster(false);
  //   }
  // };

  const handleCopyFromPreviousWeek = async () => {
    try {
      await copyFromPreviousWeek({
        fromYear: weekNumber === 1 ? year - 1 : year,
        fromWeekNumber: weekNumber === 1 ? 52 : weekNumber - 1,
        toYear: year,
        toWeekNumber: weekNumber,
        employees: [], // Copy all employees
      }).unwrap();

      refetchRoster();
      alert("Roster copied from previous week successfully!");
    } catch (error) {
      console.error("Failed to copy roster:", error);
      alert("Failed to copy roster from previous week.");
    }
  };

  // Table functions
  const toggleRowSelection = (id: string) => {
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
      setSelectedRows(new Set(filteredEmployees.map((item: any) => item._id)));
    }
  };

  // Calendar functions
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const isSunday = (day: number | null): boolean => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay() === 0;
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

  const navigateMonth = (direction: "prev" | "next"): void => {
    if (direction === "prev") {
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
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const getNextSunday = (): Date => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday;
  };

  // Render Multiple Edit Day Selection Modal
  const renderMultipleEditDayModal = () => {
    const dayOptions = [
      { key: "sunday", label: "Sunday" },
      { key: "monday", label: "Monday" },
      { key: "tuesday", label: "Tuesday" },
      { key: "wednesday", label: "Wednesday" },
      { key: "thursday", label: "Thursday" },
      { key: "friday", label: "Friday" },
      { key: "saturday", label: "Saturday" },
    ];
    // console.log("multipleEditSetDays ===>", multipleEditSetDays);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Multiple Edit - Select Day
            </h3>
            <button
              onClick={() => {
                setMultipleEditSetDays(new Set());
                setShowMultipleEditModal(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>{selectedRows.size}</strong> employees selected for
                editing. Choose which day you want to update:
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
                    <span className="font-medium">{day.label} 
                      {multipleEditSetDays.has(day.key) && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Set
                        </span>
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setMultipleEditSetDays(new Set());
              setShowMultipleEditModal(false);
            }}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Get the current week dates (starting with Sunday)
  const weekDates = getWeekDates(selectedDate);
  const [sunday, monday, tuesday, wednesday, thursday, friday, saturday] =
    weekDates;

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calendarDays = generateCalendarDays();
  const pageNumbers: number[] = [1, 2, 3, 4];

  function changeformatDtTime(time: any) {
    let [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, "0")} ${ampm}`;
  }
  // Render schedule cell (editable or display)
  const renderScheduleCell = (employee: any, day: string) => {
    const isEditing = editingEmployeeId === employee._id;
    let displayValue = "";
    // console.log("employee ===>", employee)
    if (isEditing && editingSchedule) {
      const scheduleValue = editingSchedule[day];

      if (typeof scheduleValue === "object" && scheduleValue.start_time) {
        // console.log("scheduleValue ===>", scheduleValue)
        displayValue =
          scheduleValue.start_time === "OFF"
            ? "OFF"
            : `${changeformatDtTime(
                scheduleValue.start_time.split(" ")?.[1]
              )}-${changeformatDtTime(scheduleValue.end_time.split(" ")?.[1])}`;
      } else {
        displayValue = String(scheduleValue || "OFF");
      }
    } else {
      if (employee.schedule[day] === "OFF") {
        displayValue = "OFF";
      } else if (employee.schedule[day] === "-") {
        displayValue = "-";
      } else {
        const parts =
          employee.schedule[day]?.split("-")?.map((part: any) => part.trim()) ||
          [];

        if (parts[2] != "" && parts[5] != "") {
          const [startTime, endTime] = [
            parts[2].split(" ")?.[1]?.toString() || "",
            parts[5].split(" ")?.[1]?.toString() || "",
          ];
          // console.log("parts ===>", parts[5].split(' '))
          displayValue =
            `${changeformatDtTime(startTime)} - ${changeformatDtTime(
              endTime
            )}` || "OFF";
        }
      }
    }
    // console.log("displayValue ===>", displayValue)
    if (isEditing) {
      return (
        <button
          onClick={() => openTimePicker(day, displayValue)}
          className="w-full px-2 py-1 text-center text-sm border border-gray-300 rounded hover:border-teal-500 focus:outline-none focus:border-teal-500 transition-colors bg-white"
        >
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{displayValue}</span>
          </div>
        </button>
      );
    }

    return <span className="text-sm text-gray-700">{displayValue}</span>;
  };

  if (isLoadingRoster) {
    return (
      <div className="p-4 w-full">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          <span className="ml-2 text-gray-600">Loading roster...</span>
        </div>
      </div>
    );
  }

  if (rosterError) {
    return (
      <div className="p-4 w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Roster</h3>
          <p className="text-red-600 text-sm mt-1">
            Failed to load roster data. Please try again.
          </p>
          <button
            onClick={() => refetchRoster()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full">
      <div className="w-full mx-auto bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="text-[20px] font-semibold">Roster</div>
        <p className="text-[#A2A1A8] text-[14px]">All Employee Roster List</p>

        {/* Roster Stats */}
        {rosterStats?.data && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600">Total Employees</div>
              <div className="text-xl font-semibold text-blue-800">
                {rosterStats.data.totalEmployees}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600">Total Hours</div>
              <div className="text-xl font-semibold text-green-800">
                {rosterStats.data.totalHours}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-sm text-yellow-600">Average Hours</div>
              <div className="text-xl font-semibold text-yellow-800">
                {rosterStats.data.averageHours?.toFixed(1) || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600">Overnight Shifts</div>
              <div className="text-xl font-semibold text-purple-800">
                {rosterStats.data.overnightShifts}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Bulk Actions */}
            <div className="flex gap-2">
              {/* <button
                onClick={handleCreateRosterForAllEmployees}
                disabled={isCreatingRoster}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingRoster ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Missing Rosters ({employeesWithRoster.filter((emp: any) => !emp.hasRoster).length})
              </button> */}

              {/* <button
                onClick={handleCopyFromPreviousWeek}
                disabled={isCreatingRoster}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                Copy Previous Week
              </button> */}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
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
                        setCurrentPage(1);
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
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg border border-[#14b8a6]"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-3.5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                />
              </svg>
            </div>

            {/* Date Picker */}
            <div className="w-64">
              <div className="relative" ref={datePickerRef}>
                <div
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-white border border-[#14b8a6] cursor-pointer"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                >
                  <span
                    className={`${
                      selectedDate ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {selectedDate
                      ? formatDate(selectedDate)
                      : "Select a Sunday"}
                  </span>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>

                {isDatePickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                      <button
                        onClick={() => navigateMonth("prev")}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>

                      <h3 className="text-lg font-semibold text-gray-800">
                        {months[currentMonth]} {currentYear}
                      </h3>

                      <button
                        onClick={() => navigateMonth("next")}
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
                          ${
                            !day
                              ? "cursor-default"
                              : isSunday(day)
                              ? "cursor-pointer hover:bg-blue-50"
                              : "cursor-not-allowed opacity-30"
                          }
                          ${
                            isSelected(day) && isSunday(day)
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : isToday(day) && isSunday(day)
                              ? "bg-blue-100 text-blue-600 font-semibold"
                              : day && isSunday(day)
                              ? "text-gray-700 hover:text-blue-600"
                              : day && !isSunday(day)
                              ? "text-gray-300 bg-gray-50"
                              : ""
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
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredEmployees.length} employee
        {filteredEmployees.length !== 1 ? "s" : ""}
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
                    checked={
                      selectedRows.size === filteredEmployees.length &&
                      filteredEmployees.length > 0
                    }
                    onChange={toggleAllRows}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium min-w-[180px]">
                  Employee Name
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Sunday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(sunday)}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Monday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(monday)}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Tuesday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(tuesday)}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Wednesday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(wednesday)}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Thursday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(thursday)}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Friday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(friday)}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>Saturday</span>
                    <span className="text-xs font-normal">
                      {formatHeaderDate(saturday)}
                    </span>
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
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {isLoadingEmployees ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading employees...
                      </div>
                    ) : (
                      "No employees found matching your search criteria."
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee: any) => (
                  <tr
                    key={employee._id}
                    className={`hover:bg-gray-50 ${
                      editingEmployeeId === employee._id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={selectedRows.has(employee._id)}
                        onChange={() => toggleRowSelection(employee._id)}
                        disabled={editingEmployeeId === employee._id}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      <div>
                        <div className="flex items-center gap-2">
                          {String(employee?.employee?.name || "Unknown")}
                          {!employee.hasRoster && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              No Roster
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {String(employee?.employee?.department || "Unknown")}{" "}
                          • {String(employee?.employee?.employeeId || "N/A")}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "sunday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "monday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "tuesday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "wednesday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "thursday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "friday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderScheduleCell(employee, "saturday")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingEmployeeId === employee._id ? (
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
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
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
              Showing 1 to {Math.min(10, filteredEmployees.length)} out of{" "}
              {filteredEmployees.length} records
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
                      ? "text-black border border-[#14b8a6]"
                      : "text-gray-700 hover:bg-gray-100"
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
          selectedDate={selectedDate}
          dayName={timePickerDay}
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
          ShowMultipleEditModal={setShowMultipleEditModal}
          selectedDate={selectedDate}
        />
      )}

      {/* Multiple Edit Day Selection Modal */}
      {showMultipleEditModal &&
        !multipleEditDay &&
        renderMultipleEditDayModal()}
    </div>
  );
};

export default Roster;
