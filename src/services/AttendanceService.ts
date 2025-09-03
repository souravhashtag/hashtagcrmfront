import apiClient from './apiClient';

// export interface AttendanceResponse {
//   _id: string;
//   employeeId: string;
//   date: Date,
//   clockIn: string;
//   status  : string;
  
// }
export const ClockIn = async (): Promise<any> => {
  try {
    const response = await apiClient.post<any>('attendance/create');
    return response.data;
  } catch (error) {
    throw error; 
  }
};
export const ClockOut = async (): Promise<any> => {
  try {
    const response = await apiClient.post<any>('attendance/clock-out');
    return response.data;
  } catch (error) {
    throw error; 
  }
};
export const getIndividualAttendanceData = async (): Promise<any> => {
  try {
    const response = await apiClient.get<any>('attendance/get-individual-attendance');
    return response.data;
  } catch (error) {
    throw error; 
  }
};
export const handleBreak = async (apiendpoint:string): Promise<any> => {
  try {
    const response = await apiClient.get<any>(apiendpoint);
    return response.data;
  } catch (error) {
    throw error; 
  }
};

export const clockInScreenShotAPi  = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/clockin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: localStorage.getItem("token"),
        }),
      });

      const data = await res.json();
      console.log("Response:", data);
    } catch (err) {
      console.error("API call failed:", err);
    }
};
export const clockOutScreenShotAPi  = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/clockout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: localStorage.getItem("token"),
        }),
      });

      const data = await res.json();
      // console.log("Response:", data);
    } catch (err) {
      console.error("API call failed:", err);
    }
};

