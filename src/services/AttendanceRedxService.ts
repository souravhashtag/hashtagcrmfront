import { api } from './api';

export const AttendanceRedxService = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get attendance for a specific date
    getAttendanceByDate: builder.query({
      query: (date) => ({
        url: `attendance/date/${date}`,
        method: 'GET',
      }),
      providesTags: (result, error, date) => [
        { type: 'Employee', id: `attendance-date-${date}` }
      ],
    }),
    GetAttendanceForallEmployee: builder.query<any, {
      employeeId: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ employeeId, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        return `/attendance/get-attendance-by-date-range/${employeeId}?${params.toString()}`;
      },
      providesTags: (result, error, { employeeId }) => [
        { type: 'Roster' as const, id: `employee-${employeeId}` },
        'Roster' as const,
      ],
    }),
  }),
});

export const {
  useGetAttendanceByDateQuery,
  useGetAttendanceForallEmployeeQuery,
  useLazyGetAttendanceByDateQuery,
} = AttendanceRedxService;