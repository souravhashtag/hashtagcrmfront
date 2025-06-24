import React, { useState, useEffect } from 'react';
import {
  useGetRolesQuery,
  useDeleteRoleMutation
} from '../../../services/roleServices';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useGetRolesQuery(
    { page: currentPage, limit, search },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const [deleteRole] = useDeleteRoleMutation();

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
    if (window.confirm(`Are you sure you want to delete the role "${name}"?`)) {
      try {
        await deleteRole(id).unwrap();
        refetch();
      } catch (err) {
        alert('Failed to delete role');
      }
    }
  };

  useEffect(() => {
    refetch();
  }, [currentPage, search]);

  const roles = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
        <button
          className="flex items-center gap-2 bg-[#05445E] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={() => navigate('/role/create')}
        >
          <Plus size={18} /> Create Role
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search roles by name, display name, or description"
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
        <p className="text-center text-gray-500">Loading roles...</p>
      ) : roles.length === 0 ? (
        <p className="text-center text-gray-500">No roles found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y bg-[#129990] uppercase text-[#FFF]">
            <thead className="bg-[#129990] text-[#FFF]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold  text-[#FFF] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold  text-[#FFF] uppercase tracking-wider">Display Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold  text-[#FFF] uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-bold  text-[#FFF] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role: any) => (
                <tr key={role._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{role.display_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{role.description || '-'}</td>
                  <td>
                        <h4 className="text-sm font-medium text-gray-700">
                          Selected Menus ({role.menulist.length})
                        </h4>
                        {role?.menulist?.length === 0 ? (
                          <>
                            No menus assigned to this role yet.
                          </>
                        ) : (<>
                                {role.menulist.map((menuItem:any, index:String) => (
                                  <>
                                      {menuItem?.name},    
                                  </>                            
                                ))}
                              </>
                            )}
                         
                        
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => navigate(`/role/edit/${role._id}`)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(role._id, role.name)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition"
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
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_records} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleList;
