import React, { useState, useEffect } from 'react';
import {
  useGetDepartmentsQuery,
  useDeleteDepartmentMutation
} from '../../../services/depertmentServices';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, X, Building, Users, Calendar } from 'lucide-react';

const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useGetDepartmentsQuery(
    { page: currentPage, limit, search },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const [deleteDepartment] = useDeleteDepartmentMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    refetch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the department "${name}"?`)) {
      try {
        await deleteDepartment(id).unwrap();
        refetch();
      } catch (err) {
        alert('Failed to delete department');
      }
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    refetch();
  }, [currentPage, search]);

  const departments = data?.data || [];
  const pagination = data?.pagination;
  console.log("departments===",departments)
  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage organizational departments</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#05445E] text-white px-4 py-2 rounded-lg hover:bg-[#D4F1F4] hover:text-black transition"
          onClick={() => navigate('/department/create')}
        >
          <Plus size={18} /> Create Department
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search departments by name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 border border-[#14b8a6] rounded-lg"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </form>

      {/* Table */}
      {isLoading || isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading departments...</p>
          </div>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No departments found.</p>
          <p className="text-gray-400 text-sm">Try adjusting your search criteria or create a new department.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-[#096B68]">
            <thead className="bg-[#096B68]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black-500 uppercase tracking-wider">
                  Department Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black-500 uppercase tracking-wider">
                  Employee Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-black-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((department: any) => (
                <tr key={department._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {department.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {department._id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {department.description || (
                        <span className="text-gray-400 italic">No description provided</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {department.employeeCount || 0} employees
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {formatDate(department.createdAt)}
                      </span>
                    </div>
                    {department.updatedAt !== department.createdAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Updated: {formatDate(department.updatedAt)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => navigate(`/department/edit/${department._id}`)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition"
                        title="Edit Department"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(department._id, department.name)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition"
                        title="Delete Department"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_records} total departments)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded">
              {pagination.current_page}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;