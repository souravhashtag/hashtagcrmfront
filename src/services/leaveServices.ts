import { api } from './api';

export interface LeaveRequest {
  _id?: string;
  employeeId: string;
  type: 'casual' | 'medical' | 'annual' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  attachments?: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  isHalfDay?: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    _id: string;
    employeeId: string;
    userId: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  approver?: {
    firstName: string;
    lastName: string;
  };
}

export interface LeaveStats {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  casualLeaves: number;
  medicalLeaves: number;
}

export interface LeaveResponse {
  success: boolean;
  data: LeaveRequest[];
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface LeaveDetailResponse {
  success: boolean;
  data: LeaveRequest;
  message?: string;
}

export const leaveServices = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all leaves (HR view)
    getAllLeaves: builder.query<LeaveResponse, {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
      employeeId?: string;
    }>({
      query: ({ page = 1, limit = 10, search = '', status = '', type = '', employeeId = '' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(status && { status }),
          ...(type && { type }),
          ...(employeeId && { employeeId })
        });
        return `/leave?${params.toString()}`;
      },
      providesTags: ['Leave'],
    }),

    // Get employee's own leaves
    getMyLeaves: builder.query<LeaveResponse, {
      page?: number;
      limit?: number;
      status?: string;
    }>({
      query: ({ page = 1, limit = 10, status = '' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status })
        });
        return `/leave/my-leaves?${params.toString()}`;
      },
      providesTags: ['Leave'],
    }),

    // Get leave by ID
    getLeaveById: builder.query<LeaveDetailResponse, string>({
      query: (id) => `/leave/${id}`,
      providesTags: ['Leave'],
    }),

    // Create leave request
    createLeave: builder.mutation<LeaveDetailResponse, FormData>({
      query: (formData) => ({
        url: '/leave',
        method: 'POST',
        body: formData, // FormData handles multipart automatically
      }),
      invalidatesTags: ['Leave'],
    }),


    // Update leave request
    updateLeave: builder.mutation<LeaveDetailResponse, { id: string; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/leave/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Leave'],
    }),

    // Approve/Reject leave
    updateLeaveStatus: builder.mutation<LeaveDetailResponse, {
      id: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string
    }>({
      query: ({ id, status, rejectionReason }) => ({
        url: `/leave/${id}/status`,
        method: 'PATCH',
        body: {
          status,
          ...(rejectionReason && { rejectionReason })
        },
      }),
      invalidatesTags: ['Leave'],
    }),

    // Cancel leave request
    cancelLeave: builder.mutation<LeaveDetailResponse, string>({
      query: (id) => ({
        url: `/leave/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Leave'],
    }),

    // Delete leave request
    deleteLeave: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/leave/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Leave'],
    }),

    // Get leave statistics
    getLeaveStats: builder.query<{ success: boolean; data: LeaveStats }, void>({
      query: () => '/leave/stats',
      providesTags: ['Leave'],
    }),

    // Get employee leave balance
    getLeaveBalance: builder.query<{
      success: boolean;
      data: {
        casualLeaves: { total: number; used: number; remaining: number };
        medicalLeaves: { total: number; used: number; remaining: number };
        annualLeaves: { total: number; used: number; remaining: number };
      }
    }, string | void>({
      query: (employeeId) => employeeId ? `/leave/balance/${employeeId}` : '/leave/balance',
      providesTags: ['Leave'],
    }),
  }),
});

export const {
  useGetAllLeavesQuery,
  useGetMyLeavesQuery,
  useGetLeaveByIdQuery,
  useCreateLeaveMutation,
  useUpdateLeaveMutation,
  useUpdateLeaveStatusMutation,
  useCancelLeaveMutation,
  useDeleteLeaveMutation,
  useGetLeaveStatsQuery,
  useGetLeaveBalanceQuery,
} = leaveServices;