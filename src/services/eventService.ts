import { api } from './api';

export const eventServices = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get events map for specific month (your array structure)
    getEventsMap: builder.query<any, {
      year: number;
      month: number;
    }>({
      query: ({ year, month }) => `/events/${year}/${month}`,
      providesTags: (result, error, { year, month }) => [
        { type: 'Event' as const, id: `map-${year}-${month}` },
        { type: 'Event' as const, id: 'LIST' },
      ],
    }),

    // Get current month events map
    getCurrentMonthEventsMap: builder.query<any, string>({
      query: (userId) => `/events/${userId}/current`,
      providesTags: (result, error, userId) => [
        { type: 'Event' as const, id: `current-${userId}` },
        { type: 'Event' as const, id: 'LIST' },
      ],
    }),

    // Get events for date range
    getEventsForDateRange: builder.query<any, {
      userId: string;
      startDate: string;
      endDate: string;
    }>({
      query: ({ userId, startDate, endDate }) => {
        const params = new URLSearchParams({
          startDate,
          endDate,
        });
        return `/events/${userId}/range?${params.toString()}`;
      },
      providesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: `range-${userId}` },
        'Event' as const,
      ],
    }),

    // Get all events for a user
    getAllUserEvents: builder.query<any, {
      userId: string;
      page?: number;
      limit?: number;
      status?: string;
    }>({
      query: ({ userId, page = 1, limit = 10, status = 'all' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          status,
        });
        return `/events/user/${userId}?${params.toString()}`;
      },
      providesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: `user-${userId}` },
        { type: 'Event' as const, id: 'LIST' },
        'Event' as const,
      ],
    }),

    // Get single event by ID
    getEventById: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}`,
      providesTags: (result, error, eventId) => [
        { type: 'Event' as const, id: eventId },
      ],
    }),

    // Get events count for month
    getEventsCount: builder.query<any, {
      userId: string;
      year: number;
      month: number;
    }>({
      query: ({ userId, year, month }) => `/events/${userId}/${year}/${month}/count`,
      providesTags: (result, error, { userId, year, month }) => [
        { type: 'Event' as const, id: `count-${userId}-${year}-${month}` },
      ],
    }),

    // Create new event
    createEvent: builder.mutation<any, {
      event_date: string;
      event_description: string;
      event_type: string;
      userId: string;
    }>({
      query: (newEvent) => ({
        url: '/events',
        method: 'POST',
        body: newEvent,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: 'LIST' },
        { type: 'Event' as const, id: `current-${userId}` },
        { type: 'Event' as const, id: `user-${userId}` },
        'Event' as const,
      ],
    }),

    // Update event
    updateEvent: builder.mutation<any, {
      _id: string;
      event_date?: string;
      event_description?: string;
      event_type?: string;
      userId?: string;
    }>({
      query: ({ _id, ...updateData }) => ({
        url: `/events/${_id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { _id, userId }) => [
        { type: 'Event' as const, id: _id },
        { type: 'Event' as const, id: 'LIST' },
        ...(userId ? [
          { type: 'Event' as const, id: `current-${userId}` },
          { type: 'Event' as const, id: `user-${userId}` },
        ] : []),
        'Event' as const,
      ],
    }),

    // Delete event
    deleteEvent: builder.mutation<any, {
      eventId: string;
      userId: string;
    }>({
      query: ({ eventId }) => ({
        url: `/events/${eventId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { eventId, userId }) => [
        { type: 'Event' as const, id: eventId },
        { type: 'Event' as const, id: 'LIST' },
        { type: 'Event' as const, id: `current-${userId}` },
        { type: 'Event' as const, id: `user-${userId}` },
        'Event' as const,
      ],
    }),

    // Bulk create events
    bulkCreateEvents: builder.mutation<any, {
      events: Array<{
        event_date: string;
        event_description: string;
        event_type: string;
        userId: string;
      }>;
    }>({
      query: ({ events }) => ({
        url: '/events/bulk',
        method: 'POST',
        body: { events },
      }),
      invalidatesTags: (result, error, { events }) => {
        const userId = events[0]?.userId;
        return [
          { type: 'Event' as const, id: 'LIST' },
          ...(userId ? [
            { type: 'Event' as const, id: `current-${userId}` },
            { type: 'Event' as const, id: `user-${userId}` },
          ] : []),
          'Event' as const,
        ];
      },
    }),

    // Bulk update events
    bulkUpdateEvents: builder.mutation<any, {
      updates: Array<{
        _id: string;
        event_date?: string;
        event_description?: string;
        event_type?: string;
      }>;
      userId: string;
    }>({
      query: ({ updates, userId }) => ({
        url: '/events/bulk-update',
        method: 'PUT',
        body: { updates, userId },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: 'LIST' },
        { type: 'Event' as const, id: `current-${userId}` },
        { type: 'Event' as const, id: `user-${userId}` },
        'Event' as const,
      ],
    }),

    // Bulk delete events
    bulkDeleteEvents: builder.mutation<any, {
      eventIds: string[];
      userId: string;
    }>({
      query: ({ eventIds, userId }) => ({
        url: '/events/bulk-delete',
        method: 'DELETE',
        body: { eventIds, userId },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: 'LIST' },
        { type: 'Event' as const, id: `current-${userId}` },
        { type: 'Event' as const, id: `user-${userId}` },
        'Event' as const,
      ],
    }),

    // Search events
    searchEvents: builder.query<any, {
      userId: string;
      search?: string;
      event_type?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ userId, search = '', event_type = '', page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          search: encodeURIComponent(search),
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (event_type) params.append('event_type', event_type);
        
        return `/events/search/${userId}?${params.toString()}`;
      },
      providesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: `search-${userId}` },
        'Event' as const,
      ],
    }),

    // Get events by type
    getEventsByType: builder.query<any, {
      userId: string;
      event_type: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ userId, event_type, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return `/events/${userId}/type/${event_type}?${params.toString()}`;
      },
      providesTags: (result, error, { userId, event_type }) => [
        { type: 'Event' as const, id: `type-${userId}-${event_type}` },
        'Event' as const,
      ],
    }),

    // Get events statistics/overview
    getEventsOverview: builder.query<any, {
      userId: string;
      year?: number;
      month?: number;
    }>({
      query: ({ userId, year, month }) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());
        
        return `/events/${userId}/overview?${params.toString()}`;
      },
      providesTags: (result, error, { userId, year, month }) => [
        { type: 'Event' as const, id: `overview-${userId}-${year}-${month}` },
        'Event' as const,
      ],
    }),

    // Export events
    exportEvents: builder.query<any, {
      userId: string;
      format?: 'csv' | 'json' | 'pdf';
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ userId, format = 'csv', startDate, endDate }) => {
        const params = new URLSearchParams({
          format,
        });
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        return `/events/${userId}/export?${params.toString()}`;
      },
    }),

    // Import events
    importEvents: builder.mutation<any, {
      userId: string;
      file: File;
      format?: 'csv' | 'json';
    }>({
      query: ({ userId, file, format = 'csv' }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);
        
        return {
          url: `/events/${userId}/import`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Event' as const, id: 'LIST' },
        { type: 'Event' as const, id: `current-${userId}` },
        { type: 'Event' as const, id: `user-${userId}` },
        'Event' as const,
      ],
    }),
  }),
});

export const {
  // Event queries
  useGetEventsMapQuery,
  useGetCurrentMonthEventsMapQuery,
  useGetEventsForDateRangeQuery,
  useGetAllUserEventsQuery,
  useGetEventByIdQuery,
  useGetEventsCountQuery,
  useSearchEventsQuery,
  useGetEventsByTypeQuery,
  useGetEventsOverviewQuery,
  useExportEventsQuery,

  // Event mutations
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useBulkCreateEventsMutation,
  useBulkUpdateEventsMutation,
  useBulkDeleteEventsMutation,
  useImportEventsMutation,

  // Lazy queries
  useLazyGetEventsMapQuery,
  useLazyGetEventsForDateRangeQuery,
  useLazySearchEventsQuery,
  useLazyExportEventsQuery,
} = eventServices;