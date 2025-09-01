import { api } from './api';



export interface Activity {
    activity: string;
    startTime: string;
    endTime: string;
    description: string;
    status: "Pending" | "Ongoing" | "Completed";
}

export interface EODReport {
    _id?: string;
    employeeName: string;
    position: string;
    department: string;
    date: string;          // yyyy-mm-dd
    activities: Activity[];
    plans: string;
    issues: string;
    comments: string;
    createdAt?: string;    // from backend
    updatedAt?: string;    // from backend
}


export const eodReportServices = api.injectEndpoints({
    endpoints: (builder) => ({
        // Create a new EOD report
        createEODReport: builder.mutation<any, Partial<EODReport>>({
            query: (data) => ({
                url: '/eod-reports',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['EODReport', { type: 'EODReport', id: 'LIST' }],
        }),

        // Get all reports (with pagination, filters)
        getAllEODReports: builder.query<any, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) =>
                `/eod-reports?page=${page}&limit=${limit}`,
            providesTags: (result) =>
                result
                    ? [
                        ...(result.data?.map(({ _id }: any) => ({ type: 'EODReport' as const, id: _id })) ?? []),
                        { type: 'EODReport', id: 'LIST' },
                    ]
                    : [{ type: 'EODReport', id: 'LIST' }],
        }),

        // ➡️ Get reports for a specific employee
        getEmployeeEODReports: builder.query<any, { employeeId: string }>({
            query: ({ employeeId }) => `/eod-reports/${employeeId}`,
            providesTags: (result, error, { employeeId }) => [
                { type: 'EODReport', id: `employee-${employeeId}` },
                { type: 'EODReport', id: 'LIST' },
            ],
        }),

        // Get a single report by ID
        getEODReportById: builder.query<any, string>({
            query: (id) => `/eod-reports/${id}`,
            providesTags: (result, error, id) => [{ type: 'EODReport', id }],
        }),

        // Update a report
        updateEODReport: builder.mutation<any, { id: string; data: Partial<EODReport> }>({
            query: ({ id, data }) => ({
                url: `/eod-reports/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'EODReport', id },
                { type: 'EODReport', id: 'LIST' },
            ],
        }),

        // Delete a report
        deleteEODReport: builder.mutation<any, string>({
            query: (id) => ({
                url: `/eod-reports/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'EODReport', id },
                { type: 'EODReport', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useCreateEODReportMutation,
    useGetEmployeeEODReportsQuery,
    useGetAllEODReportsQuery,
    useGetEODReportByIdQuery,
    useUpdateEODReportMutation,
    useDeleteEODReportMutation,
} = eodReportServices;
