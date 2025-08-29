import { api } from './api';

export interface PayrollDoc {
    _id: string;
    [key: string]: any;
}

export interface ListResponse {
    items: PayrollDoc[];
    total: number;
    [key: string]: any;
}

export const payrollServices = api.injectEndpoints({
    endpoints: (builder) => ({
        // List Payrolls
        getPayrolls: builder.query<ListResponse, Record<string, any>>({
            query: (params) => ({ url: 'payrolls', params }),
            providesTags: (res) =>
                res?.items
                    ? [
                        ...res.items.map((i) => ({ type: 'Payroll' as const, id: i._id })),
                        { type: 'Payroll', id: 'LIST' },
                    ]
                    : [{ type: 'Payroll', id: 'LIST' }],
        }),


        // List My Payrolls
        getMyPayrolls: builder.query<ListResponse, Record<string, any>>({
            query: (params) => ({ url: 'payrolls/my', params }),
            providesTags: (res) =>
                res?.items
                    ? [
                        ...res.items.map((i) => ({ type: 'Payroll' as const, id: i._id })),
                        { type: 'Payroll', id: 'LIST' },
                    ]
                    : [{ type: 'Payroll', id: 'LIST' }],
        }),

        // Get Payroll by ID
        getPayrollById: builder.query<PayrollDoc, string>({
            query: (id) => `payrolls/${id}`,
            transformResponse: (res: any) => res?.data ?? res,
            providesTags: (_res, _err, id) => [{ type: 'Payroll', id }],
        }),

        // Create Payroll
        createPayroll: builder.mutation<PayrollDoc, Partial<PayrollDoc>>({
            query: (body) => ({
                url: 'payrolls',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
        }),

        // Update Payroll
        updatePayroll: builder.mutation<PayrollDoc, { id: string; data: Partial<PayrollDoc> }>({
            query: ({ id, data }) => ({
                url: `payrolls/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: 'Payroll', id: arg.id },
                { type: 'Payroll', id: 'LIST' },
            ],
        }),

        // Delete Payroll
        deletePayroll: builder.mutation<{ message: string }, { id: string }>({
            query: ({ id }) => ({
                url: `payrolls/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
        }),

        // Set Payment Status
        setPaymentStatus: builder.mutation<PayrollDoc, { id: string; data: Partial<PayrollDoc> }>({
            query: ({ id, data }) => ({
                url: `payrolls/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: 'Payroll', id: arg.id },
                { type: 'Payroll', id: 'LIST' },
            ],
        }),

        // Recalculate Totals
        recalcTotals: builder.mutation<PayrollDoc, string>({
            query: (id) => ({
                url: `payrolls/${id}/recalculate`,
                method: 'POST',
            }),
            invalidatesTags: (_res, _err, id) => [
                { type: 'Payroll', id },
                { type: 'Payroll', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetPayrollsQuery,
    useGetPayrollByIdQuery,
    useCreatePayrollMutation,
    useUpdatePayrollMutation,
    useDeletePayrollMutation,
    useGetMyPayrollsQuery,
    useSetPaymentStatusMutation,
    useRecalcTotalsMutation,
    useLazyGetPayrollsQuery,
    useLazyGetPayrollByIdQuery,
} = payrollServices;
