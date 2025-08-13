import React, { useState, useEffect } from 'react';
import {
    Shield,
    Save,
    Plus,
    Edit3,
    Trash2,
    X,
    Calendar,
    Eye,
    EyeOff,
    CheckCircle,
    Loader2,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

// Import the actual Redux services
import {
    useGetLeaveTypesQuery,
    useCreateLeaveTypeMutation,
    useUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
    LeaveType,
    LeaveTypeFormData
} from '../../services/leaveTypesServices';

interface SettingsSection {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    description: string;
}

const settingsSections: SettingsSection[] = [
    {
        id: 'leave-types',
        name: 'Leave Type Management',
        icon: Calendar,
        description: 'Manage leave types, policies, and configurations'
    },
    {
        id: 'security',
        name: 'Security & Privacy',
        icon: Shield,
        description: 'Password, two-factor authentication, and privacy settings'
    }
];

const CorrectedLeaveManagementSettings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('leave-types'); // Start with leave types
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false,
    });

    // Leave Types Management State
    const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
    const [leaveTypeForm, setLeaveTypeForm] = useState<LeaveTypeFormData>({
        name: '',
        leaveCount: 0,
        ispaidLeave: true,
        carryforward: false
    });

    // Query parameters for leave types
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        search: '',
        isPaid: '',
        sortBy: 'name',
        sortOrder: 'asc'
    });

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    // RTK Query hooks with correct refetch options placement
    const {
        data: leaveTypesData,
        isLoading: isLoadingLeaveTypes,
        error: leaveTypesError,
        refetch: refetchLeaveTypes,
        isFetching: isFetchingLeaveTypes
    } = useGetLeaveTypesQuery(queryParams, {
        // ✅ Refetch options go here in the component, not in the service
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        // Skip query if not on leave-types section to optimize performance
        skip: activeSection !== 'leave-types'
    });

    const [createLeaveType, {
        isLoading: isCreating,
        isSuccess: isCreateSuccess,
        reset: resetCreate
    }] = useCreateLeaveTypeMutation();

    const [updateLeaveType, {
        isLoading: isUpdating,
        isSuccess: isUpdateSuccess,
        reset: resetUpdate
    }] = useUpdateLeaveTypeMutation();

    const [deleteLeaveType, {
        isLoading: isDeleting,
        isSuccess: isDeleteSuccess,
        reset: resetDelete
    }] = useDeleteLeaveTypeMutation();

    // Get leave types from API response
    const leaveTypes = leaveTypesData?.data || [];
    const statistics = leaveTypesData?.statistics || {
        total: 0,
        paidLeaveTypes: 0,
        unpaidLeaveTypes: 0,
        averageLeaveCount: 0
    };
    const pagination = leaveTypesData?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    };

    // Refetch data when operations are successful and reset mutation states
    useEffect(() => {
        if (isCreateSuccess) {
            refetchLeaveTypes();
            resetCreate();
        }
        if (isUpdateSuccess) {
            refetchLeaveTypes();
            resetUpdate();
        }
        if (isDeleteSuccess) {
            refetchLeaveTypes();
            resetDelete();
        }
    }, [isCreateSuccess, isUpdateSuccess, isDeleteSuccess, refetchLeaveTypes, resetCreate, resetUpdate, resetDelete]);

    // Debounce search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            // No need to check for empty string, just reset page when search changes
            setQueryParams(prev => ({ ...prev, page: 1 }));
        }, 300); // Reduced debounce time for better UX

        return () => clearTimeout(timer);
    }, [queryParams.search]);

    // Show notification helper
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLeaveTypeFormChange = (field: keyof LeaveTypeFormData, value: any) => {
        setLeaveTypeForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async (section: string) => {
        setSaveStatus('saving');
        try {
            // Here you would implement actual security settings API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaveStatus('saved');
            showNotification('success', 'Settings saved successfully!');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            setSaveStatus('error');
            showNotification('error', 'Failed to save settings. Please try again.');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const openLeaveTypeModal = (leaveType?: LeaveType) => {
        if (leaveType) {
            setEditingLeaveType(leaveType);
            setLeaveTypeForm({
                name: leaveType.name,
                leaveCount: leaveType.leaveCount,
                ispaidLeave: leaveType.ispaidLeave,
                carryforward: leaveType.carryforward
            });
        } else {
            setEditingLeaveType(null);
            setLeaveTypeForm({
                name: '',
                leaveCount: 0,
                ispaidLeave: true,
                carryforward: false
            });
        }
        setShowLeaveTypeModal(true);
    };

    const handleSaveLeaveType = async () => {
        try {
            let result;

            if (editingLeaveType) {
                // Update existing leave type
                result = await updateLeaveType({
                    id: editingLeaveType._id,
                    data: leaveTypeForm
                }).unwrap();

                showNotification('success', result.message || 'Leave type updated successfully!');
            } else {
                // Create new leave type
                result = await createLeaveType(leaveTypeForm).unwrap();

                showNotification('success', result.message || 'Leave type created successfully!');
            }

            setShowLeaveTypeModal(false);
            setEditingLeaveType(null);

            // The cache will automatically invalidate and refetch due to invalidatesTags

        } catch (error: any) {
            console.error('Error saving leave type:', error);

            // Handle specific backend validation errors
            let errorMessage = 'Failed to save leave type. Please try again.';

            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            showNotification('error', errorMessage);
        }
    };

    const handleDeleteLeaveType = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}" leave type?`)) {
            try {
                const result = await deleteLeaveType(id).unwrap();

                showNotification('success', result.message || 'Leave type deleted successfully!');

                // The cache will automatically invalidate and refetch due to invalidatesTags

            } catch (error: any) {
                console.error('Error deleting leave type:', error);

                let errorMessage = 'Failed to delete leave type. Please try again.';

                if (error?.data?.message) {
                    errorMessage = error.data.message;
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                showNotification('error', errorMessage);
            }
        }
    };

    const handleQueryParamsChange = (field: string, value: any) => {
        setQueryParams(prev => ({
            ...prev,
            [field]: value,
            ...(field !== 'page' && { page: 1 }) // Reset page when other filters change
        }));
    };

    // Manual refresh function
    const handleManualRefresh = () => {
        refetchLeaveTypes();
        showNotification('info', 'Refreshing leave types...');
    };

    // Toggle Switch Component
    const ToggleSwitch: React.FC<{
        checked: boolean;
        onChange: (checked: boolean) => void;
        label: string;
        description: string;
    }> = ({ checked, onChange, label, description }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
            <div className="flex-1">
                <span className="block font-semibold text-gray-700 mb-1">{label}</span>
                <p className="text-sm text-gray-500 m-0">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#129990]"></div>
            </label>
        </div>
    );

    // Notification Component
    const NotificationBanner = () => {
        if (!notification) return null;

        const bgColor = notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-blue-50 border-blue-200 text-blue-700';

        const icon = notification.type === 'success' ? CheckCircle :
            notification.type === 'error' ? AlertCircle :
                AlertCircle;

        const IconComponent = icon;

        return (
            <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-4 border rounded-lg shadow-lg ${bgColor} max-w-md`}>
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                    onClick={() => setNotification(null)}
                    className="ml-2 text-current hover:text-opacity-70 flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    };

    const renderSecuritySettings = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Security & Privacy</h2>
                <p className="text-sm text-teal-100">Manage your password, two-factor authentication, and privacy settings</p>
            </div>

            <div className="p-6">
                <div className="mb-8 pb-6 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Change Password</h3>

                    <div className="mb-4">
                        <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="currentPassword"
                                value={formData.currentPassword}
                                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={formData.newPassword}
                                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <ToggleSwitch
                        checked={formData.twoFactorEnabled}
                        onChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
                        label="Enable Two-Factor Authentication"
                        description="Add an extra layer of security to your account"
                    />
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={() => handleSave('security')}
                        disabled={saveStatus === 'saving'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {saveStatus === 'saving' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Security Settings'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLeaveTypesManagement = () => (
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

                {/* Filters */}
                {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                value={queryParams.search}
                                onChange={(e) => handleQueryParamsChange('search', e.target.value)}
                                placeholder="Search leave types..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={queryParams.isPaid}
                                onChange={(e) => handleQueryParamsChange('isPaid', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            >
                                <option value="">All Types</option>
                                <option value="true">Paid Leave</option>
                                <option value="false">Unpaid Leave</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                                value={queryParams.sortBy}
                                onChange={(e) => handleQueryParamsChange('sortBy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            >
                                <option value="name">Name</option>
                                <option value="leaveCount">Leave Count</option>
                                <option value="createdAt">Created Date</option>
                                <option value="updatedAt">Modified Date</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                            <select
                                value={queryParams.sortOrder}
                                onChange={(e) => handleQueryParamsChange('sortOrder', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>
                </div> */}

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

    const renderContent = () => {
        switch (activeSection) {
            case 'security':
                return renderSecuritySettings();
            case 'leave-types':
                return renderLeaveTypesManagement();
            default:
                return renderSecuritySettings();
        }
    };

    return (
        <div className="bg-[#E8EDF2] min-h-screen">
            {/* Notification Banner */}
            <NotificationBanner />

            <div className="flex">
                {/* Left Sidebar Navigation */}
                <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 min-h-screen">
                    <div className="p-6">
                        <div className="mb-8 pb-4 border-b border-gray-200">
                            <h1 className="text-2xl font-bold text-[#00544d] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Settings</h1>
                            <p className="text-sm text-gray-600 leading-tight">Manage your application preferences</p>
                        </div>

                        <nav className="space-y-2">
                            {settingsSections.map((section) => {
                                const IconComponent = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-start gap-3 p-4 rounded-lg text-left transition-all duration-200 ${activeSection === section.id
                                            ? 'bg-[#129990] text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-[#129990]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 mt-0.5">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold mb-1">{section.name}</span>
                                            <span className={`block text-xs leading-tight ${activeSection === section.id
                                                ? 'text-teal-100'
                                                : 'text-gray-500'
                                                }`}>
                                                {section.description}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Save Status Indicator */}
                        {saveStatus === 'saved' && (
                            <div className="flex items-center gap-2 p-3 mt-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Settings saved successfully!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-6">
                    {renderContent()}
                </div>
            </div>

            {/* Leave Type Modal */}
            {showLeaveTypeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-gray-200 bg-[#129990] relative">
                            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
                            </h3>
                            <p className="text-sm text-teal-100 mt-1">
                                {editingLeaveType ? 'Update leave type details' : 'Create a new leave type for your organization'}
                            </p>
                            <button
                                onClick={() => { setShowLeaveTypeModal(false); }}
                                disabled={isCreating || isUpdating}
                                className="text-white hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed absolute right-2 top-2 m-2"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>



                        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type Name *</label>
                                <input
                                    type="text"
                                    value={leaveTypeForm.name}
                                    onChange={(e) => handleLeaveTypeFormChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    placeholder="e.g., Annual Leave"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Days Per Year *</label>
                                <input
                                    type="number"
                                    value={leaveTypeForm.leaveCount}
                                    onChange={(e) => handleLeaveTypeFormChange('leaveCount', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    min="0"
                                    placeholder="25"
                                    required
                                />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700">Policy Settings</h4>

                                <ToggleSwitch
                                    checked={leaveTypeForm.ispaidLeave}
                                    onChange={(checked) => handleLeaveTypeFormChange('ispaidLeave', checked)}
                                    label="Paid Leave"
                                    description="Employees receive salary during this leave type"
                                />

                                <ToggleSwitch
                                    checked={leaveTypeForm.carryforward}
                                    onChange={(checked) => handleLeaveTypeFormChange('carryforward', checked)}
                                    label="Allow Carry Forward"
                                    description="Unused days can be carried to next year"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowLeaveTypeModal(false);
                                    setEditingLeaveType(null);
                                }}
                                disabled={isCreating || isUpdating}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLeaveType}
                                disabled={!leaveTypeForm.name.trim() || leaveTypeForm.leaveCount < 0 || isCreating || isUpdating}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCreating || isUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {editingLeaveType ? 'Update Leave Type' : 'Create Leave Type'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CorrectedLeaveManagementSettings;