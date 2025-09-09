import { api } from './api';

export const rosterServices = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get roster for a specific week
    getWeekRoster: builder.query<any, {
      year: number;
      weekNumber: number;
    }>({
      query: ({ year, weekNumber }) => `/roster/week/${year}/${weekNumber}`,
      providesTags: (result, error, { year, weekNumber }) => [
        { type: 'Roster' as const, id: 'LIST' },
        { type: 'Roster' as const, id: `week-${year}-${weekNumber}` },
        'Roster' as const,
      ],
    }),

    // Get employee roster with date range
    getEmployeeRoster: builder.query<any, {
      employeeId: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ employeeId, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        return `/roster/employee/${employeeId}?${params.toString()}`;
      },
      providesTags: (result, error, { employeeId }) => [
        { type: 'Roster' as const, id: `employee-${employeeId}` },
        'Roster' as const,
      ],
    }),
    GetRosterForallEmployee: builder.query<any, {
      employeeId: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ employeeId, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        return `/roster/rosterforallemployee/${employeeId}?${params.toString()}`;
      },
      providesTags: (result, error, { employeeId }) => [
        { type: 'Roster' as const, id: `employee-${employeeId}` },
        'Roster' as const,
      ],
    }),

    // Get roster statistics
    getRosterStats: builder.query<any, {
      year: number;
      weekNumber: number;
    }>({
      query: ({ year, weekNumber }) => `/roster/stats/${year}/${weekNumber}`,
      providesTags: (result, error, { year, weekNumber }) => [
        { type: 'RosterStats' as const, id: `stats-${year}-${weekNumber}` },
        'RosterStats' as const,
      ],
    }),

    // Create single roster
    createRoster: builder.mutation<any, any>({
      query: (rosterData) => ({
        url: '/roster',
        method: 'POST',
        body: rosterData,
      }),
      invalidatesTags: (result, error, { year, week_number }) => [
        { type: 'Roster' as const, id: 'LIST' },
        { type: 'Roster' as const, id: `week-${year}-${week_number}` },
        { type: 'RosterStats' as const, id: `stats-${year}-${week_number}` },
        'Roster' as const,
        'RosterStats' as const,
      ],
    }),

    // Bulk create rosters
    bulkCreateRoster: builder.mutation<any, any>({
      query: (bulkData) => ({
        url: '/roster/bulk',
        method: 'POST',
        body: bulkData,
      }),
      invalidatesTags: (result, error, { year, week_number }) => [
        { type: 'Roster' as const, id: 'LIST' },
        { type: 'Roster' as const, id: `week-${year}-${week_number}` },
        { type: 'RosterStats' as const, id: `stats-${year}-${week_number}` },
        'Roster' as const,
        'RosterStats' as const,
      ],
    }),

    // Copy roster from previous week
    copyRosterFromPreviousWeek: builder.mutation<any, any>({
      query: (copyData) => ({
        url: '/roster/copy',
        method: 'POST',
        body: copyData,
      }),
      invalidatesTags: (result, error, { toYear, toWeekNumber }) => [
        { type: 'Roster' as const, id: 'LIST' },
        { type: 'Roster' as const, id: `week-${toYear}-${toWeekNumber}` },
        { type: 'RosterStats' as const, id: `stats-${toYear}-${toWeekNumber}` },
        'Roster' as const,
        'RosterStats' as const,
      ],
    }),

    // Update roster
    updateRoster: builder.mutation<any, {
      id: string;
      [key: string]: any;
    }>({
      query: ({ id, ...updateData }) => ({
        url: `/roster/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id, year, week_number }) => [
        { type: 'Roster' as const, id },
        { type: 'Roster' as const, id: 'LIST' },
        { type: 'Roster' as const, id: `week-${year}-${week_number}` },
        { type: 'RosterStats' as const, id: `stats-${year}-${week_number}` },
        'Roster' as const,
        'RosterStats' as const,
      ],
    }),

    // Delete roster
    deleteRoster: builder.mutation<any, string>({
      query: (id) => ({
        url: `/roster/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Roster' as const, id },
        { type: 'Roster' as const, id: 'LIST' },
        'Roster' as const,
        'RosterStats' as const,
      ],
    }),

    // Get all employees for roster assignment
    getEmployeesForRoster: builder.query<any, void>({
      query: () => '/employees?isActive=true',
      providesTags: ['Employee' as const],
    }),
  }),
});

export const {
  // Roster queries
  useGetWeekRosterQuery,
  useGetEmployeeRosterQuery,
  useGetRosterStatsQuery,
  useGetEmployeesForRosterQuery,
  useGetRosterForallEmployeeQuery,
  // Roster mutations
  useCreateRosterMutation,
  useBulkCreateRosterMutation,
  useCopyRosterFromPreviousWeekMutation,
  useUpdateRosterMutation,
  useDeleteRosterMutation,

  // Lazy queries
  useLazyGetWeekRosterQuery,
  useLazyGetEmployeeRosterQuery,
  useLazyGetRosterStatsQuery,
} = rosterServices;