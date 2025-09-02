import React, { useState, useEffect } from 'react';
import {
    Shield,
    X,
    Calendar,
    CheckCircle,
    AlertCircle,
    Building2,
    ChartColumnDecreasing
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
import DeductionRulesPage from './pages/DeductionRulesPage';
import LeaveTypeModal from './components/LeaveTypeModal';
import RecipientModal from './components/RecipientModal';
import CompanySettingsPage from './pages/CompanySettingsPage';
import LeaveTypesManagementPage from './pages/LeaveTypesManagementPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';

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
        name: string,
        email: string,
        signature: string,
        bio: string,
        profileImage: any
    };
    profileImage: any;
    settings: {
        gracePeriod: number; // in minutes
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
        icon: ChartColumnDecreasing,
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
            name: '',
            email: '',
            signature: '',
            bio: '',
            profileImage: ''
        },
        profileImage: '',
        settings: {
            gracePeriod: 15, // default value in minutes
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
        monthlyDays: 0,
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
                monthlyDays: (leaveType.leaveCount || 0) / 12,  // 👈 keep decimals
                leaveCount: leaveType.leaveCount,
                ispaidLeave: leaveType.ispaidLeave,
                carryforward: leaveType.carryforward,
            });
        } else {
            setEditingLeaveType(null);
            setLeaveTypeForm({
                name: '',
                monthlyDays: 0,
                leaveCount: 0,
                ispaidLeave: true,
                carryforward: false,
            });
        }
        setShowLeaveTypeModal(true);
    };



    const handleSaveLeaveType = async () => {
        try {
            const payload = {
                ...leaveTypeForm,
                leaveCount: (leaveTypeForm.monthlyDays || 0) * 12, // 👈 decimals preserved
            };

            let result;
            if (editingLeaveType) {
                result = await updateLeaveType({ id: editingLeaveType._id, data: payload }).unwrap();
                showNotification('success', result.message || 'Leave type updated successfully!');
            } else {
                result = await createLeaveType(payload).unwrap();
                showNotification('success', result.message || 'Leave type created successfully!');
            }

            setShowLeaveTypeModal(false);
            setEditingLeaveType(null);
        } catch (error: any) {
            console.error('Error saving leave type:', error);
            let errorMessage = error?.data?.message || error?.message || 'Failed to save leave type. Please try again.';
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
                // ceo: {
                //     userId: "686ba39694a7d69724c00846"
                // },
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
                    console.log('Saving security settings:', formData);
                    break;

                case 'company':
                    if (needsInitialization) {
                        await handleInitializeCompany();
                    } else {
                        // Check if there's a profile image file to upload
                        console.log('Saving company settings:', companyData);
                        // if (companyData.profileImage) {

                        const formDataToSend = new FormData();

                        if (companyData.profileImage) {
                            const reader = new FileReader();
                            const file = companyData.profileImage;
                            reader.readAsDataURL(file);
                            formDataToSend.append('profilePicture', file);
                        }

                        formDataToSend.append('name', companyData.name);
                        formDataToSend.append('domain', companyData.domain);
                        formDataToSend.append('logo', companyData.logo);

                        // Contact Info - flatten the object
                        formDataToSend.append('contactInfo.phone', companyData.contactInfo?.phone || '');
                        formDataToSend.append('contactInfo.email', companyData.contactInfo?.email || '');
                        formDataToSend.append('contactInfo.website', companyData.contactInfo?.website || '');

                        // Address - flatten the object
                        formDataToSend.append('address.street', companyData.address?.street || '');
                        formDataToSend.append('address.city', companyData.address?.city || '');
                        formDataToSend.append('address.state', companyData.address?.state || '');
                        formDataToSend.append('address.country', companyData.address?.country || '');
                        formDataToSend.append('address.zipCode', companyData.address?.zipCode || '');

                        // CEO Info
                        formDataToSend.append('ceo.name', companyData.ceo?.name || '');
                        formDataToSend.append('ceo.email', companyData.ceo?.email || '');
                        formDataToSend.append('ceo.signature', companyData.ceo?.signature || '');
                        formDataToSend.append('ceo.bio', companyData.ceo?.bio || '');

                        // Settings
                        formDataToSend.append('settings.sender.userId', companyData.settings?.sender?.userId || '');

                        // Add settings
                        // formDataToSend.append('settings', companyData.settings);
                        formDataToSend.forEach((value, key) => {
                            console.log(key, value);
                        });
                        await updateCompanyInfo(formDataToSend).unwrap();
                        // } else {
                        // No file to upload, send regular JSON data
                        // await updateCompanyInfo(companyData).unwrap();
                        // }
                    }
                    break;

                case 'leave-types':
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
        <SecuritySettingsPage
            formData={formData}
            handleInputChange={handleInputChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleSave={handleSave}
        />
    );


    const renderCompanySettings = () => (
        <CompanySettingsPage
            companyData={companyData}
            handleSave={handleSave}
            handleCompanyDataChange={handleCompanyDataChange}
            setRecipientType={setRecipientType}
            setShowRecipientModal={setShowRecipientModal}
        />
    );

    const renderLeaveTypesManagement = () => (
        <LeaveTypesManagementPage
            leaveTypes={leaveTypes}
            statistics={statistics}
            pagination={pagination}
            handleQueryParamsChange={handleQueryParamsChange}
            openLeaveTypeModal={openLeaveTypeModal}
            handleDeleteLeaveType={handleDeleteLeaveType}
            isLoadingLeaveTypes={isLoadingLeaveTypes}
            isFetchingLeaveTypes={isFetchingLeaveTypes}
            leaveTypesError={leaveTypesError}
            handleManualRefresh={handleManualRefresh}
            isCreating={isCreating}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            queryParams={queryParams}
        />
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
                <RecipientModal
                    recipientType={recipientType}
                    setRecipientType={setRecipientType}
                    newRecipient={newRecipient}
                    setNewRecipient={setNewRecipient}
                    setShowRecipientModal={setShowRecipientModal}
                    handleAddRecipient={handleAddRecipient}
                />
            )}

            {/* Leave Type Modal */}
            {showLeaveTypeModal && (
                <LeaveTypeModal
                    editingLeaveType={editingLeaveType}
                    setShowLeaveTypeModal={setShowLeaveTypeModal}
                    isCreating={isCreating}
                    isUpdating={isUpdating}
                    leaveTypeForm={leaveTypeForm}
                    handleLeaveTypeFormChange={handleLeaveTypeFormChange}
                    setEditingLeaveType={setEditingLeaveType}
                    handleSaveLeaveType={handleSaveLeaveType}
                />
            )}
        </div>
    );
};

export default CorrectedLeaveManagementSettings;