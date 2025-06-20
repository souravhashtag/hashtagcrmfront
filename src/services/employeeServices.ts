import { api } from './api';

export const employeeServices = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => 
        `/employee?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    }),

    getEmployeeById: builder.query<any, string>({
      query: (id) => `/employee/${id}`,
    }),

    createEmployee: builder.mutation<any, {}>({
      query: (body) => ({
        url: '/employee/',
        method: 'POST',
        body,
      }),
    }),

    updateEmployee: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/employee/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    deleteEmployee: builder.mutation<any, string>({
      query: (id) => ({
        url: `/employee/${id}`,
        method: 'DELETE',
      }),
    }),
    getEmployeeBirthDay: builder.query({
      query: () => ({
        url: `/employee/get-birthday-list`,
      }),
    }),
    getEmployeeProfile: builder.query({
      query: () => ({
        url: `/employee/get-employee-profile`,
      }),
    })
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
} = employeeServices;