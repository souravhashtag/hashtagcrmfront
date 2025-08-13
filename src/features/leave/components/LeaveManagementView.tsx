import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Check,
  X,
  Calendar,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetAllLeavesQuery,
  useDeleteLeaveMutation,
  useUpdateLeaveStatusMutation
} from '../../../services/leaveServices';
import * as XLSX from 'xlsx';
import { useUser } from '../../dashboard/context/DashboardContext';

const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');
  const [downloadScope, setDownloadScope] = useState<'current' | 'all'>('current');
  const { user } = useUser();

  const itemsPerPage = 10;

  // Query parameters for current page
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: statusFilter,
    type: typeFilter
  };

  // Query parameters for all data
  const allDataQueryParams = {
    page: 1,
    limit: 1000, // Large number to fetch all data
    search: searchTerm,
    status: statusFilter,
    type: typeFilter
  };

  const {
    data: leavesData,
    isLoading,
    error,
    refetch
  } = useGetAllLeavesQuery(queryParams);

  const {
    data: allLeavesData,
    refetch: refetchAll
  } = useGetAllLeavesQuery(allDataQueryParams, {
    skip: downloadScope !== 'all' 
  });

  const [updateLeaveStatus] = useUpdateLeaveStatusMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const filteredLeaves = (leavesData?.data ?? []).filter((leave: any) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    const employeeName = `${leave.employeeId?.userId?.firstName || ''} ${leave.employeeId?.userId?.lastName || ''}`.toLowerCase();
    const status = (leave.status || '').toLowerCase();
    const startDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-US') : '';
    const endDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-US') : '';

    return (
      employeeName.includes(term) ||
      status.includes(term) ||
      startDate.includes(term) ||
      endDate.includes(term)
    );
  });

  const canApproveLeave = (leave: any) => leave.status === 'pending';

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

  const openStatusModal = (leave: any, action: 'approved' | 'rejected') => {
    setSelectedLeave(leave._id);
    setActionType(action);
    setShowStatusModal(true);
  };

  // Export to Excel function
  const handleExportExcel = async () => {
    try {
      // Determine which data to export based on downloadScope
      let exportData = filteredLeaves;
      if (downloadScope === 'all') {
        await refetchAll();
        exportData = allLeavesData?.data ?? [];
      }

      // Prepare data with better formatting
      const excelData = exportData.map((leave: any, index: number) => ({
        'S.No': index + 1,
        'Employee Name': `${leave.employeeId?.userId?.firstName || ''} ${leave.employeeId?.userId?.lastName || ''}`.trim() || 'N/A',
        'Employee ID': leave.employeeId?.employeeId || 'N/A',
        'Leave Type': (leave.type || 'Unknown').toUpperCase(),
        'Start Date': leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }) : 'N/A',
        'End Date': leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }) : 'N/A',
        'Total Days': leave.totalDays || 0,
        'Status': (leave.status || 'Unknown').toUpperCase(),
        'Reason': leave.reason || 'No reason provided',
        'Applied On': leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }) : 'N/A',
        'Approved/Rejected By': leave.approvedBy ?
          `${leave.approvedBy.firstName || ''} ${leave.approvedBy.lastName || ''}`.trim() : '-',
        'Action Date': leave.approvalDate ? new Date(leave.approvalDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }) : (leave.rejectionDate ? new Date(leave.rejectionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }) : '-'),
        'Rejection Reason': leave.rejectionReason || '-'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Define column widths for better readability
      const columnWidths = [
        { wch: 6 },   // S.No
        { wch: 20 },  // Employee Name
        { wch: 12 },  // Employee ID
        { wch: 12 },  // Leave Type
        { wch: 12 },  // Start Date
        { wch: 12 },  // End Date
        { wch: 10 },  // Total Days
        { wch: 12 },  // Status
        { wch: 30 },  // Reason
        { wch: 12 },  // Applied On
        { wch: 20 },  // Approved/Rejected By
        { wch: 12 },  // Action Date
        { wch: 45 }   // Rejection Reason
      ];
      ws['!cols'] = columnWidths;

      // Style the header row
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      // Apply header styles
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: 0 });
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = headerStyle;
      });

      // Style data rows with alternating colors and status-based coloring
      excelData.forEach((row, rowIndex) => {
        const actualRowIndex = rowIndex + 1;

        headers.forEach((header, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: actualRowIndex });
          if (!ws[cellAddress]) ws[cellAddress] = {};

          let fillColor = actualRowIndex % 2 === 0 ? "F8FAFC" : "FFFFFF";

          if (header === 'Status') {
            const status = row[header].toLowerCase();
            switch (status) {
              case 'approved':
                fillColor = "D1FAE5";
                break;
              case 'rejected':
                fillColor = "FEE2E2";
                break;
              case 'pending':
                fillColor = "FEF3C7";
                break;
              case 'cancelled':
                fillColor = "F3F4F6";
                break;
            }
          }

          if (header === 'Leave Type') {
            const leaveType = row[header].toLowerCase();
            switch (leaveType) {
              case 'casual':
                fillColor = "DBEAFE";
                break;
              case 'medical':
                fillColor = "FED7E2";
                break;
              case 'annual':
                fillColor = "D1FAE5";
                break;
              case 'maternity':
              case 'paternity':
                fillColor = "E9D5FF";
                break;
            }
          }

          ws[cellAddress].s = {
            fill: { fgColor: { rgb: fillColor } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } }
            },
            font: { color: { rgb: "374151" } }
          };

          if (header === 'Total Days') {
            ws[cellAddress].s.font = { bold: true, color: { rgb: "1F2937" } };
          }

          if (header === 'Reason' || header === 'Rejection Reason') {
            ws[cellAddress].s.alignment = { horizontal: "left", vertical: "top", wrapText: true };
          }
        });
      });

      XLSX.utils.book_append_sheet(wb, ws, "Leave Requests");

      const currentDate = new Date().toISOString().split('T')[0];
      const filterInfo = [];
      if (statusFilter) filterInfo.push(`status-${statusFilter}`);
      if (typeFilter) filterInfo.push(`type-${typeFilter}`);
      if (searchTerm) filterInfo.push(`search-${searchTerm.replace(/[^a-zA-Z0-9]/g, '')}`);

      const filterSuffix = filterInfo.length > 0 ? `-${filterInfo.join('-')}` : '';
      const scopeSuffix = downloadScope === 'all' ? '-all' : '-page';
      const filename = `leave-requests-${currentDate}${filterSuffix}${scopeSuffix}.xlsx`;

      XLSX.writeFile(wb, filename);

      console.log('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    }
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

  const renderActionButtons = (leave: any) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(`/leave/view/${leave._id}`)}
        className="text-blue-600 hover:text-blue-900 p-1 rounded"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      {leave.status === 'pending' && leave.employeeId?.userId?._id !== user?._id && (
        <>
          <button
            onClick={() => openStatusModal(leave, 'approved')}
            className="text-green-600 hover:text-green-900 p-1 rounded"
            title="Approve"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => openStatusModal(leave, 'rejected')}
            className="text-red-600 hover:text-red-900 p-1 rounded"
            title="Reject"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-1">Manage all employee leave requests</p>
          </div>
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
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="casual">Casual</option>
              <option value="medical">Medical</option>
              {/* <option value="annual">Annual</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="unpaid">Unpaid</option>
              <option value="other">Other</option> */}
            </select>

            {/* Export Button */}
            <select
              value={downloadScope}
              onChange={(e) => setDownloadScope(e.target.value as 'current' | 'all')}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Current Page</option>
              <option value="all">All Data</option>
            </select>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#1dbfb4]"
            >
              <Download className="w-4 h-4" />
              Export Excel
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
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Employee
                </th>
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
                  Approver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No leave requests found</p>
                    <p className="text-sm">
                      No employees have submitted leave requests yet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave: any) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.approvedBy ? (
                        `${leave.approvedBy.firstName || ''} ${leave.approvedBy.lastName || ''}`
                      ) : (
                        'Yet to process'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {renderActionButtons(leave)}
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
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
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
                  ))}

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


    </div>
  );
};

export default LeaveManagement;