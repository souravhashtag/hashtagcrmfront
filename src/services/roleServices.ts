

import { api } from './api';

export const roleServices = api.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => 
        `/role/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    }),

    getRoleById: builder.query<any, string>({
      query: (id) => `/role/${id}`,
    }),

    createRole: builder.mutation<any, {}>({
      query: (body) => ({
        url: '/role/',
        method: 'POST',
        body,
      }),
    }),

    updateRole: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/role/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    deleteRole: builder.mutation<any, string>({
      query: (id) => ({
        url: `/role/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleServices;

