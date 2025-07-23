import React, { useRef, useState, useEffect } from "react";
import {
  getScreenshots,
  ScreenShotResponse,
} from "../../../services/authService";
import { Loader2 } from "lucide-react";
import {
  ClockIn,
  ClockOut,
  getIndividualAttendanceData,
  handleBreak,
} from "../../../services/AttendanceService";
import { useUser } from "../context/DashboardContext";
import WorkingHours from './WorkingHours';

const Timmer: React.FC<any> = ({setIsClockedIn,isClockedIn,TakeaBreak,setTakeaBreak,setIsTimmerReady}) => {
  const [getAttendanceData, setAttendanceData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [isClockedIn, setIsClockedIn] = useState(false);
  const [getWorkingHour, setWorkingHour] = useState("");
  const [displayTime, setDisplayTime] = useState(0);
  // const [TakeaBreak, setTakeaBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);
  const [currentBreakStart, setCurrentBreakStart] = useState<Date | null>(null);
  const [getTimerReady, setTimerReady] = useState<boolean>(false);
  const { user } = useUser();

  const calculateWorkingTime = () => {
    if (!sessionStartTime) return 0;

    const now = new Date();
    let totalWorked = now.getTime() - sessionStartTime.getTime();
    totalWorked -= totalBreakTime;
    if (TakeaBreak && currentBreakStart) {
      totalWorked -= now.getTime() - currentBreakStart.getTime();
    }

    return Math.floor(totalWorked / 1000);
  };

  useEffect(() => {
    console.log("isClockedIn",isClockedIn);
    if (isClockedIn) {
      intervalRef.current = setInterval(() => {
        const actualTime = calculateWorkingTime();
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
  }, [
    isClockedIn,
    TakeaBreak,
    sessionStartTime,
    totalBreakTime,
    currentBreakStart,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && (isClockedIn || TakeaBreak)) {
        const actualTime = calculateWorkingTime();
        setDisplayTime(actualTime);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [
    isClockedIn,
    TakeaBreak,
    sessionStartTime,
    totalBreakTime,
    currentBreakStart,
  ]);

  const handleClockIn = async () => {
    const confirmClockIn = window.confirm("Are you sure you want to clock in?");
    if (!confirmClockIn) return;
    try {
      const response = await ClockIn();
      console.log("ClockIn response:", response);
      if (response?.status === 200) {
        const now = new Date();
        setIsClockedIn(true);
        setSessionStartTime(now);
        setTotalBreakTime(0);
        setDisplayTime(0);
        await getIndividualClockInData();
        console.log("Clock-in successful");
      } else {
        console.error("Clock-in failed:", response);
      }
    } catch (error) {
      console.error("Clock-in error:", error);
    }
  };

  const handleTakeBreak = async () => {
    const confirmBreak = window.confirm("Are you sure you want to take a break?");
    if (!confirmBreak) return;
    try {
      setLoading(true);
      const response = await handleBreak("attendance/take-a-break");
      if (response?.status === 200) {
        setLoading(false);
        setTakeaBreak(true);
        setIsClockedIn(false);
        setCurrentBreakStart(new Date());
      } else {
        setLoading(false);
        console.error("Take a break failed:", response);
      }
    } catch (error) {
        setLoading(false);
        console.error("Break error:", error);
    }
  };

  const handleResumeWork = async () => {
    const confirmResume = window.confirm("Are you sure you want to resume work?");
    if (!confirmResume) return;
    try {
      const response = await handleBreak("attendance/resume-work");
      if (response?.status === 200) {
        if (currentBreakStart) {
          const breakDuration =
            new Date().getTime() - currentBreakStart.getTime();
          setTotalBreakTime((prev) => prev + breakDuration);
          setCurrentBreakStart(null);
        }
        setTakeaBreak(false);
        setIsClockedIn(true);
      } else {
        console.error("Resume work failed:", response);
      }
    } catch (error) {
      console.error("Resume work error:", error);
    }
  };

  const handleClockOut = async () => {
    const confirmClockOut = window.confirm("Are you sure you want to clock out?");
    if (!confirmClockOut) return;
    const now = new Date();

    if (TakeaBreak && currentBreakStart) {
      const breakDuration = now.getTime() - currentBreakStart.getTime();
      setTotalBreakTime((prev) => prev + breakDuration);
    }

    setIsClockedIn(false);
    setTakeaBreak(false);
    setClockOutTime(now);

    try {
      const response = await ClockOut();
      if (response?.status === 200) {
        if (sessionStartTime) {
          const totalWorked =
            now.getTime() - sessionStartTime.getTime() - totalBreakTime;
          const finalWorkingTime = Math.floor(totalWorked / 1000);
          setWorkingHour(formatTime(finalWorkingTime));
        }
        setDisplayTime(0);
        setSessionStartTime(null);
        setTotalBreakTime(0);
        setCurrentBreakStart(null);
        await getIndividualClockInData();
        console.log("Clock-out successful");
      } else {
        console.error("Clock-out failed:", response);
      }
    } catch (error) {
      console.error("Clock-out error:", error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    if(totalSeconds!=0){
        const hrs = Math.floor(totalSeconds / 3600)
          .toString()
          .padStart(2, "0");
        const mins = Math.floor((totalSeconds % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const secs = (totalSeconds % 60).toString().padStart(2, "0");
        return `${hrs}:${mins}:${secs}`;
    }else{
        return `00:00:00`;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  };

  const getIndividualClockInData = async () => {
    // console.log("Fetching individual attendance data...");
    try {
      const response = await getIndividualAttendanceData();
      setIsClockedIn(true);
      setTakeaBreak(false);
      setDisplayTime(0);
      console.log("Attendance data fetched:", response);
      if (response?.data) {
        const clockInTime = new Date(response?.data?.clockIn);
        const now = new Date();

        setSessionStartTime(clockInTime);

        const breaks = response.data.breaks || [];
        let totalBreakMilliseconds = 0;
        let ongoingBreak = false;
        let currentBreakStartTime: Date | null = null;

        breaks.forEach((b: any) => {
          const start = new Date(b.start);
          if (b.end) {
            const end = new Date(b.end);
            totalBreakMilliseconds += end.getTime() - start.getTime();
          } else {
            ongoingBreak = true;
            currentBreakStartTime = start;
          }
        });
        // console.log("Total break time in milliseconds:", totalBreakMilliseconds);
        setTotalBreakTime(totalBreakMilliseconds);
        setCurrentBreakStart(currentBreakStartTime);

        const isCurrentlyClockedIn = response?.data?.clockOut === null;
        setIsClockedIn(!ongoingBreak && isCurrentlyClockedIn);
        setTakeaBreak(ongoingBreak);

        if (response?.data?.clockOut !== null) {
          const clockOutTime = new Date(response?.data?.clockOut);
          const totalWorked =
            clockOutTime.getTime() -
            clockInTime.getTime() -
            totalBreakMilliseconds;
          const totalWorkingTime = Math.floor(totalWorked / 1000);
          setWorkingHour(formatTime(totalWorkingTime));
          setDisplayTime(0);
        } else {
          const totalMillisecondsWorked =
            now.getTime() - clockInTime.getTime() - totalBreakMilliseconds;
          let currentBreakDuration = 0;
          if (ongoingBreak && currentBreakStartTime !== null) {
            currentBreakDuration =
              now.getTime() - (currentBreakStartTime as Date).getTime();
          }
          const totalSecondsWorked = Math.floor(
            (totalMillisecondsWorked - currentBreakDuration) / 1000
          );
          setDisplayTime(totalSecondsWorked);
          setWorkingHour("");
        }
      } else {
        console.error("Clock-in fetch failed:", response);
        setIsClockedIn(false);
        setTakeaBreak(false);
        setDisplayTime(0);
      }
    } catch (err) {
      setError("Failed to fetch attendance data");
      setIsClockedIn(false);
      setTakeaBreak(false);
    } finally {
      setLoading(false);
      setIsTimmerReady(true)
      setTimerReady(true)
    }
  };

  useEffect(() => {
    getIndividualClockInData();
  }, [getAttendanceData?.data?.length >0]);

  return (
    <>
      <div className="col-span-8 from-teal-400 to-teal-500 rounded-xl text-white">
              <div className="col-span-8 bg-[#E1F7EF] from-teal-400 to-teal-500 rounded-xl text-white h-32 mb-4 border border-[#0BB8A7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-full mr-4 overflow-hidden ml-5 font-poppins">
              <div className="w-full h-full bg-orange-400"><img src={`${user?.profilePicture}`}></img> </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#000] mb-2">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="font-medium	text-[#000]">{user?.position}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {isClockedIn && !TakeaBreak ? (
              <button
                className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors flex items-center justify-center disabled:opacity-70 w-[130px]"
                onClick={handleTakeBreak}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-6 w-5 animate-spin" />
                ) : (
                  "Take a break"
                )}
              </button>
            ) : !isClockedIn && TakeaBreak ? (
              <button
                className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                onClick={handleResumeWork}
              >
                Resume Work
              </button>
            ) : (
              ""
            )}

            {!isClockedIn && !TakeaBreak ? (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                onClick={handleClockIn}
                disabled={isClockedIn}
              >
                Clock In
              </button>
            ) : !TakeaBreak ? (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                onClick={handleClockOut}
              >
                Clock Out
              </button>
            ) : (
              ""
            )}

            {/* Time Display Section */}
            <div className="text-right h-[126px] bg-[#50E5D7] rounded-xl font-poppins">
              <div className="flex flex-col items-end space-y-1">
                <div className="text-[22px] p-4 pb-0 font-bold font-mono tracking-wider text-[#024C45] mt-5 font-poppins">
                  {formatTime(displayTime)}
                </div>
                <div className="w-full text-xs capitalize tracking-wide text-center font-bold  text-[#000]">
                  {TakeaBreak ? "ON BREAK" : isClockedIn ? "WORKING" : "OFFLINE"}
                </div>
              </div>
            </div>
          </div>
        </div>
</div>
        {/* Total Working Hours Display */}
        {getWorkingHour && (
           <div className="col-span-8 bg-[#E1F7EF] from-teal-400 to-teal-500 rounded-xl p-4 text-black h-40 mb-4 border border-[#65e3d7]">
        
          <div className="mt-6 pt-4 border-t border-teal-300/30 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#000]">Total Working Hours</p>
                  <p className="text-xl font-bold tracking-wider text-[#000]">{getWorkingHour}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-[#000]">Session Complete</span>
                </div>
              </div>
            </div>
          </div>       
      </div>
      )}
      {getTimerReady && (
          <WorkingHours isClockedIn={isClockedIn} TakeaBreak={TakeaBreak} />
        )}
      </div>
      
    </>
  );
};

export default Timmer;