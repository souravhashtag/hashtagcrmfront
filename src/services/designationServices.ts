import { api } from './api';

export interface Designation {
  _id: string;
  title: string;
  department?: {
    _id: string;
    name: string;
  };
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationFormData {
  title: string;
  department?: string;
  description?: string;
  isActive?: boolean;
}

export interface DesignationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
}

export interface BulkOperationData {
  operation: 'activate' | 'deactivate' | 'delete' | 'update';
  ids: string[];
  data?: Record<string, any>;
}

export const designationServices = api.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get all designations with filters
    getDesignations: builder.query<any, DesignationQueryParams>({
      query: ({ page = 1, limit = 10, search = '', department = '', status = '' }) => {
        let url = `/designations?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (department) url += `&department=${department}`;
        if (status !== '') url += `&status=${status}`;
        return url;
      },
    }),

    // Get designation by ID
    getDesignationById: builder.query<any, string>({
      query: (id) => `/designations/${id}`,
    }),

    // Create new designation
    createDesignation: builder.mutation<any, DesignationFormData>({
      query: (body) => ({
        url: '/designations',
        method: 'POST',
        body,
      }),
    }),

    // Update designation
    updateDesignation: builder.mutation<any, { id: string; data: Partial<DesignationFormData> }>({
      query: ({ id, data }) => ({
        url: `/designations/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    // Delete designation
    deleteDesignation: builder.mutation<any, { id: string; permanent?: boolean }>({
      query: ({ id, permanent = false }) => ({
        url: `/designations/${id}?permanent=${permanent}`,
        method: 'DELETE',
      }),
    }),

    // Toggle designation status
    toggleDesignationStatus: builder.mutation<any, string>({
      query: (id) => ({
        url: `/designations/${id}/toggle-status`,
        method: 'PATCH',
      }),
    }),

    // Bulk operations
    bulkDesignationOperation: builder.mutation<any, BulkOperationData>({
      query: (body) => ({
        url: '/designations/bulk',
        method: 'POST',
        body,
      }),
    }),

    // Get designations by department
    getDesignationsByDepartment: builder.query<any, { departmentId: string; activeOnly?: boolean }>({
      query: ({ departmentId, activeOnly = true }) => 
        `/designations/department/${departmentId}?activeOnly=${activeOnly}`,
    }),
  }),
});

export const {
  useGetDesignationsQuery,
  useGetDesignationByIdQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useToggleDesignationStatusMutation,
  useBulkDesignationOperationMutation,
  useGetDesignationsByDepartmentQuery,
  useLazyGetDesignationsQuery,
  useLazyGetDesignationByIdQuery,
} = designationServices;