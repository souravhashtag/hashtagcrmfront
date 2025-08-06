import { api } from './api';

export const employeeServices = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => 
        `/employee?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      providesTags: ['Employee'],
    }),

    getEmployeeById: builder.query<any, string>({
      query: (id) => `/employee/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),

    createEmployee: builder.mutation<any, {}>({
      query: (body) => ({
        url: '/employee/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee'],
    }),

    updateEmployee: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/employee/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        'Employee',
      ],
    }),

    deleteEmployee: builder.mutation<any, string>({
      query: (id) => ({
        url: `/employee/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employee'],
    }),

    getEmployeeBirthDay: builder.query({
      query: () => ({
        url: `/employee/get-birthday-list`,
      }),
      providesTags: ['Employee'],
    }),

    getEmployeeProfile: builder.query({
      query: () => ({
        url: `/employee/get-employee-profile`,
      }),
      providesTags: ['Employee'],
    }),

    // Get employees by role level (for hierarchy filtering)
    getEmployeesByRoleLevel: builder.query<any, {
      level: number;
      greaterThan?: boolean;
    }>({
      query: ({ level, greaterThan = false }) => {
        const params = new URLSearchParams({
          level: level.toString(),
          greaterThan: greaterThan.toString(),
        });
        return `/employee/by-role-level?${params.toString()}`;
      },
      providesTags: ['Employee'],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeBirthDayQuery,
  useGetEmployeeProfileQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeesByRoleLevelQuery,
} = employeeServices;