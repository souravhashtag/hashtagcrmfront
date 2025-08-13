import { api } from './api';

export const noticeServices = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllNotices: builder.query<any, {
      page?: number;
      limit?: number;
      status?: string; 
      search?: string;     
    }>({
      query: ({ 
        page = 1, 
        limit = 10, 
        status = 'published', 
        search = ''
      }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          status,
          search
        });        
        // if (userId) params.append('userId', userId);
        // console.log(`Fetching notices with params: ${params.toString()}`);
        return `/notices?${params.toString()}`;
      },
      providesTags: (result, error, params) => [
        { type: 'Notice' as const, id: 'LIST' },
        { type: 'Notice' as const, id: `list-${params.status || 'published'}` },
        'Notice' as const,
      ],
    }),

    // Get single notice by ID
    getNoticeById: builder.query<any, {
      id: string;
      userId?: string;
    }>({
      query: ({ id, userId }) => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        
        return `/notices/${id}?${params.toString()}`;
      },
      providesTags: (result, error, { id }) => [
        { type: 'Notice' as const, id },
      ],
    }),

    // Create new notice
    createNotice: builder.mutation<any, {
    //   title: string;
      content: string;
      status?: string;
    }>({
      query: (newNotice) => ({
        url: '/notices',
        method: 'POST',
        body: newNotice,
      }),
      invalidatesTags: [
        { type: 'Notice' as const, id: 'LIST' },
        'Notice' as const,
      ],
    }),

    // Update notice
    updateNotice: builder.mutation<any, {
      id: string;
      title?: string;
      content?: string;
      priority?: string;
      category?: string;
      status?: string;
      isPinned?: boolean;
      expiryDate?: string;
      targetAudience?: string[];
    }>({
      query: ({ id, ...updateData }) => ({
        url: `/notices/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notice' as const, id },
        { type: 'Notice' as const, id: 'LIST' },
        'Notice' as const,
      ],
    }),

    // Delete notice
    deleteNotice: builder.mutation<any, string>({
      query: (id) => ({
        url: `/notices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notice' as const, id },
        { type: 'Notice' as const, id: 'LIST' },
        'Notice' as const,
      ],
    }),
    getNoticeStats: builder.query<any, void>({
      query: () => '/notices/stats',
      providesTags: ['Notice' as const],
    }),
  }),
});

export const {
  // Notice queries
  useGetAllNoticesQuery,
  useGetNoticeByIdQuery,
  useGetNoticeStatsQuery,


  // Notice mutations
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,


  // Lazy queries
  useLazyGetAllNoticesQuery,
} = noticeServices;