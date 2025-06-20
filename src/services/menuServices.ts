import { api } from './api';

export const menuServices = api.injectEndpoints({
  endpoints: (builder) => ({
    getMenus: builder.query<any, { 
      page?: number; 
      limit?: number; 
      search?: string;
      parent?:number
    }>({
      query: ({ page = 1, limit = 10, search = '',parent = '' }) => 
        `/menu?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&parent=${parent}`
    }),

    // Get menu by ID
    getMenuById: builder.query<any, string>({
      query: (id) => `/menu/${id}`,
    }),

    // Create menu
    createMenu: builder.mutation<any, {
      name: string;
      slug: string;
      icon?: string;
      status?: string;
      parentId?: string;
      path?: string;
      order?: number;
    }>({
      query: (body) => ({
        url: '/menu',
        method: 'POST',
        body,
      }),
    }),

    // Update menu
    updateMenu: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/menu/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    // Delete menu
    deleteMenu: builder.mutation<any, string>({
      query: (id) => ({
        url: `/menu/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetMenusQuery,
  useGetMenuByIdQuery,
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
} = menuServices;