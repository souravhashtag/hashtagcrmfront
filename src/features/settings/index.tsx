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
    RefreshCw,
    Upload,
    Phone,
    Mail,
    Globe,
    MapPin,
    MessageSquare,
    Send,
    Building2
} from 'lucide-react';

import {
    useGetLeaveTypesQuery,
    useCreateLeaveTypeMutation,
    useUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
    LeaveType,
    LeaveTypeFormData
} from '../../services/leaveTypesServices';
import {
    useAddRecipientMutation,
    useGetCompanyDetailsQuery,
    useInitializeCompanyMutation,
    useUpdateCompanyInfoMutation
} from '../../services/companyDetailsServices';
import TaxDeductionModal from './TaxDeductionModal';
import DeductionRulesPage from './pages/DeductionRulesPage';

interface SettingsSection {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    description: string;
}
interface Recipient {
    id: string;
    email: string;
    name: string;
}

interface CompanyData {
    name: string;
    domain: string;
    logo: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactInfo: {
        phone: string;
        email: string;
        website: string;
    };
    ceo: {
        userId: string;
        signature: string;
        bio: string;
        profileImage: string;
    };
    settings: {
        ceoTalk: {
            Message: string;
        };
        recipients: {
            to: Array<{ id: string, email: string, name: string }>;
            cc: Array<{ id: string, email: string, name: string }>;
            bcc: Array<{ id: string, email: string, name: string }>;
        };
        sender: {
            userId: string;
            email: string;
            name: string;
        };
    };
}
const settingsSections: SettingsSection[] = [
    {
        id: 'leave-types',
        name: 'Leave Type Management',
        icon: Calendar,
        description: 'Manage leave types, policies, and configurations'
    },
    {
        id: 'company',
        name: 'Company Settings',
        icon: Building2,
        description: 'Company information, contact details, and business settings'
    },
     {
        id: 'deductions',
        name: 'Deductions Settings',
        icon: Building2,
        description: 'Salary Deduction information'
    },
    {
        id: 'security',
        name: 'Security & Privacy',
        icon: Shield,
        description: 'Password, two-factor authentication, and privacy settings'
    }
];

const CorrectedLeaveManagementSettings: React.FC = () => {
    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        domain: '',
        logo: '',
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
        },
        contactInfo: {
            phone: '',
            email: '',
            website: ''
        },
        ceo: {
            userId: '',
            signature: '',
            bio: '',
            profileImage: ''
        },
        settings: {
            ceoTalk: {
                Message: "Thank you for reaching out. Your success is our priority. We will get back to you soon."
            },
            recipients: {
                to: [],
                cc: [],
                bcc: []
            },
            sender: {
                userId: '',
                email: '',
                name: ''
            }
        }
    });

    const [showRecipientModal, setShowRecipientModal] = useState(false);
    const [recipientType, setRecipientType] = useState<'to' | 'cc' | 'bcc'>('to');
    const [newRecipient, setNewRecipient] = useState<Recipient>({
        id: '',
        email: '',
        name: ''
    });
    const [activeSection, setActiveSection] = useState('leave-types'); // Start with leave types
    const [showPassword, setShowPassword] = useState(false);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [editingRule, setEditingRule] = useState<any | null>(null);
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

    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    // Redux hooks
    const {
        data: companyResponse,
        error: companyError,
    } = useGetCompanyDetailsQuery();
    const [updateCompanyInfo] = useUpdateCompanyInfoMutation();
    const [addRecipient] = useAddRecipientMutation();
    const [initializeCompany] = useInitializeCompanyMutation();

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

    const handleLeaveTypeFormChange = (field: keyof LeaveTypeFormData, value: any) => {
        setLeaveTypeForm(prev => ({
            ...prev,
            [field]: value
        }));
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
    // Check if company exists and needs initialization
    const needsInitialization = companyError && (companyError as any)?.status === 404;

    // Update local state when Redux data changes
    useEffect(() => {
        if (companyResponse?.success && companyResponse.data) {
            setCompanyData(companyResponse.data);
        }
    }, [companyResponse]);

    // Initialize company if it doesn't exist
    const handleInitializeCompany = async () => {
        try {
            const initData = {
                ...companyData,
                ceo: {
                    userId: "686ba39694a7d69724c00846"
                },
                settings: {
                    sender: {
                        userId: "6889f63d0a09308db5b5b4b2",
                        email: "anubrati@hashtagbizsolutions.com",
                        name: "Anubrati Mitra"
                    }
                }
            };
            const result = await initializeCompany(initData).unwrap();
            // After successful initialization, the query will automatically refetch
            console.log('Company initialized successfully:', result);
        } catch (error) {
            console.error('Error initializing company:', error);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCompanyDataChange = (field: string, value: any) => {
        const fieldParts = field.split('.');

        if (fieldParts.length === 1) {
            setCompanyData(prev => ({
                ...prev,
                [field]: value
            }));
        } else if (fieldParts.length === 2) {
            setCompanyData(prev => {
                const [parentKey, childKey] = fieldParts;
                return {
                    ...prev,
                    [parentKey]: {
                        ...(prev[parentKey as keyof CompanyData] as Record<string, any>),
                        [childKey]: value
                    }
                };
            });
        } else if (fieldParts.length === 3) {
            setCompanyData(prev => {
                const [parentKey, middleKey, childKey] = fieldParts;
                const parentObj = prev[parentKey as keyof CompanyData] as Record<string, any>;
                const middleObj = parentObj[middleKey] as Record<string, any>;

                return {
                    ...prev,
                    [parentKey]: {
                        ...parentObj,
                        [middleKey]: {
                            ...middleObj,
                            [childKey]: value
                        }
                    }
                };
            });
        }
    };

    const handleSave = async (section: string) => {
        try {
            switch (section) {
                case 'security':
                    // Handle security settings (implement your security update logic)
                    console.log('Saving security settings:', formData);
                    break;

                case 'company':
                    if (needsInitialization) {
                        await handleInitializeCompany();
                    } else {
                        await updateCompanyInfo(companyData).unwrap();
                    }
                    break;

                case 'leave-types':
                    // Handle leave types save
                    console.log('Saving leave types:', leaveTypes);
                    break;
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleAddRecipient = async () => {
        try {
            const result = await addRecipient({
                type: recipientType,
                recipientData: newRecipient
            }).unwrap();

            // Update local state with the response
            setCompanyData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    recipients: result.data
                }
            }));

            setShowRecipientModal(false);
            setNewRecipient({ id: '', email: '', name: '' });
        } catch (error) {
            console.error('Error adding recipient:', error);
        }
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        saving
                    </button>
                </div>
            </div>
        </div>
    );


    const renderCompanySettings = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Company Settings</h2>
                <p className="text-sm text-teal-100">Manage your company information and business settings</p>
            </div>

            <div className="p-6 space-y-8">
                {/* Basic Company Information */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={companyData.name}
                                onChange={(e) => handleCompanyDataChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="Enter company name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Domain
                            </label>
                            <input
                                type="text"
                                value={companyData.domain}
                                onChange={(e) => handleCompanyDataChange('domain', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="company.com"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Company Logo
                        </label>
                        <div className="flex items-center gap-4">
                            {companyData.logo && (
                                <img src={companyData.logo} alt="Company Logo" className="w-16 aspect-square object-contain rounded-lg border bg-[#111D32]" />
                            )}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={companyData.logo}
                                    onChange={(e) => handleCompanyDataChange('logo', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    placeholder="Logo URL or upload path"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                                <Upload className="w-4 h-4" />
                                Upload
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={companyData.contactInfo.phone}
                                onChange={(e) => handleCompanyDataChange('contactInfo.phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={companyData.contactInfo.email}
                                onChange={(e) => handleCompanyDataChange('contactInfo.email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="contact@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Globe className="w-4 h-4 inline mr-1" />
                                Website
                            </label>
                            <input
                                type="url"
                                value={companyData.contactInfo.website}
                                onChange={(e) => handleCompanyDataChange('contactInfo.website', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="https://company.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                    </h3>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Street Address
                        </label>
                        <input
                            type="text"
                            value={companyData.address.street}
                            onChange={(e) => handleCompanyDataChange('address.street', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            placeholder="123 Business Street"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={companyData.address.city}
                                onChange={(e) => handleCompanyDataChange('address.city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="New York"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={companyData.address.state}
                                onChange={(e) => handleCompanyDataChange('address.state', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="NY"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Country
                            </label>
                            <input
                                type="text"
                                value={companyData.address.country}
                                onChange={(e) => handleCompanyDataChange('address.country', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="United States"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ZIP Code
                            </label>
                            <input
                                type="text"
                                value={companyData.address.zipCode}
                                onChange={(e) => handleCompanyDataChange('address.zipCode', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="10001"
                            />
                        </div>
                    </div>
                </div>

                {/* CEO Talk Message */}
                <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        CEO Talk Message
                    </h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Default Message
                        </label>
                        <textarea
                            value={companyData.settings.ceoTalk.Message}
                            onChange={(e) => handleCompanyDataChange('settings.ceoTalk.Message', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            placeholder="Enter the default CEO talk message..."
                        />
                        <p className="text-xs text-gray-500 mt-1">This message will be displayed when users contact through CEO Talk feature.</p>
                    </div>
                </div>

                {/* Email Recipients */}
                <div className="pb-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900">
                            <Send className="w-4 h-4 inline mr-1" />
                            Email Recipients
                        </h3>
                        <button
                            onClick={() => {
                                setRecipientType('to');
                                setShowRecipientModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#129990] text-white text-xs font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add Recipient
                        </button>
                    </div>

                    {/* TO Recipients */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                        <div className="space-y-2">
                            {companyData.settings.recipients.to.map((recipient, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div>
                                        <span className="text-sm font-medium">{recipient.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">{recipient.email}</span>
                                    </div>
                                    <button
                                        // onClick={() => removeRecipient(recipient.id, 'to')}
                                        className="text-red-600 hover:text-red-800 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {companyData.settings.recipients.to.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No recipients added</p>
                            )}
                        </div>
                    </div>

                    {/* CC Recipients */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CC</label>
                        <div className="space-y-2">
                            {companyData.settings.recipients.cc.map((recipient, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div>
                                        <span className="text-sm font-medium">{recipient.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">{recipient.email}</span>
                                    </div>
                                    <button
                                        // onClick={() => removeRecipient(recipient.id, 'cc')}
                                        className="text-red-600 hover:text-red-800 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {companyData.settings.recipients.cc.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No CC recipients added</p>
                            )}
                        </div>
                    </div>

                    {/* BCC Recipients */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">BCC</label>
                        <div className="space-y-2">
                            {companyData.settings.recipients.bcc.map((recipient, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div>
                                        <span className="text-sm font-medium">{recipient.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">{recipient.email}</span>
                                    </div>
                                    <button
                                        // onClick={() => removeRecipient(recipient.id, 'bcc')}
                                        className="text-red-600 hover:text-red-800 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {companyData.settings.recipients.bcc.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No BCC recipients added</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={() => handleSave('company')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        saving
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


    const renderDeductionsSettings = () => (
        <>
            <DeductionRulesPage />
        </>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'leave-types':
                return renderLeaveTypesManagement();
            case 'company':
                return renderCompanySettings();
            case 'deductions':
                return renderDeductionsSettings();
            case 'security':
                return renderSecuritySettings();
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
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-6">
                    {renderContent()}
                </div>
            </div>


            {/* Recipient Modal */}
            {showRecipientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Add Email Recipient
                            </h3>
                            <p className="text-sm text-teal-100 mt-1">
                                Add a new recipient to your email list
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Recipient Type
                                </label>
                                <select
                                    value={recipientType}
                                    onChange={(e) => setRecipientType(e.target.value as 'to' | 'cc' | 'bcc')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                >
                                    <option value="to">To</option>
                                    <option value="cc">CC</option>
                                    <option value="bcc">BCC</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={newRecipient.name}
                                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    placeholder="Enter recipient name"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newRecipient.email}
                                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowRecipientModal(false);
                                    setNewRecipient({ id: '', email: '', name: '' });
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRecipient}
                                disabled={!newRecipient.name || !newRecipient.email}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Recipient
                            </button>
                        </div>
                    </div>
                </div>
            )}

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




            {/* Tax Deduction Modal - Add this to your existing modals section */}
            {/* {showTaxDeductionModal && ( */}

            {/* <button onClick={() => setShowTaxModal(true)} className="mt-4 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                Open Tax Deduction Modal
            </button>
            <TaxDeductionModal
                isOpen={showTaxModal}
                onClose={() => { setShowTaxModal(false); setEditingRule(null); }}
                editingRule={editingRule}
            /> */}
            {/* )} */}
        </div>
    );
};

export default CorrectedLeaveManagementSettings;