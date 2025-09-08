// components/designation/DesignationList.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetDesignationsQuery,
  useDeleteDesignationMutation,
  useToggleDesignationStatusMutation,
  useBulkDesignationOperationMutation,
} from '../../../services/designationServices';
import { useGetDepartmentsQuery } from '../../../services/depertmentServices';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Power,
  MoreVertical,
  RefreshCw,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

interface FilterState {
  search: string;
  department: string;
  status: string;
  page: number;
  limit: number;
}

const DesignationList: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: '',
    status: '',
    page: 1,
    limit: 10,
  });
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // RTK Query hooks
  const { 
    data: designationsData, 
    error, 
    isLoading,
    isFetching,
    refetch 
  } = useGetDesignationsQuery(filters);

  const { data: departmentsData } = useGetDepartmentsQuery({
    page: 1,
    limit: 100,
    search: '',
  });

  const [deleteDesignation, { isLoading: isDeleting }] = useDeleteDesignationMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleDesignationStatusMutation();
  const [bulkOperation, { isLoading: isBulkOperating }] = useBulkDesignationOperationMutation();

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }) // Reset page when other filters change
    }));
  };

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (filters.search !== '') {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  // Handle item selection
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === designationsData?.data?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(designationsData?.data?.map((item: any) => item._id) || []);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, permanent = false) => {
    try {
      await deleteDesignation({ id, permanent }).unwrap();
      setDeleteConfirm(null);
      setSelectedItems(prev => prev.filter(item => item !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id).unwrap();
    } catch (error) {
      console.error('Status toggle failed:', error);
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: string) => {
    if (selectedItems.length === 0) return;

    try {
      await bulkOperation({
        operation: operation as any,
        ids: selectedItems,
      }).unwrap();
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      status: '',
      page: 1,
      limit: 10,
    });
  };

  // Get active departments for filter
  const activeDepartments = departmentsData?.data?.filter((dept: any) => dept.status === 'active') || [];

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const designations = designationsData?.data || [];
  const pagination = designationsData?.pagination;

  return (
    <div className="p-6 bg-gray-50 min-h-fit rounded-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Designations</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage job designations and positions
          </p>
        </div>

      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-end">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search designations..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
          >
            <Filter size={16} />
            Filters
          </button>
                  
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <Link
            to="/designations/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#129990] text-white rounded-md hover:bg-[#1dbfb4] transition duration-200"
          >
            <Plus size={16} />
            Add Designation
          </Link>
        </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {activeDepartments.map((dept: any) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkOperation('activate')}
                disabled={isBulkOperating}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkOperation('deactivate')}
                disabled={isBulkOperating}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition duration-200"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkOperation('delete')}
                disabled={isBulkOperating}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading designations...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading designations</h3>
            <p className="text-gray-600 mb-4">
              {(error as any)?.data?.message || 'Something went wrong'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#E1F7EF]">
                <tr>
                  <th className="px-6 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === designations.length && designations.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {designations.map((designation: any) => (
                  <tr key={designation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(designation._id)}
                        onChange={() => handleSelectItem(designation._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {designation.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {designation.department?.name || (
                          <span className="text-gray-400 italic">No Department</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {designation.description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          designation.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {designation.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(designation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button */}
                        {/* <button
                          onClick={() => navigate(`/designations/${designation._id}`)}
                          className="text-blue-600 hover:text-blue-900 transition duration-200"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button> */}

                        {/* Edit Button */}
                        <button
                          onClick={() => navigate(`/designations/edit/${designation._id}`)}
                          className="text-indigo-600 hover:text-indigo-900 transition duration-200"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>

                        {/* Toggle Status Button */}
                        {/* <button
                          onClick={() => handleToggleStatus(designation._id)}
                          disabled={isToggling}
                          className={`transition duration-200 ${
                            designation.isActive
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={designation.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power size={16} />
                        </button> */}

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirm({ id: designation._id, title: designation.title })}
                          className="text-red-600 hover:text-red-900 transition duration-200"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {designations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No designations found</h3>
                  <p className="text-gray-600 mb-4">
                    {filters.search || filters.department || filters.status
                      ? 'Try adjusting your filters or search terms.'
                      : 'Get started by creating your first designation.'}
                  </p>
                  {!filters.search && !filters.department && !filters.status && (
                    <Link
                      to="/designations/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      <Plus size={16} />
                      Add Designation
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum = 0;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the designation{' '}
              <span className="font-semibold">"{deleteConfirm.title}"</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id, false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationList;