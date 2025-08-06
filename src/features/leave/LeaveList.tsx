import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetAllLeavesQuery,
  useGetMyLeavesQuery,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveMutation
} from '../../services/leaveServices';
import { useUser } from '../dashboard/context/DashboardContext';
import LeaveApplyModal from './components/LeaveApplyModal';


const LeaveList: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editLeaveId, setEditLeaveId] = useState<string | undefined>(undefined);

  const itemsPerPage = 10;
  const isHR = user?.role?.name?.toLowerCase() === 'hr' || user?.role?.name?.toLowerCase() === 'admin';

  // Query parameters
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: statusFilter,
    type: typeFilter
  };

  const myLeavesParams = {
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter
  };

  // Always call both hooks, but skip the one not needed
  const {
    data: allLeavesData,
    isLoading: isLoadingAll,
    error: errorAll,
    refetch: refetchAll
  } = useGetAllLeavesQuery(queryParams, {
    skip: !isHR // Skip if not HR
  });

  const {
    data: myLeavesData,
    isLoading: isLoadingMy,
    error: errorMy,
    refetch: refetchMy
  } = useGetMyLeavesQuery(myLeavesParams, {
    skip: isHR // Skip if HR (they use all leaves query)
  });

  // Use the appropriate data based on user role
  const leavesData = isHR ? allLeavesData : myLeavesData;
  const isLoading = isHR ? isLoadingAll : isLoadingMy;
  const error = isHR ? errorAll : errorMy;
  const refetch = isHR ? refetchAll : refetchMy;

  const [updateLeaveStatus] = useUpdateLeaveStatusMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);


  const filteredLeaves = (leavesData?.data ?? []).filter((leave: any) => {
    const term = searchTerm.toLowerCase();

    return (
      (isHR && `${leave.employeeId?.userId?.firstName || ''} ${leave.employeeId?.userId?.lastName || ''}`.toLowerCase().includes(term)) ||
      (leave.type || '').toLowerCase().includes(term) ||
      (leave.status || '').toLowerCase().includes(term) ||
      (leave.reason || '').toLowerCase().includes(term) ||
      (leave.approvedBy ? `${leave.approvedBy.firstName || ''} ${leave.approvedBy.lastName || ''}` : '').toLowerCase().includes(term) ||
      leave.startDate.toLowerCase().includes(term) ||
      leave.endDate.toLowerCase().includes(term) ||
      (leave.totalDays?.toString() || '').includes(term)
    );
  });


  const handleStatusUpdate = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      await updateLeaveStatus({
        id: leaveId,
        status,
        ...(status === 'rejected' && { rejectionReason })
      }).unwrap();

      refetch();
      setShowStatusModal(false);
      setSelectedLeave(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

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

  const openStatusModal = (leaveId: string, action: 'approved' | 'rejected') => {
    setSelectedLeave(leaveId);
    setActionType(action);
    setShowStatusModal(true);
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

  const leaves = leavesData?.data || [];
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isHR ? 'Leave Management' : 'My Leave Requests'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isHR ? 'Manage all employee leave requests' : 'View and manage your leave requests'}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search leaves..."
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

            {/* Type Filter */}
            {isHR && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="casual">Casual</option>
                <option value="medical">Medical</option>
              </select>
            )}

            {/* Export Button */}
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {isHR && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Employee
                  </th>
                )}
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
                {isHR && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Approver
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isHR ? 9 : 7} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No leave requests found</p>
                    <p className="text-sm">
                      {isHR
                        ? 'No employees have submitted leave requests yet.'
                        : 'You haven\'t submitted any leave requests yet.'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave: any) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    {isHR && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {leave.employeeId?.userId?.firstName || ''} {leave.employeeId?.userId?.lastName || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {leave.employeeId?.employeeId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
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
                      {leave.totalDays || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {leave.reason || 'No reason provided'}
                    </td>
                    {isHR && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.approvedBy ? (
                          `${leave.approvedBy.firstName || ''} ${leave.approvedBy.lastName || ''}`
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
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

                        {/* HR Actions */}
                        {isHR && leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openStatusModal(leave._id, 'approved')}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(leave._id, 'rejected')}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Employee Actions */}
                        {!isHR && leave.status === 'pending' && (
                          <button
                            onClick={() => handleEditLeave(leave._id)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {((!isHR && leave.status === 'pending') || isHR) && (
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

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>

              {actionType === 'rejected' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedLeave(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedLeave && handleStatusUpdate(selectedLeave, actionType)}
                  disabled={actionType === 'rejected' && !rejectionReason.trim()}
                  className={`px-4 py-2 text-white rounded-md ${actionType === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                >
                  {actionType === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default LeaveList;