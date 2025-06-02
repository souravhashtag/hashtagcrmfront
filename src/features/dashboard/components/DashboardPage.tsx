import React, { useRef, useState, useEffect } from 'react';
import { getScreenshots, ScreenShotResponse } from '../../../services/authService';
import { ClockIn, ClockOut, getIndividualAttendanceData, handleBreak } from '../../../services/AttendanceService';

const DashboardPage: React.FC = () => {
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [getWorkingHour, setWorkingHour] = useState('');
  const [displayTime, setDisplayTime] = useState(0); 
  const [TakeaBreak, setTakeaBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0); 
  const [currentBreakStart, setCurrentBreakStart] = useState<Date | null>(null);

  const calculateWorkingTime = () => {
    if (!sessionStartTime || !isClockedIn) return 0;
    
    const now = new Date();
    let totalWorked = now.getTime() - sessionStartTime.getTime();    
    totalWorked -= totalBreakTime;    
    if (TakeaBreak && currentBreakStart) {
      totalWorked -= (now.getTime() - currentBreakStart.getTime());
    }
    
    return Math.floor(totalWorked / 1000); 
  };

  useEffect(() => {
    if (isClockedIn) {      
      intervalRef.current = setInterval(() => {
        const actualTime = calculateWorkingTime();
        //console.log("setInterval===========",actualTime);
        setDisplayTime(actualTime);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isClockedIn, TakeaBreak, sessionStartTime, totalBreakTime, currentBreakStart]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && (isClockedIn || TakeaBreak)) {
        // Recalculate time when page becomes visible again
        const actualTime = calculateWorkingTime();
        setDisplayTime(actualTime);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isClockedIn, TakeaBreak, sessionStartTime, totalBreakTime, currentBreakStart]);

  const handleClockIn = async () => {
    try {
      const response = await ClockIn();

      if (response?.status === 200) {
        const now = new Date();
        setIsClockedIn(true);
        setSessionStartTime(now);
        setTotalBreakTime(0);
        setDisplayTime(0);
        await getIndividualClockInData();
        console.log('Clock-in successful');
      } else {
        console.error('Clock-in failed:', response);
      }
    } catch (error) {
      console.error('Clock-in error:', error);
    }
  };

  const handleTakeBreak = async () => {
    try {
      const response = await handleBreak('attendance/take-a-break');
      if (response?.status === 200) {
        setTakeaBreak(true);
        setIsClockedIn(false);
        setCurrentBreakStart(new Date());
      } else {
        console.error('Take a break failed:', response);
      }
    } catch (error) {
      console.error('Break error:', error);
    }
  };

  const handleResumeWork = async () => {
    try {
      const response = await handleBreak('attendance/resume-work');
      if (response?.status === 200) {
        if (currentBreakStart) {
          const breakDuration = new Date().getTime() - currentBreakStart.getTime();
          setTotalBreakTime(prev => prev + breakDuration);
          setCurrentBreakStart(null);
        }
        setTakeaBreak(false);
        setIsClockedIn(true);
      } else {
        console.error('Resume work failed:', response);
      }
    } catch (error) {
      console.error('Resume work error:', error);
    }
  };

  const handleClockOut = async () => {
    const now = new Date();
    
    // If on break when clocking out, add current break time to total
    if (TakeaBreak && currentBreakStart) {
      const breakDuration = now.getTime() - currentBreakStart.getTime();
      setTotalBreakTime(prev => prev + breakDuration);
    }

    setIsClockedIn(false);
    setTakeaBreak(false);
    setClockOutTime(now);

    try {
      const response = await ClockOut();

      if (response?.status === 200) {
        // Calculate final working time
        if (sessionStartTime) {
          const totalWorked = now.getTime() - sessionStartTime.getTime() - totalBreakTime;
          const finalWorkingTime = Math.floor(totalWorked / 1000);
          setWorkingHour(formatTime(finalWorkingTime));
        }
        setDisplayTime(0);
        setSessionStartTime(null);
        setTotalBreakTime(0);
        setCurrentBreakStart(null);
        console.log('Clock-out successful');
      } else {
        console.error('Clock-out failed:', response);
      }
    } catch (error) {
      console.error('Clock-out error:', error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = "/";
  };

  const fetchScreenshots = async () => {
    try {
      const response = await getScreenshots();
      if (response) {
        setScreenshots(response);
      }
    } catch (err) {
      setError('Failed to fetch screenshots');
    } finally {
      setLoading(false);
    }
  };

  const getIndividualClockInData = async () => {
    try {
      const response = await getIndividualAttendanceData();
      if (response?.status === 200) {
        const clockInTime = new Date(response?.data?.clockIn);
        const now = new Date();
        
        // Set session start time from server data
        setSessionStartTime(clockInTime);

        const breaks = response.data.breaks || [];
        let totalBreakMilliseconds = 0;
        let ongoingBreak = false;
        let currentBreakStartTime: Date | null = null;

        breaks.forEach((b: any) => {
          const start = new Date(b.start);
          if (b.end) {
            // Completed break
            const end = new Date(b.end);
            totalBreakMilliseconds += end.getTime() - start.getTime();
          } else {
            // Ongoing break
            ongoingBreak = true;
            currentBreakStartTime = start;
          }
        });

        setTotalBreakTime(totalBreakMilliseconds);
        setCurrentBreakStart(currentBreakStartTime);

        const isCurrentlyClockedIn = response?.data?.clockOut === null;
        setIsClockedIn(!ongoingBreak && isCurrentlyClockedIn);
        setTakeaBreak(ongoingBreak);

        if (response?.data?.clockOut !== null) {
          const clockOutTime = new Date(response?.data?.clockOut);
          const totalWorked = clockOutTime.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
          const totalWorkingTime = Math.floor(totalWorked / 1000);
          setWorkingHour(formatTime(totalWorkingTime));
          setDisplayTime(0);
        } else {
          const totalMillisecondsWorked = now.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
          let currentBreakDuration = 0;
          if (ongoingBreak && currentBreakStartTime !== null) {
            currentBreakDuration = now.getTime() - (currentBreakStartTime as Date).getTime();
          }
          const totalSecondsWorked = Math.floor((totalMillisecondsWorked - currentBreakDuration) / 1000);
          setDisplayTime(totalSecondsWorked);
          setWorkingHour('');
          //console.log("Worked seconds excluding break:", totalSecondsWorked);
        }
      } else {
        console.error('Clock-in fetch failed:', response);
        setIsClockedIn(false);
        setTakeaBreak(false);
        setDisplayTime(0);
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
      setIsClockedIn(false);
      setTakeaBreak(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();
    getIndividualClockInData();
  }, []);

  return (
    <div>
      {(isClockedIn && !TakeaBreak) ?
        <button onClick={handleTakeBreak}>Take a break</button>
        : (!isClockedIn && TakeaBreak) ?
          <button onClick={handleResumeWork}>Resume Work</button>
          : ''
      }

      {(!isClockedIn && !TakeaBreak) ?
        <button onClick={handleClockIn} disabled={isClockedIn}>
          {'Clock In'}
        </button>
        : (!TakeaBreak) ?
          <button onClick={handleClockOut}>Clock Out</button>
          : ""
      }

      <div style={{ marginTop: '1rem' }}>
        {(getWorkingHour) ? `Total Working hour: ${getWorkingHour}` : "Timer: " + formatTime(displayTime)}
        {TakeaBreak && <div style={{ color: 'orange', marginTop: '0.5rem' }}>Currently on break</div>}
      </div>

      <h2>Screenshots</h2>
      <ul>
        {screenshots.length > 0 && screenshots?.map((shot) => (
          <li key={shot._id}>
            <p>User: {shot.userid.name}</p>
            <img src={`${process.env.REACT_APP_IMAGE_URL}${shot.image}`} alt="Screenshot" width="300" />
            <p>Uploaded: {new Date(shot.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
      <a onClick={logout}>Logout</a>
    </div>
  );
};

export default DashboardPage;