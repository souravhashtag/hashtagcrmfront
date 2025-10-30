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

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface CompanyData1 {
    name: string;
    domain: string;
    logo: string;
    contactInfo: {
        phone: string;
        email: string;
        website: string;
    };
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    ceo: {
        name: any,
        email: any,
        signature: any,
        bio: any,
        profileImage: string
    };
    settings: {
        considerableLateCount?: number;
        gracePeriod?: number; // in minutes
        ceoTalk: {
            Message: string;
        };
        recipients: {
            to: Recipient[];
            cc: Recipient[];
            bcc: Recipient[];
        };
    };
}

interface CompanySettingsPageProps {
    companyData: CompanyData1;
    handleCompanyDataChange: (field: string, value: any) => void;
    setRecipientType: React.Dispatch<React.SetStateAction<'to' | 'cc' | 'bcc'>>;
    setShowRecipientModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleSave: (section: string) => void;
}

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
    openLeaveTypeModal: (leaveType?: any) => void;
    isCreating: boolean;
    leaveTypes: any[];
    isUpdating: boolean;
    handleDeleteLeaveType: (id: string, name: string) => void;
    isDeleting: boolean;
    pagination: Pagination;
    queryParams: any;
    handleQueryParamsChange: (field: keyof QueryParams, value: any) => void;
}

interface SecurityFormData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    twoFactorEnabled: boolean;
}

interface SecuritySettingsPageProps {
    handleSave: (section: 'security') => void;
    showPassword: boolean;
    formData: SecurityFormData;
    handleInputChange: (field: keyof SecurityFormData, value: string | boolean) => void;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

interface CountryStateSelectorProps {
    selectedCountry?: string;
    selectedState?: string;
    onCountryChange: (countryCode: string, countryName: string) => void;
    onStateChange: (stateKey: string, stateName: string) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    label?: {
        country?: string;
        state?: string;
    };
}

type RecipientType = 'to' | 'cc' | 'bcc';

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface RecipientModalProps {
    recipientType: RecipientType;
    setRecipientType: React.Dispatch<React.SetStateAction<RecipientType>>;
    newRecipient: Recipient;
    setNewRecipient: React.Dispatch<React.SetStateAction<Recipient>>;
    setShowRecipientModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleAddRecipient: () => void;
}
interface LeaveTypeFormData {
    name: string;
    leaveCount: number;
    monthlyDays: number;
    ispaidLeave: boolean;
    carryforward: boolean;
}

interface Props {
    editingLeaveType: any | null;
    setShowLeaveTypeModal: (show: boolean) => void;
    isCreating: boolean;
    isUpdating: boolean;
    leaveTypeForm: {
        name: string;
        leaveCount: number;
        monthlyDays: number;
        ispaidLeave: boolean;
        carryforward: boolean;
    };
    handleLeaveTypeFormChange: (field: keyof LeaveTypeFormData, value: any) => void;
    setEditingLeaveType: (leaveType: null | {
        _id: string;
        name: string;
        leaveCount: number;
        monthlyDays: number;
        ispaidLeave: boolean;
        carryforward: boolean;
        createdAt: string;
        updatedAt: string;
    }) => void;
    handleSaveLeaveType: () => void;
}

interface LeaveFormData {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay: boolean;
    attachments: File[];
}

interface LeaveApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    editLeaveId?: string;
    onSuccess?: () => void;
    leavesData?: any;
}

// TypeScript interfaces for populated data
interface PopulatedUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: {
        _id: string;
        name: string;
    };
}

interface PopulatedEmployee {
    _id: string;
    employeeId: string;
    userId: PopulatedUser;
}

interface PopulatedLeave {
    _id: string;
    employeeId: PopulatedEmployee | string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approvedBy?: PopulatedUser | string;
    approvalDate?: string;
    rejectionReason?: string;
    attachments?: Array<{
        name: string;
        url: string;
        uploadedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface User {
    _id: string;
    role: {
        name: string;
    };
}

interface LeaveViewProps {
    user?: User;
}

