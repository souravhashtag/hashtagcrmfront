import { api } from './api';

export interface LeaveType {
  _id: string;
  name: string;
  leaveCount: number;
  ispaidLeave: boolean;
  carryforward: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveTypeFormData {
  name: string;
  leaveCount: number;
  ispaidLeave: boolean;
  carryforward: boolean;
}

export interface LeaveTypesResponse {
  success: boolean;
  data: LeaveType[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string;
    isPaid: boolean | null;
    sortBy: string;
    sortOrder: string;
  };
  statistics: {
    total: number;
    paidLeaveTypes: number;
    unpaidLeaveTypes: number;
    averageLeaveCount: number;
  };
}

export interface LeaveTypeResponse {
  success: boolean;
  data: LeaveType;
  message?: string;
}

export interface DeleteLeaveTypeResponse {
  success: boolean;
  message: string;
  data: {
    deletedLeaveType: string;
  };
}

export interface ActiveLeaveTypesResponse {
  success: boolean;
  data: {
    leaveTypes: Array<{
      id: string;
      name: string;
      displayName: string;
      leaveCount: number;
      isPaid: boolean;
      carryforward: boolean;
      color: string;
    }>;
  };
}

export const leaveTypesServices = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all leave types with filters and pagination
    getLeaveTypes: builder.query<LeaveTypesResponse, {
      page?: number;
      limit?: number;
      search?: string;
      isPaid?: string;
      sortBy?: string;
      sortOrder?: string;
    }>({
      query: ({ 
        page = 1, 
        limit = 10, 
        search = '', 
        isPaid = '', 
        sortBy = 'name', 
        sortOrder = 'asc' 
      }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
          ...(search && { search }),
          ...(isPaid && { isPaid })
        });
        return `/leave/type?${params.toString()}`;
      },
      providesTags: (result, error, args) => [
        'Leave', // Invalidate all Leave cache
        { type: 'Leave', id: 'TYPE_LIST' },
        ...(result?.data || []).map(({ _id }) => ({ type: 'Leave' as const, id: _id })),
      ],
    }),

    // Get leave type by ID
    getLeaveTypeById: builder.query<LeaveTypeResponse, string>({
      query: (id) => `/leave/type/${id}`,
      providesTags: (result, error, id) => [{ type: 'Leave', id }],
    }),

    // Create new leave type
    createLeaveType: builder.mutation<LeaveTypeResponse, LeaveTypeFormData>({
      query: (body) => ({
        url: '/leave/type',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Leave', // Invalidate ALL Leave cache
        { type: 'Leave', id: 'TYPE_LIST' },
        { type: 'Leave', id: 'ACTIVE_TYPES' }
      ],
    }),

    // Update leave type
    updateLeaveType: builder.mutation<LeaveTypeResponse, { 
      id: string; 
      data: Partial<LeaveTypeFormData> 
    }>({
      query: ({ id, data }) => ({
        url: `/leave/type/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        'Leave', // Invalidate ALL Leave cache
        { type: 'Leave', id },
        { type: 'Leave', id: 'TYPE_LIST' },
        { type: 'Leave', id: 'ACTIVE_TYPES' }
      ],
    }),

    // Delete leave type
    deleteLeaveType: builder.mutation<DeleteLeaveTypeResponse, string>({
      query: (id) => ({
        url: `/leave/type/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        'Leave', // Invalidate ALL Leave cache
        { type: 'Leave', id },
        { type: 'Leave', id: 'TYPE_LIST' },
        { type: 'Leave', id: 'ACTIVE_TYPES' }
      ],
    }),

    // Get active leave types (simplified for dropdowns)
    getActiveLeaveTypes: builder.query<ActiveLeaveTypesResponse, void>({
      query: () => '/leave/type/active',
      providesTags: [{ type: 'Leave', id: 'ACTIVE_TYPES' }],
    }),

    // Bulk operations for leave types (if needed)
    bulkUpdateLeaveTypes: builder.mutation<
      { success: boolean; message: string; updatedCount: number },
      {
        ids: string[];
        operation: 'activate' | 'deactivate' | 'delete';
        data?: Partial<LeaveTypeFormData>;
      }
    >({
      query: ({ ids, operation, data }) => ({
        url: '/leave/type/bulk',
        method: 'PATCH',
        body: { ids, operation, data },
      }),
      invalidatesTags: [{ type: 'Leave', id: 'TYPE_LIST' }],
    }),
  }),
});

export const {
  useGetLeaveTypesQuery,
  useGetLeaveTypeByIdQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useGetActiveLeaveTypesQuery,
  useBulkUpdateLeaveTypesMutation,
} = leaveTypesServices;