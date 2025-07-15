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
  }),
});

export const {
  useGetAttendanceByDateQuery,
  useLazyGetAttendanceByDateQuery,
} = AttendanceRedxService;