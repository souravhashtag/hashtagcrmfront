import React, { useRef, useState,useEffect } from 'react';
import { getScreenshots, ScreenShotResponse } from '../../../services/authService';
import { ClockIn,ClockOut,getIndividualAttendanceData,handleBreak  } from '../../../services/AttendanceService';
const DashboardPage: React.FC = () => {
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [getWorkingHour, setWorkingHour] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [TakeaBreak, setTakeaBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [clockOutTime, setClockOutTime] =  useState<Date | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  useEffect(() => {
    if (isClockedIn) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isClockedIn]);

  const handleClockIn = async() => {
    // setIsClockedIn(true);
    // setSeconds(0); 
    try {
      const response = await ClockIn(); 

      if (response?.status === 200) {
        setIsClockedIn(true);
        await getIndividualClockInData()
        console.log('Clock-in successful');
      } else {
        console.error('Clock-in failed:', response);
      }
    } catch (error) {
      console.error('Clock-in error:', error);
    }
  };
  const handleTakeBreak = async() => {    
    try {
      const response = await handleBreak('attendance/take-a-break')
      if (response?.status === 200) {
        setTakeaBreak(true)
        setIsClockedIn(false)
      } else {
        console.error('Take a break failed:', response);
      }
    }catch (error) {
      console.error('Clock-in error:', error);
    }
  }
  const handleResumeWork = async() => {
    try {
      const response = await handleBreak('attendance/resume-work')
      if (response?.status === 200) {
        setTakeaBreak(false)
        setIsClockedIn(true)
      } else {
        console.error('Resume work failed:', response);
      }
    }catch (error) {
      console.error('Clock-in error:', error);
    }
  }
  const handleClockOut = async () => {
    const now = new Date();
    setIsClockedIn(false);
    setTakeaBreak(false);
    setClockOutTime(now);

    try {
      const response = await ClockOut(); 

      if (response?.status === 200) {
        setIsClockedIn(true);
        setSeconds(0);
        console.log('Clock-in successful');
      } else {
        console.error('Clock-in failed:', response);
      }
    } catch (error) {
      console.error('Clock-in error:', error);
    }
    setSeconds(0);
  }
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };
  const logout = () =>{
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href="/"
  }
  const fetchScreenshots = async () => {
      try {
        const response = await getScreenshots();
        if (response) {
          setScreenshots(response);
        }
        //console.log("data==>",response)
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

        const breaks = response.data.breaks || [];

        let totalBreakMilliseconds = 0;

        breaks.forEach((b: any) => {
          const start = new Date(b.start);
          const end = b.end ? new Date(b.end) : now; 
          totalBreakMilliseconds += end.getTime() - start.getTime();
        });

        const totalMillisecondsWorked = now.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
        const totalSecondsWorked = Math.floor(totalMillisecondsWorked / 1000);

        const ongoingBreak = breaks.some((b: any) => b.start && !b.end);

        setIsClockedIn(!ongoingBreak && response?.data?.clockOut!==null?false:true); 
        setTakeaBreak(ongoingBreak);
        setSeconds(totalSecondsWorked);
        setWorkingHour('')
        if(response?.data?.clockOut!==null){
          const clockOutTime = new Date(response?.data?.clockOut);
          const totalWorked = clockOutTime.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
          const totalWorkingTime = Math.floor(totalWorked / 1000);
          setWorkingHour(formatTime(totalWorkingTime))
        }
        console.log("Worked seconds excluding break:", totalSecondsWorked);
      } else {
        console.error('Clock-in fetch failed:', response);
        setIsClockedIn(false);
        setTakeaBreak(false);
        setSeconds(0);
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
      setIsClockedIn(false);
      setTakeaBreak(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    fetchScreenshots();
    getIndividualClockInData();
  },[])
  return (
    <div> 
      {(isClockedIn && !TakeaBreak)?
          <button onClick={handleTakeBreak}>Take a break</button>
          :(!isClockedIn && TakeaBreak)?
          <button onClick={handleResumeWork}>Resume Work</button>
          :''
        
      }
      
      {(!isClockedIn && !TakeaBreak)?
          <button onClick={handleClockIn} disabled={isClockedIn}>
            {'Clock In'}
          </button>
          :
          <button onClick={handleClockOut}>Clock Out</button>
      }
      
      
      <div style={{ marginTop: '1rem' }}>
        {(getWorkingHour)?`Total Working hour: ${getWorkingHour}`:"Timer:"+ formatTime(seconds)}
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
