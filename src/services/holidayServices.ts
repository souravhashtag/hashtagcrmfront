import { api } from './api';

export interface Holiday {
    _id: string;
    name: string;
    date: string;
    day?: string;
    type: 'national' | 'religious' | 'company';
    description?: string;
    isRecurring: boolean;
    appliesTo: string[];
    createdAt: string;
    updatedAt: string;
}

export interface HolidayFormData {
    name: string;
    date: string;
    type: 'national' | 'religious' | 'company';
    description?: string;
    isRecurring?: boolean;
    appliesTo?: string[];
}

export interface HolidayQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    year?: string;
    month?: string;
    includePast?: boolean;
    status?: string;
}

export interface BulkHolidayOperationData {
    operation: 'delete' | 'update' | 'duplicate';
    ids: string[];
    data?: Record<string, any>;
}

export const holidayServices = api.injectEndpoints({
    endpoints: (builder) => ({

        // Get all holidays with filters
        getHolidays: builder.query<any, HolidayQueryParams>({
            query: ({ page = 1, limit = 10, search = '', type = '', year = '', month = '', includePast = false, status = '' }) => {
                let url = `/holidays?page=${page}&limit=${limit}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (type && type !== 'all') url += `&type=${type}`;
                if (year) url += `&year=${year}`;
                if (month) url += `&month=${month}`;
                if (includePast) url += `&includePast=${includePast}`;
                if (status !== '') url += `&status=${status}`;
                return url;
            },
        }),

        // Get holiday by ID
        getHolidayById: builder.query<any, string>({
            query: (id) => `/holidays/${id}`,
        }),

        // Create new holiday
        createHoliday: builder.mutation<any, HolidayFormData>({
            query: (body) => ({
                url: '/holidays',
                method: 'POST',
                body,
            }),
        }),

        // Update holiday
        updateHoliday: builder.mutation<any, { id: string; data: Partial<HolidayFormData> }>({
            query: ({ id, data }) => ({
                url: `/holidays/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),

        // Delete holiday
        deleteHoliday: builder.mutation<any, { id: string; permanent?: boolean }>({
            query: ({ id, permanent = false }) => ({
                url: `/holidays/${id}?permanent=${permanent}`,
                method: 'DELETE',
            }),
        }),
    }),
});

export const {
    useGetHolidaysQuery,
    useGetHolidayByIdQuery,
    useCreateHolidayMutation,
    useUpdateHolidayMutation,
    useDeleteHolidayMutation,
    useLazyGetHolidaysQuery,
    useLazyGetHolidayByIdQuery,
} = holidayServices;