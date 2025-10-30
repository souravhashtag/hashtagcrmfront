import apiClient from './apiClient';

// export interface AttendanceResponse {
//   _id: string;
//   employeeId: string;
//   date: Date,
//   clockIn: string;
//   status  : string;

// }
export const getMissedClockOut = async () => {
  const { data } = await apiClient.get('/attendance/check-missed-clockout');
  return data;
};

export const updateManualClockOut = async (payload: any) => {
  const { data } = await apiClient.post('/attendance/manual-clockout', payload);
  return data;
};


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
export const handleBreak = async (apiendpoint: string): Promise<any> => {
  try {
    const response = await apiClient.get<any>(apiendpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const clockInScreenShotAPi = async () => {
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
export const clockOutScreenShotAPi = async () => {
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



export const getIndividualAttendanceDataByDate = async (
  params: any
): Promise<any> => {
  try {
    const { employeeId, page = '1', limit = '10', startDate, endDate, sort = 'desc', ongoing } = params;

    if (!employeeId) throw new Error('employeeId is required');

    const queryParams = new URLSearchParams();

    if (page) queryParams.append('page', String(page));
    if (limit) queryParams.append('limit', String(limit));
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (sort) queryParams.append('sort', sort);
    if (ongoing !== undefined && ongoing !== null)
      queryParams.append('ongoing', String(ongoing));

    const url = `/attendance/get-attendance-by-date-range/${employeeId}?${queryParams.toString()}`;

    const response = await apiClient.get<any>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching individual attendance data:', error);
    throw error;
  }
};

