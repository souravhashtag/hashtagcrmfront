import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetMyLeavesQuery,
  useDeleteLeaveMutation
} from '../../../services/leaveServices';
import LeaveApplyModal from './LeaveApplyModal';

const Leave: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editLeaveId, setEditLeaveId] = useState<string | undefined>(undefined);

  const itemsPerPage = 10;

  // Query parameters
  const myLeavesParams = {
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter
  };

  const {
    data: leavesData,
    isLoading,
    error,
    refetch
  } = useGetMyLeavesQuery(myLeavesParams);

  const [deleteLeave] = useDeleteLeaveMutation();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredLeaves = (leavesData?.data ?? []).filter((leave: any) => {
    const term = searchTerm.toLowerCase();

    return (
      (leave.type || '').toLowerCase().includes(term) ||
      (leave.status || '').toLowerCase().includes(term) ||
      (leave.reason || '').toLowerCase().includes(term) ||
      leave.startDate.toLowerCase().includes(term) ||
      leave.endDate.toLowerCase().includes(term) ||
      (leave.totalDays?.toString() || '').includes(term)
    );
  });

  const handleDelete = async (leaveId: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await deleteLeave(leaveId).unwrap();
        refetch();
      } catch (error) {
        console.error('Error deleting leave:', error);
      }
    }
  };

  const handleApplyLeave = () => {
    setEditLeaveId(undefined);
    setShowApplyModal(true);
  };

  const handleEditLeave = (leaveId: string) => {
    setEditLeaveId(leaveId);
    setShowApplyModal(true);
  };

  const handleCloseApplyModal = () => {
    setShowApplyModal(false);
    setEditLeaveId(undefined);
  };

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    setEditLeaveId(undefined);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    if (!status) return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full border bg-gray-100 text-gray-800 border-gray-300">
        Unknown
      </span>
    );

    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (!type) return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Unknown
      </span>
    );

    const styles = {
      casual: 'bg-blue-100 text-blue-800',
      medical: 'bg-red-100 text-red-800',
      annual: 'bg-green-100 text-green-800',
      maternity: 'bg-purple-100 text-purple-800',
      paternity: 'bg-indigo-100 text-indigo-800',
      unpaid: 'bg-gray-100 text-gray-800',
      other: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles] || styles.other}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const pagination = leavesData?.pagination;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading leaves. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-fit">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Leave Requests
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage your leave requests
            </p>
          </div>
          <button
            onClick={handleApplyLeave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your leaves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Quick Stats */}
            <div className="flex items-center justify-center bg-blue-50 rounded-lg px-4 py-2">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900">{filteredLeaves.length}</div>
                <div className="text-xs text-blue-600">Total Requests</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No leave requests found</p>
                    <p className="text-sm">
                      You haven't submitted any leave requests yet.
                    </p>
                    <button
                      onClick={handleApplyLeave}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply for your first leave
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave: any) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(leave.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(leave.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{leave.totalDays || 0}</span>
                        {leave.totalDays === 0.5 && (
                          <span className="text-xs text-gray-500">(Half Day)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {leave.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.createdAt ? formatDate(leave.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => navigate(`/leave/view/${leave._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button - Only for pending requests */}
                        {leave.status === 'pending' && (
                          <button
                            onClick={() => handleEditLeave(leave._id)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button - Only for pending requests */}
                        {leave.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(leave._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, pagination.totalItems)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalItems}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                    const pageNum = Math.max(1, Math.min(currentPage - 2 + index, pagination.totalPages - 4 + index));
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Balance Card */}
      {/* <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Need to Apply for Leave?</h3>
            <p className="text-blue-700 text-sm">
              Submit your leave request quickly and track its status in real-time.
            </p>
          </div>
          <button
            onClick={handleApplyLeave}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Now
          </button>
        </div>
      </div> */}

      {/* Leave Apply Modal */}
      <LeaveApplyModal
        isOpen={showApplyModal}
        onClose={handleCloseApplyModal}
        editLeaveId={editLeaveId}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
};

export default Leave;