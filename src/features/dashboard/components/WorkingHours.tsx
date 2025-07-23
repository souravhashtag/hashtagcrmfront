import React, { useRef, useState, useEffect } from "react";
import {
  getIndividualAttendanceData,
} from "../../../services/AttendanceService";
interface Break {
  start: string;
  end?: string;
}

interface AttendanceData {
  data: {
    clockIn: string;
    clockOut?: string | null;
    breaks?: Break[];
  };
}

interface WorkingHoursProps {
  attendanceData: AttendanceData;
}

const WorkingHours: React.FC<any> = ({isClockedIn,TakeaBreak}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [getWorkingHour, setWorkingHour] = useState('');
  const [displayTime, setDisplayTime] = useState(0); 
  const [totalBreakTime, setTotalBreakTime] = useState(0); 
  const [currentBreakStart, setCurrentBreakStart] = useState<Date | null>(null);
  const [overTime, setOverTime] = useState(0);
  const [attendanceResponse, setAttendanceResponse] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (totalSeconds: number) => {
    const total = Math.floor(Math.abs(totalSeconds)); 
    const hrs = Math.floor(total / 3600).toString().padStart(2, '0');
    const mins = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const calculateOvertime = (totalWorkingSeconds: number) => {
    const standardWorkHours = 8 * 3600; 
    return Math.max(0, totalWorkingSeconds - standardWorkHours);
  };
  const getAttendanceDt = async() => {
      const response = await getIndividualAttendanceData();
      setAttendanceResponse(response);
      // console.log("response==>",attendanceResponse);
  }
  const getIndividualClockInData = async (response:any) => {
    try {
      //const response = attendanceData;
      if (response?.data) {
        const clockInTime = new Date(response.data.clockIn);
        const now = new Date();
        
        const breaks = response.data.breaks || [];
        let totalBreakMilliseconds = 0;
        let ongoingBreak = false;
        let currentBreakStartTime: Date | null = null;

        // Calculate total break time
        breaks.forEach((b: Break) => {
          const start = new Date(b.start);
          if (b.end) {
            const end = new Date(b.end);
            totalBreakMilliseconds += end.getTime() - start.getTime();
          } else {
            ongoingBreak = true;
            currentBreakStartTime = start;
          }
        });
        console.log("Total break time in milliseconds:", totalBreakMilliseconds);
        setTotalBreakTime(totalBreakMilliseconds);
        setCurrentBreakStart(currentBreakStartTime);

        if (response.data.clockOut !== null && response.data.clockOut !== undefined) {
          // User has clocked out - calculate final working hours
          const clockOutTime = new Date(response.data.clockOut);
          const totalWorked = clockOutTime.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
          const totalWorkingTimeSeconds = Math.floor(totalWorked / 1000);
          
          setWorkingHour(formatTime(totalWorkingTimeSeconds));
          setDisplayTime(totalWorkingTimeSeconds);
          setOverTime(calculateOvertime(totalWorkingTimeSeconds));
        } else {
          // User is still clocked in - calculate current working time
          const totalMillisecondsWorked = now.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
          let currentBreakDuration = 0;
          
          if (ongoingBreak && currentBreakStartTime !== null) {
            currentBreakDuration = now.getTime() - (currentBreakStartTime as Date).getTime();
          }
          
          const totalSecondsWorked = Math.floor((totalMillisecondsWorked - currentBreakDuration) / 1000);
          setDisplayTime(Math.max(0, totalSecondsWorked));
          setWorkingHour('');
          setOverTime(calculateOvertime(Math.max(0, totalSecondsWorked)));
        }
      } else {
          console.error('No attendance data available');
          setError('No attendance data available');
      }
    } catch (err) {
        console.error('Failed to fetch attendance data:', err);
        setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (attendanceResponse === null) {
      getAttendanceDt();
    }
  }, []);
  useEffect(() => {
    // if (attendanceResponse && isClockedIn && !TakeaBreak) {
    if (attendanceResponse) {
      const interval = setInterval(() => {
        getIndividualClockInData(attendanceResponse);
      }, 1000);      
      return () => clearInterval(interval);
    }
  }, [attendanceResponse, isClockedIn, TakeaBreak]);
  useEffect(() => {
    getAttendanceDt();
  },[TakeaBreak])

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };



  return (
    <>
    <div className="col-span-8 bg-[#fff] from-teal-400 to-teal-500 rounded-xl p-4 text-black h-40 mb-4 border border-[#65e3d7]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Working Hours</h3>
          <p className="text-sm font-medium">Update: {getCurrentDate()}</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-semibold	mb-4 bg-[#FFF6D0] p-2 rounded-md text-center">Total Working Hours</p>
            <p className="text-xl font-bold text-center">
              {formatTime(displayTime + (totalBreakTime / 1000))}
            </p>
          </div>
          <div>
          <p className="text-sm font-semibold	mb-4 bg-[#CEFFFB] p-2 rounded-md text-center">Productive Hours</p>
            <p className="text-xl font-bold text-center">{formatTime(displayTime)}</p>
          </div>
          <div>
           <p className="text-sm font-semibold	mb-4 bg-[#FEE0E0] p-2 rounded-md text-center">Break Hours</p>
            <p className="text-xl font-bold text-center">{formatTime(totalBreakTime / 1000)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold	mb-4 bg-[#DEE3FA] p-2 rounded-md text-center">Over Time</p>
            <p className="text-xl font-bold text-center">{formatTime(overTime)}</p>
          </div>
        </div>
        </div>
    </>
  );
};

export default WorkingHours;