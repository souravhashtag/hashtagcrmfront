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
