import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    FileText,
    Download,
    Check,
    X,
    MessageSquare,
    AlertTriangle
} from 'lucide-react';
import {
    useGetLeaveByIdQuery,
    useUpdateLeaveStatusMutation,
    useCancelLeaveMutation
} from '../../../services/leaveServices';
import { useUser } from '../../dashboard/context/DashboardContext';

const LeaveView: React.FC<LeaveViewProps> = () => {
    const { user } = useUser();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');
    const [rejectionReason, setRejectionReason] = useState('');
    const [canGoBack, setCanGoBack] = useState(false);

    const { data: leaveData, isLoading, error, refetch } = useGetLeaveByIdQuery(id!);
    const [updateLeaveStatus] = useUpdateLeaveStatusMutation();
    const [cancelLeave] = useCancelLeaveMutation();

    const userRole = user?.role?.name?.toLowerCase();
    const isAdmin = userRole === 'admin';
    const isHR = userRole === 'hr';
    const leave = leaveData?.data as PopulatedLeave;

    // Check if user can go back in browser history
    useEffect(() => {
        // Check if there's a previous page in the current session
        const hasHistory = window.history.length > 1;

        // Also check if we came from within the app (has state or referrer)
        const hasState = location.state?.from || document.referrer.includes(window.location.origin);

        setCanGoBack(hasHistory && hasState);
    }, [location]);

    // Enhanced back navigation function
    const HandleBackNavigation = () => {
        navigate(-1);
    };


    // Helper function to safely get employee data
    const getEmployeeData = () => {
        if (!leave?.employeeId || typeof leave.employeeId === 'string') {
            return null;
        }
        return leave.employeeId as PopulatedEmployee;
    };

    // Helper function to safely get approver data
    const getApproverData = () => {
        if (!leave?.approvedBy || typeof leave.approvedBy === 'string') {
            return null;
        }
        return leave.approvedBy as PopulatedUser;
    };

    // Check if current user can approve/reject this leave
    const canApproveLeave = () => {
        if (!leave || leave.status !== 'pending') return false;

        const employeeData = getEmployeeData();
        if (!employeeData) return false;

        // Get the leave applicant's role
        const applicantRole = employeeData.userId?.role?.name?.toLowerCase() || 'employee';

        // Admin can approve anyone's leave
        if (isAdmin) return true;

        // HR can approve employee leaves but not their own or other HR leaves
        if (isHR) {
            // Check if it's their own leave
            const isOwnLeave = employeeData.userId?._id === user?._id;

            if (isOwnLeave) return false; // HR cannot approve their own leave

            // HR can approve employee leaves (not HR or admin leaves)
            return applicantRole === 'employee';
        }

        return false;
    };

    // Check if current user is the leave applicant
    const isOwnLeave = () => {
        const employeeData = getEmployeeData();
        return employeeData?.userId?._id === user?._id;
    };

    console.log('Leave Data:', leave);
    console.log('User Role:', userRole);
    console.log('Can Approve:', canApproveLeave());
    console.log('Is Own Leave:', isOwnLeave());

    const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
        try {
            await updateLeaveStatus({
                id: id!,
                status,
                ...(status === 'rejected' && { rejectionReason })
            }).unwrap();

            refetch();
            setShowStatusModal(false);
            setRejectionReason('');
        } catch (error) {
            console.error('Error updating leave status:', error);
        }
    };

    const handleCancelLeave = async () => {
        if (window.confirm('Are you sure you want to cancel this leave request?')) {
            try {
                await cancelLeave(id!).unwrap();
                refetch();
            } catch (error) {
                console.error('Error cancelling leave:', error);
            }
        }
    };

    const openStatusModal = (action: 'approved' | 'rejected') => {
        if (!canApproveLeave()) {
            if (isOwnLeave() && isHR) {
                alert('HR cannot approve their own leave. Only admin can approve HR leave requests.');
            } else {
                alert('You do not have permission to approve this leave request.');
            }
            return;
        }

        setActionType(action);
        setShowStatusModal(true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const getStatusColor = (status: string) => {
        if (!status) return 'bg-gray-100 text-gray-800 border-gray-300';

        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            approved: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    const getTypeColor = (type: string) => {
        if (!type) return 'bg-gray-100 text-gray-800';

        const colors = {
            casual: 'bg-blue-100 text-blue-800',
            medical: 'bg-red-100 text-red-800',
            annual: 'bg-green-100 text-green-800',
            maternity: 'bg-purple-100 text-purple-800',
            paternity: 'bg-indigo-100 text-indigo-800',
            unpaid: 'bg-gray-100 text-gray-800',
            other: 'bg-orange-100 text-orange-800'
        };
        return colors[type as keyof typeof colors] || colors.other;
    };

    const formatLeaveType = (type: string) => {
        if (!type) return 'Unknown';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const formatStatus = (status: string) => {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Get approval permission message
    const getApprovalMessage = () => {
        if (!leave || leave.status !== 'pending') return null;

        const employeeData = getEmployeeData();
        const applicantRole = employeeData?.userId?.role?.name?.toLowerCase() || 'employee';

        if (isOwnLeave() && isHR) {
            return {
                type: 'warning',
                message: 'You cannot approve your own leave request. Only admin can approve HR leave requests.'
            };
        }

        if (isHR && applicantRole === 'hr') {
            return {
                type: 'info',
                message: 'Only admin can approve HR leave requests.'
            };
        }

        return null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !leave) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-600">Leave request not found or you don't have permission to view it.</p>
                        <button
                            onClick={HandleBackNavigation}
                            className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                            ← Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const approvalMessage = getApprovalMessage();

    return (
        <div className="p-6 bg-gray-50 min-h-screen rounded-lg">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={HandleBackNavigation}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 hover:gap-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {canGoBack ? 'Go Back' : 'Back to Leave List'}
                    </button>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Leave Request Details</h1>
                            <p className="text-gray-600 mt-1">
                                Request ID: {leave._id || 'N/A'}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {/* Approval Actions - Based on Hierarchy */}
                            {canApproveLeave() && (
                                <>
                                    <button
                                        onClick={() => openStatusModal('approved')}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => openStatusModal('rejected')}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Reject
                                    </button>
                                </>
                            )}

                            {/* Employee Actions - Edit/Cancel own pending leaves */}
                            {isOwnLeave() && leave.status === 'pending' && (
                                <>
                                    {/* <button
                                        onClick={() => navigate(`/leave/edit/${leave._id}`)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button> */}
                                    <button
                                        onClick={handleCancelLeave}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel Request
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Approval Permission Message */}
                    {approvalMessage && (
                        <div className={`mt-4 p-3 rounded-lg border flex items-start gap-2 ${approvalMessage.type === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}>
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{approvalMessage.message}</p>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-[#14b8a6] p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Leave Type</label>
                                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(leave.type)}`}>
                                        {formatLeaveType(leave.type)}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(leave.status)}`}>
                                        {formatStatus(leave.status)}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {formatDate(leave.startDate)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {formatDate(leave.endDate)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Total Days</label>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        {leave.totalDays || 0} {leave.totalDays === 0.5 ? '(Half Day)' : leave.totalDays === 1 ? 'Day' : 'Days'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Applied On</label>
                                    <div className="text-gray-900">
                                        {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="bg-white rounded-lg shadow-sm border border-[#14b8a6] p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reason for Leave</h2>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed">{leave.reason || 'No reason provided'}</p>
                            </div>
                        </div>

                        {/* Attachments */}
                        {leave.attachments && leave.attachments.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-[#14b8a6] p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Attachments</h2>
                                <div className="space-y-3">
                                    {leave.attachments.map((attachment: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate max-w-x">
                                                        {attachment.name || "Unnamed file"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Uploaded on{" "}
                                                        {attachment.uploadedAt
                                                            ? new Date(attachment.uploadedAt).toLocaleDateString()
                                                            : "Unknown date"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (attachment.url) {
                                                        const fileUrl = `http://localhost:5000/${attachment.url.replace(
                                                            /\\/g,
                                                            "/"
                                                        )}`;
                                                        window.open(fileUrl, "_blank");
                                                    }
                                                }}
                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                                                disabled={!attachment.url}
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {leave.status === 'rejected' && leave.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Rejection Reason
                                </h2>
                                <p className="text-red-800">{leave.rejectionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Employee Info & Timeline */}
                    <div className="space-y-6">
                        {/* Employee Information */}
                        {(isAdmin || isHR) && getEmployeeData() && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Employee Details
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-gray-900">
                                            {getEmployeeData()?.userId?.firstName || ''} {getEmployeeData()?.userId?.lastName || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Employee ID</label>
                                        <p className="text-gray-900">{getEmployeeData()?.employeeId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Email</label>
                                        <p className="text-gray-900 truncate">{getEmployeeData()?.userId?.email || 'N/A'}</p>
                                    </div>
                                    {/* <div>
                                        <label className="block text-sm font-medium text-gray-500">Role</label>
                                        <p className="text-gray-900 capitalize">
                                            {user?.position ?? 'N/A'}
                                        </p>
                                    </div> */}
                                </div>
                            </div>
                        )}

                        {/* Approval Information */}
                        {leave.approvedBy && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Approval Details</h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Approved/Rejected By</label>
                                        <p className="text-gray-900">
                                            {typeof leave.approvedBy === 'string'
                                                ? leave.approvedBy
                                                : `${getApproverData()?.firstName || ''} ${getApproverData()?.lastName || ''}`}
                                        </p>
                                    </div>
                                    {leave.approvalDate && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Date</label>
                                            <p className="text-gray-900">
                                                {new Date(leave.approvalDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Approval Hierarchy Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
                            <h2 className="text-lg font-semibold text-blue-900 mb-3">Approval Hierarchy</h2>
                            <div className="space-y-2 text-sm text-blue-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span>Admin can approve all leave requests</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span>HR can approve employee leaves only</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span>HR leaves require admin approval</span>
                                </div>
                            </div>
                        </div>

                        {/* Leave Statistics */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
                            <h2 className="text-lg font-semibold text-green-900 mb-3">Quick Stats</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700">Days Requested:</span>
                                    <span className="font-medium text-green-900">{leave.totalDays || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Leave Type:</span>
                                    <span className="font-medium text-green-900 capitalize">{leave.type || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Current Status:</span>
                                    <span className="font-medium text-green-900 capitalize">{leave.status || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                                        setRejectionReason('');
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(actionType)}
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

export default LeaveView;