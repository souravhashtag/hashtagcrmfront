import { AlertCircle, Calendar, Edit3, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React from 'react';
import { LeaveType } from '../../../services/leaveTypesServices';


interface Pagination {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
}


interface QueryParams {
    search?: string;
    isPaid?: boolean;
    page: any;
}
interface LeaveTypesStatistics {
    total: number;
    paidLeaveTypes: number;
    unpaidLeaveTypes: number;
    averageLeaveCount: number;
}

interface LeaveTypesManagementPageProps {
    handleManualRefresh: () => void;
    isLoadingLeaveTypes: boolean;
    isFetchingLeaveTypes: boolean;
    leaveTypesError: any;
    statistics: LeaveTypesStatistics;
    openLeaveTypeModal: (leaveType?: LeaveType) => void;
    isCreating: boolean;
    leaveTypes: LeaveType[];
    isUpdating: boolean;
    handleDeleteLeaveType: (id: string, name: string) => void;
    isDeleting: boolean;
    pagination: Pagination;
    queryParams: any;
    handleQueryParamsChange: (field: keyof QueryParams, value: any) => void;
}


const LeaveTypesManagementPage = ({
    handleManualRefresh,
    isLoadingLeaveTypes,
    isFetchingLeaveTypes,
    leaveTypesError,
    statistics,
    openLeaveTypeModal,
    isCreating,
    leaveTypes,
    isUpdating,
    handleDeleteLeaveType,
    isDeleting,
    pagination,
    queryParams,
    handleQueryParamsChange
}: LeaveTypesManagementPageProps) => {
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Leave Types Management</h2>
                        <p className="text-sm text-teal-100">Configure and manage leave types for your organization</p>
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        disabled={isLoadingLeaveTypes || isFetchingLeaveTypes}
                        className="p-2 text-white hover:bg-teal-600 rounded-md transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoadingLeaveTypes || isFetchingLeaveTypes ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Error State */}
                {leaveTypesError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Error loading leave types</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                            {(leaveTypesError as any)?.data?.message || 'Please try again or contact support if the problem persists.'}
                        </p>
                        <button
                            onClick={handleManualRefresh}
                            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">{statistics.total}</div>
                        <div className="text-sm text-gray-600 font-medium">Total Leave Types</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">{statistics.paidLeaveTypes}</div>
                        <div className="text-sm text-gray-600 font-medium">Paid Types</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">{statistics.unpaidLeaveTypes}</div>
                        <div className="text-sm text-gray-600 font-medium">Unpaid Types</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">{statistics.averageLeaveCount}</div>
                        <div className="text-sm text-gray-600 font-medium">Avg Days/Year</div>
                    </div>
                </div>

                {/* Add New Leave Type Button */}
                <div className="mb-8">
                    <button
                        onClick={() => openLeaveTypeModal()}
                        disabled={isCreating}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCreating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Add New Leave Type
                    </button>
                </div>

                {/* Loading State */}
                {isLoadingLeaveTypes && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#129990]" />
                        <span className="ml-2 text-gray-600">Loading leave types...</span>
                    </div>
                )}

                {/* Leave Types List */}
                {!isLoadingLeaveTypes && (
                    <div className="space-y-4">
                        {leaveTypes.map((leaveType: any) => (
                            <div key={leaveType._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow bg-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                                {leaveType.name}
                                            </h3>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${leaveType.ispaidLeave
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {leaveType.ispaidLeave ? 'Paid' : 'Unpaid'}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${leaveType.carryforward
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {leaveType.carryforward ? 'Carry Forward' : 'No Carry'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-md">
                                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Days/Year</span>
                                                <span className="text-lg font-bold text-[#129990]">{leaveType.leaveCount}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-md">
                                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</span>
                                                <span className="text-lg font-bold text-[#129990]">{leaveType.ispaidLeave ? 'Paid' : 'Unpaid'}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-md">
                                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Carry Forward</span>
                                                <span className="text-lg font-bold text-[#129990]">{leaveType.carryforward ? 'Yes' : 'No'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-500">
                                            Created: {new Date(leaveType.createdAt).toLocaleDateString()}
                                            {leaveType.updatedAt !== leaveType.createdAt && (
                                                <span className="ml-4">
                                                    Updated: {new Date(leaveType.updatedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-6">
                                        <button
                                            onClick={() => openLeaveTypeModal(leaveType)}
                                            disabled={isUpdating}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-md transition-colors disabled:opacity-50"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLeaveType(leaveType._id, leaveType.name)}
                                            disabled={isDeleting}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoadingLeaveTypes && leaveTypes.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No leave types found</h3>
                        <p className="text-gray-500 mb-6">
                            {queryParams.search || queryParams.isPaid
                                ? 'No leave types match your current filters.'
                                : 'Add your first leave type to get started with leave management.'}
                        </p>
                        {(!queryParams.search && !queryParams.isPaid) && (
                            <button
                                onClick={() => openLeaveTypeModal()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Leave Type
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!isLoadingLeaveTypes && pagination.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleQueryParamsChange('page', Math.max(1, pagination.currentPage - 1))}
                                disabled={!pagination.hasPrevPage}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handleQueryParamsChange('page', Math.min(pagination.totalPages, pagination.currentPage + 1))}
                                disabled={!pagination.hasNextPage}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveTypesManagementPage;
