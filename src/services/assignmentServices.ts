import { api } from './api';

export const assignmentServices = api.injectEndpoints({
  endpoints: (builder) => ({
    // Assign employees to supervisor
    assignEmployees: builder.mutation<any, { 
      supervisorId: string; 
      employeeIds: string[];
      reason?: string;
    }>({
      query: ({ supervisorId, employeeIds, reason }) => ({
        url: `/assignments/${supervisorId}/assign`,
        method: 'POST',
        body: { employeeIds, reason },
      }),
      invalidatesTags: (result, error, { supervisorId }) => [
        { type: 'Assignment', id: supervisorId },
        { type: 'Assignment', id: 'LIST' },
        'Assignment',
        'Employee', // Also invalidate employee cache since assignments affect availability
      ],
    }),

    // Unassign employee from supervisor
    unassignEmployee: builder.mutation<any, { 
      supervisorId: string; 
      employeeId: string;
      reason?: string;
    }>({
      query: ({ supervisorId, employeeId, reason }) => ({
        url: `/assignments/${supervisorId}/unassign`,
        method: 'DELETE',
        body: { employeeId, reason },
      }),
      invalidatesTags: (result, error, { supervisorId }) => [
        { type: 'Assignment', id: supervisorId },
        { type: 'Assignment', id: 'LIST' },
        'Assignment',
        'Employee',
      ],
    }),

    // Get assigned employees for a supervisor
    getAssignedEmployees: builder.query<any, {
      supervisorId: string;
      status?: 'active' | 'inactive' | 'all';
      page?: number;
      limit?: number;
    }>({
      query: ({ supervisorId, status = 'active', page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          status,
          page: page.toString(),
          limit: limit.toString(),
        });
        return `/assignments/${supervisorId}/assigned?${params.toString()}`;
      },
      providesTags: (result, error, { supervisorId }) => [
        { type: 'Assignment', id: supervisorId },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),

    // Get available employees for assignment to a supervisor
    getAvailableEmployeesForAssignment: builder.query<any, {
      supervisorId: string;
      search?: string;
    }>({
      query: ({ supervisorId, search = '' }) => {
        const params = new URLSearchParams({
          search: encodeURIComponent(search),
        });
        return `/assignments/${supervisorId}/available-for-assignment?${params.toString()}`;
      },
      providesTags: (result, error, { supervisorId }) => [
        { type: 'Assignment', id: `available-${supervisorId}` },
        'Assignment',
      ],
    }),

    // Get assignment history
    getAssignmentHistory: builder.query<any, {
      employeeId?: string;
      supervisorId?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ employeeId, supervisorId, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (employeeId) params.append('employeeId', employeeId);
        if (supervisorId) params.append('supervisorId', supervisorId);
        
        return `/assignments/assignment-history?${params.toString()}`;
      },
      providesTags: ['Assignment'],
    }),

    // Transfer employee assignment between supervisors
    transferEmployeeAssignment: builder.mutation<any, {
      employeeId: string;
      fromSupervisorId: string;
      toSupervisorId: string;
      reason?: string;
    }>({
      query: ({ employeeId, fromSupervisorId, toSupervisorId, reason }) => ({
        url: `/assignments/${employeeId}/transfer`,
        method: 'PUT',
        body: {
          fromSupervisorId,
          toSupervisorId,
          reason,
        },
      }),
      invalidatesTags: (result, error, { fromSupervisorId, toSupervisorId }) => [
        { type: 'Assignment', id: fromSupervisorId },
        { type: 'Assignment', id: toSupervisorId },
        { type: 'Assignment', id: 'LIST' },
        'Assignment',
        'Employee',
      ],
    }),

    // Get supervisor's team overview (dashboard data)
    getSupervisorTeamOverview: builder.query<any, string>({
      query: (supervisorId) => `/assignments/${supervisorId}/team-overview`,
      providesTags: (result, error, supervisorId) => [
        { type: 'Assignment', id: `overview-${supervisorId}` },
        'Assignment',
      ],
    }),

    // Bulk assignment operations
    bulkAssignEmployees: builder.mutation<any, {
      assignments: Array<{
        supervisorId: string;
        employeeIds: string[];
        reason?: string;
      }>;
    }>({
      query: ({ assignments }) => ({
        url: '/assignments/bulk-assign',
        method: 'POST',
        body: { assignments },
      }),
      invalidatesTags: [
        { type: 'Assignment', id: 'LIST' },
        'Assignment',
        'Employee',
      ],
    }),

    // Bulk unassign operations
    bulkUnassignEmployees: builder.mutation<any, {
      unassignments: Array<{
        supervisorId: string;
        employeeId: string;
        reason?: string;
      }>;
    }>({
      query: ({ unassignments }) => ({
        url: '/assignments/bulk-unassign',
        method: 'POST',
        body: { unassignments },
      }),
      invalidatesTags: [
        { type: 'Assignment', id: 'LIST' },
        'Assignment',
        'Employee',
      ],
    }),

    // Get all supervisors with their assignment counts
    getSupervisorsWithTeamCounts: builder.query<any, {
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: ({ page = 1, limit = 10, search = '' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: encodeURIComponent(search),
        });
        return `/assignments/supervisors-overview?${params.toString()}`;
      },
      providesTags: ['Assignment', 'Employee'],
    }),

    // Get employee's current assignment (who is their supervisor)
    getEmployeeCurrentAssignment: builder.query<any, string>({
      query: (employeeId) => `/assignments/employee/${employeeId}/current`,
      providesTags: (result, error, employeeId) => [
        { type: 'Assignment', id: `employee-${employeeId}` },
      ],
    }),
  }),
});

export const {
  // Assignment mutations
  useAssignEmployeesMutation,
  useUnassignEmployeeMutation,
  useTransferEmployeeAssignmentMutation,
  useBulkAssignEmployeesMutation,
  useBulkUnassignEmployeesMutation,
  
  // Assignment queries
  useGetAssignedEmployeesQuery,
  useGetAvailableEmployeesForAssignmentQuery,
  useGetAssignmentHistoryQuery,
  useGetSupervisorTeamOverviewQuery,
  useGetSupervisorsWithTeamCountsQuery,
  useGetEmployeeCurrentAssignmentQuery,
} = assignmentServices;