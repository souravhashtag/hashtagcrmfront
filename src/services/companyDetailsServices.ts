import { api } from './api';

export interface CompanyData {
    _id?: string;
    name: string;
    domain: string;
    logo: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        countryCode: string,
        stateKey: string;
    };
    contactInfo: {
        phone: string;
        email: string;
        website: string;
    };
    ceo: {
        userId: string;
        signature: string;
        bio: string;
        profileImage: string;
    };
    settings: {
        ceoTalk: {
            Message: string;
        };
        recipients: {
            to: Array<{
                _id?: string;
                id: string;
                email: string;
                name: string;
            }>;
            cc: Array<{
                _id?: string;
                id: string;
                email: string;
                name: string;
            }>;
            bcc: Array<{
                _id?: string;
                id: string;
                email: string;
                name: string;
            }>;
        };
        sender: {
            userId: string;
            email: string;
            name: string;
        };
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CompanyFormData {
    name?: string;
    domain?: string;
    logo?: string;
    address?: Partial<CompanyData['address']>;
    contactInfo?: Partial<CompanyData['contactInfo']>;
    ceo?: Partial<CompanyData['ceo']>;
    settings?: Partial<CompanyData['settings']>;
}

export interface RecipientData {
    id?: string;
    email: string;
    name: string;
}

export interface AddRecipientData {
    type: 'to' | 'cc' | 'bcc';
    recipientData: RecipientData;
}

export interface RemoveRecipientData {
    type: 'to' | 'cc' | 'bcc';
}

export interface SenderData {
    userId: string;
    email: string;
    name: string;
}

export interface LeaveAllocationData {
    leaveType: string;
    allocation: number;
}

export interface CompanyStats {
    basic: {
        name: string;
        domain: string;
        createdAt: string;
        lastUpdated: string;
    };
    contact: {
        hasPhone: boolean;
        hasEmail: boolean;
        hasWebsite: boolean;
        hasCompleteAddress: boolean;
    };
    settings: {
        hasCeoTalkMessage: boolean;
        recipientCounts: {
            to: number;
            cc: number;
            bcc: number;
        };
        hasSender: boolean;
    };
    metrics: {
        employeeCount: number;
        departmentCount: number;
        designationCount: number;
        profileCompleteness: number;
    };
    leaveAllocations: {
        casual: number;
        medical: number;
        paid: number;
    };
}

export interface CompanyExistsResponse {
    exists: boolean;
    data: {
        name: string;
        domain: string;
    } | null;
}

export const companyServices = api.injectEndpoints({
    endpoints: (builder) => ({

        // Get company details
        getCompanyDetails: builder.query<{ success: boolean; data: CompanyData }, void>({
            query: () => '/company',
            providesTags: ['Company'],
        }),

        // Get company details
        getCompanyPartOfSalary: builder.query<{ success: any; data:any }, void>({
            query: () => '/company/payroll/components',
            providesTags: ['Company'],
        }),

        // Initialize company (first-time setup)
        initializeCompany: builder.mutation<{ success: boolean; data: CompanyData; message: string }, CompanyFormData>({
            query: (body) => ({
                url: '/company/initialize',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Update company information
        updateCompanyInfo: builder.mutation<{ success: boolean; data: CompanyData; message: string }, CompanyFormData>({
            query: (body) => ({
                url: '/company',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Update CEO Talk message
        updateCeoTalkMessage: builder.mutation<{ success: boolean; data: { ceoTalkMessage: string }; message: string }, { message: string }>({
            query: (body) => ({
                url: '/company/ceo-talk',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Add recipient
        addRecipient: builder.mutation<{ success: boolean; data: CompanyData['settings']['recipients']; message: string }, AddRecipientData>({
            query: (body) => ({
                url: '/company/recipients',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Remove recipient
        removeRecipient: builder.mutation<{ success: boolean; data: CompanyData['settings']['recipients']; message: string }, { recipientId: string } & RemoveRecipientData>({
            query: ({ recipientId, type }) => ({
                url: `/company/recipients/${recipientId}`,
                method: 'DELETE',
                body: { type },
            }),
            invalidatesTags: ['Company'],
        }),

        // Update sender information
        updateSender: builder.mutation<{ success: boolean; data: SenderData; message: string }, SenderData>({
            query: (body) => ({
                url: '/company/sender',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Update company address
        updateAddress: builder.mutation<{ success: boolean; data: CompanyData['address']; message: string }, CompanyData['address']>({
            query: (body) => ({
                url: '/company/address',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Update contact information
        updateContactInfo: builder.mutation<{ success: boolean; data: CompanyData['contactInfo']; message: string }, CompanyData['contactInfo']>({
            query: (body) => ({
                url: '/company/contact',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Get leave allocation for specific type
        getLeaveAllocation: builder.query<{ success: boolean; data: { leaveType: string; allocation: number } }, { leaveType: string }>({
            query: ({ leaveType }) => `/company/leave-allocation?leaveType=${leaveType}`,
            providesTags: ['Company'],
        }),

        // Get all leave allocations
        getAllLeaveAllocations: builder.query<{ success: boolean; data: Record<string, number> }, void>({
            query: () => '/company/leave-allocations',
            providesTags: ['Company'],
        }),

        // Update leave allocation
        updateLeaveAllocation: builder.mutation<{ success: boolean; data: { leaveType: string; allocation: number }; message: string }, LeaveAllocationData>({
            query: (body) => ({
                url: '/company/leave-allocation',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Company'],
        }),

        // Get company statistics
        getCompanyStats: builder.query<{ success: boolean; data: CompanyStats }, void>({
            query: () => '/company/stats',
            providesTags: ['Company'],
        }),

        // Check if company exists
        checkCompanyExists: builder.query<{ success: boolean } & CompanyExistsResponse, void>({
            query: () => '/company/exists',
        }),

    }),
});

export const {
    useGetCompanyDetailsQuery,
    useGetCompanyPartOfSalaryQuery,
    useInitializeCompanyMutation,
    useUpdateCompanyInfoMutation,
    useUpdateCeoTalkMessageMutation,
    useAddRecipientMutation,
    useRemoveRecipientMutation,
    useUpdateSenderMutation,
    useUpdateAddressMutation,
    useUpdateContactInfoMutation,
    useGetLeaveAllocationQuery,
    useGetAllLeaveAllocationsQuery,
    useUpdateLeaveAllocationMutation,
    useGetCompanyStatsQuery,
    useCheckCompanyExistsQuery,
    useLazyGetCompanyDetailsQuery,
    useLazyGetLeaveAllocationQuery,
    useLazyGetAllLeaveAllocationsQuery,
    useLazyGetCompanyStatsQuery,
    useLazyCheckCompanyExistsQuery,
} = companyServices;