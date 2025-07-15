import { api } from './api';

export const departmentServices = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => 
        `/departments?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    }),

    getDepartmentById: builder.query<any, string>({
      query: (id) => `/departments/${id}`,
    }),

    createDepartment: builder.mutation<any, {}>({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
    }),

    updateDepartment: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    deleteDepartment: builder.mutation<any, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentServices;