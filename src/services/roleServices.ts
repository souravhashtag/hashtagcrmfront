import { api } from './api';

// Add RoleHierarchy to your existing tag types in your main api.ts file
// tagTypes: ['Role', 'Menu', 'Employee', 'Permission', 'RoleHierarchy']

export const roleServices = api.injectEndpoints({
  endpoints: (builder) => ({
    // Existing endpoints with enhanced parameters
    getRoles: builder.query<any, { 
      page?: number; 
      limit?: number; 
      search?: string;
      parent_id?: string;
      level?: string;
      hierarchy?: boolean;
    }>({
      query: ({ 
        page = 1, 
        limit = 10, 
        search = '', 
        parent_id, 
        level, 
        hierarchy 
      }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: encodeURIComponent(search),
        });
        
        if (parent_id !== undefined) {
          params.append('parent_id', parent_id);
        }
        if (level !== undefined) {
          params.append('level', level);
        }
        if (hierarchy !== undefined) {
          params.append('hierarchy', hierarchy.toString());
        }
        
        return `/role/list?${params.toString()}`;
      },
      providesTags: ['Role'],
    }),

    getRoleById: builder.query<any, { 
      id: string; 
      include_children?: boolean; 
      include_ancestors?: boolean 
    }>({
      query: ({ id, include_children, include_ancestors }) => {
        const params = new URLSearchParams();
        if (include_children) params.append('include_children', 'true');
        if (include_ancestors) params.append('include_ancestors', 'true');
        
        const queryString = params.toString();
        return `/role/${id}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result, error, { id }) => [{ type: 'Role', id }],
    }),

    createRole: builder.mutation<any, {
      name: string;
      display_name?: string;
      description?: string;
      parent_id?: string;
      menulist?: any[];
    }>({
      query: (body) => ({
        url: '/role/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Role'],
    }),

    updateRole: builder.mutation<any, { 
      id: string; 
      data: {
        name?: string;
        display_name?: string;
        description?: string;
        parent_id?: string;
        menulist?: any[];
      }
    }>({
      query: ({ id, data }) => ({
        url: `/role/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Role', id },
        'Role',
      ],
    }),

    deleteRole: builder.mutation<any, { id: string; force?: boolean }>({
      query: ({ id, force }) => ({
        url: `/role/${id}${force ? '?force=true' : ''}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),

    // New parent-child relationship endpoints
    getRoleHierarchy: builder.query<any, { root_id?: string }>({
      query: ({ root_id } = {}) => {
        const params = root_id ? `?root_id=${root_id}` : '';
        return `/role/hierarchy/tree${params}`;
      },
      providesTags: ['Role'],
    }),

    getRoleChildren: builder.query<any, string>({
      query: (id) => `/role/${id}/children`,
      providesTags: (result, error, id) => [{ type: 'Role', id: `children-${id}` }],
    }),

    getRoleAncestors: builder.query<any, string>({
      query: (id) => `/role/${id}/ancestors`,
      providesTags: (result, error, id) => [{ type: 'Role', id: `ancestors-${id}` }],
    }),

    getRoleDescendants: builder.query<any, string>({
      query: (id) => `/role/${id}/descendants`,
      providesTags: (result, error, id) => [{ type: 'Role', id: `descendants-${id}` }],
    }),

    moveRole: builder.mutation<any, { id: string; new_parent_id?: string | null }>({
      query: ({ id, new_parent_id }) => ({
        url: `/role/${id}/move`,
        method: 'PUT',
        body: { new_parent_id },
      }),
      invalidatesTags: ['Role'],
    }),

    getRolesByLevel: builder.query<any, number>({
      query: (level) => `/role/level/${level}`,
      providesTags: (result, error, level) => [{ type: 'Role', id: `level-${level}` }],
    }),

    // Additional utility endpoints
    deleteMultipleRoles: builder.mutation<any, { ids: string[]; force?: boolean }>({
      query: ({ ids, force }) => ({
        url: '/role/',
        method: 'DELETE',
        body: { ids, force },
      }),
      invalidatesTags: ['Role'],
    }),

    searchRolesByName: builder.query<any, { name: string }>({
      query: ({ name }) => `/role/search?name=${encodeURIComponent(name)}`,
      providesTags: ['Role'],
    }),

    validateRoleHierarchy: builder.query<any, { childId: string; parentId?: string }>({
      query: ({ childId, parentId }) => {
        const params = new URLSearchParams({ childId });
        if (parentId) params.append('parentId', parentId);
        return `/role/validate-hierarchy?${params.toString()}`;
      },
    }),

    getRolePermissions: builder.query<any, string>({
      query: (id) => `/role/${id}/permissions`,
      providesTags: (result, error, id) => [{ type: 'Role', id: `permissions-${id}` }],
    }),

    bulkUpdateRoles: builder.mutation<any, { 
      ids: string[]; 
      data: {
        name?: string;
        display_name?: string;
        description?: string;
        parent_id?: string;
        is_active?: boolean;
      }
    }>({
      query: ({ ids, data }) => ({
        url: '/role/bulk-update',
        method: 'PUT',
        body: { ids, data },
      }),
      invalidatesTags: ['Role'],
    }),

    duplicateRole: builder.mutation<any, { 
      id: string; 
      newName: string; 
      newDisplayName?: string 
    }>({
      query: ({ id, newName, newDisplayName }) => ({
        url: `/role/${id}/duplicate`,
        method: 'POST',
        body: { newName, newDisplayName },
      }),
      invalidatesTags: ['Role'],
    }),

    exportRoles: builder.query<Blob, { 
      format: 'json' | 'csv'; 
      includeHierarchy?: boolean 
    }>({
      query: ({ format, includeHierarchy }) => {
        const params = new URLSearchParams({ format });
        if (includeHierarchy) params.append('includeHierarchy', 'true');
        return {
          url: `/role/export?${params.toString()}`,
          responseHandler: (response: Response) => response.blob(),
        };
      },
    }),

    importRoles: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/role/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Role'],
    }),

    getRoleStats: builder.query<any, void>({
      query: () => '/role/stats',
    }),

    // Role assignment helpers (if you have user management)
    assignRoleToUser: builder.mutation<any, { roleId: string; userId: string }>({
      query: ({ roleId, userId }) => ({
        url: `/role/${roleId}/assign`,
        method: 'POST',
        body: { userId },
      }),
    }),

    unassignRoleFromUser: builder.mutation<any, { roleId: string; userId: string }>({
      query: ({ roleId, userId }) => ({
        url: `/role/${roleId}/unassign`,
        method: 'POST',
        body: { userId },
      }),
    }),

    getRoleUsers: builder.query<any, string>({
      query: (roleId) => `/role/${roleId}/users`,
      providesTags: (result, error, roleId) => [{ type: 'Role', id: `users-${roleId}` }],
    }),
  }),
});

// Export all hooks for usage in functional components
export const {
  // Original hooks (enhanced)
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,

  // New hierarchy hooks
  useGetRoleHierarchyQuery,
  useGetRoleChildrenQuery,
  useGetRoleAncestorsQuery,
  useGetRoleDescendantsQuery,
  useMoveRoleMutation,
  useGetRolesByLevelQuery,

  // Additional utility hooks
  useDeleteMultipleRolesMutation,
  useSearchRolesByNameQuery,
  useValidateRoleHierarchyQuery,
  useGetRolePermissionsQuery,
  useBulkUpdateRolesMutation,
  useDuplicateRoleMutation,
  useExportRolesQuery,
  useImportRolesMutation,
  useGetRoleStatsQuery,

  // User assignment hooks (optional)
  useAssignRoleToUserMutation,
  useUnassignRoleFromUserMutation,
  useGetRoleUsersQuery,
} = roleServices;