import { api } from './api';

export interface Member {
  _id: string;
  id?: number;
  name: string;
  position: string;
  date: string;
  joinDate?: string;
  email?: string;
  department?: string;
  image: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface NewMembersResponse {
  success: boolean;
  data: Member[];
  total?: number;
  month?: string;
  year?: string;
  message?: string;
}

export interface NewMembersQueryParams {
  year: string;
  month: string;
  limit?: number;
  department?: string;
}

export const newMembersServices = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get new members by year and month
    getNewMembers: builder.query<NewMembersResponse, NewMembersQueryParams>({
      query: ({ year, month, limit = 10, department = '' }) => {
        let url = `/employee/new-members/${year}/${month}?limit=${limit}`;
        if (department) url += `&department=${encodeURIComponent(department)}`;
        return url;
      },
      providesTags: ['Employee'],
    }),

    // Get new members for current month
    getCurrentMonthNewMembers: builder.query<NewMembersResponse, { limit?: number; department?: string }>({
      query: ({ limit = 5, department = '' } = {}) => {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        
        let url = `/employee/new-members/${year}/${month}?limit=${limit}`;
        if (department) url += `&department=${encodeURIComponent(department)}`;
        return url;
      },
      providesTags: ['Employee'],
    }),

    // Get new members for specific year (all months)
    getNewMembersByYear: builder.query<NewMembersResponse, { 
      year: string; 
      limit?: number; 
      department?: string;
    }>({
      query: ({ year, limit = 50, department = '' }) => {
        let url = `/employee/new-members/${year}?limit=${limit}`;
        if (department) url += `&department=${encodeURIComponent(department)}`;
        return url;
      },
      providesTags: ['Employee'],
    }),

    // Get new members statistics by year
    getNewMembersStats: builder.query<{
      total: number;
      byMonth: Record<string, number>;
      departments: Record<string, number>;
      monthlyTrend: Array<{ month: string; count: number }>;
    }, { year: string }>({
      query: ({ year }) => `/employee/new-members/${year}/stats`,
      providesTags: ['Employee'],
    }),

  }),
});

export const {
  useGetNewMembersQuery,
  useGetCurrentMonthNewMembersQuery,
  useGetNewMembersByYearQuery,
  useGetNewMembersStatsQuery,
  useLazyGetNewMembersQuery,
  useLazyGetCurrentMonthNewMembersQuery,
  useLazyGetNewMembersByYearQuery,
} = newMembersServices;