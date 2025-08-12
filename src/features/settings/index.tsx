import React, { useState, useEffect } from 'react';
import {
    Shield,
    Save,
    Plus,
    Edit3,
    Trash2,
    Check,
    X,
    Calendar,
    Clock,
    Users,
    Settings,
    Eye,
    EyeOff,
    CheckCircle
} from 'lucide-react';

interface SettingsSection {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    description: string;
}

interface LeaveType {
    id: string;
    name: string;
    code: string;
    description: string;
    maxDaysPerYear: number;
    requiresApproval: boolean;
    isCarryForward: boolean;
    color: string;
    isActive: boolean;
}

const settingsSections: SettingsSection[] = [
    {
        id: 'security',
        name: 'Security & Privacy',
        icon: Shield,
        description: 'Password, two-factor authentication, and privacy settings'
    },
    {
        id: 'leave-types',
        name: 'Leave Management',
        icon: Calendar,
        description: 'Manage leave types, policies, and configurations'
    }
];

const LeaveManagementSettings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('security');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        // Security Settings
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false,
    });

    // Leave Types Management State
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
        {
            id: '1',
            name: 'Annual Leave',
            code: 'AL',
            description: 'Annual vacation leave for personal time off',
            maxDaysPerYear: 25,
            requiresApproval: true,
            isCarryForward: true,
            color: '#3B82F6',
            isActive: true
        },
        {
            id: '2',
            name: 'Sick Leave',
            code: 'SL',
            description: 'Medical leave for illness or medical appointments',
            maxDaysPerYear: 10,
            requiresApproval: false,
            isCarryForward: false,
            color: '#EF4444',
            isActive: true
        },
        {
            id: '3',
            name: 'Personal Leave',
            code: 'PL',
            description: 'Personal time off for family or personal matters',
            maxDaysPerYear: 5,
            requiresApproval: true,
            isCarryForward: false,
            color: '#10B981',
            isActive: true
        },
        {
            id: '4',
            name: 'Maternity Leave',
            code: 'ML',
            description: 'Maternity leave for new mothers',
            maxDaysPerYear: 120,
            requiresApproval: true,
            isCarryForward: false,
            color: '#8B5CF6',
            isActive: true
        }
    ]);

    const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
    const [leaveTypeForm, setLeaveTypeForm] = useState({
        name: '',
        code: '',
        description: '',
        maxDaysPerYear: 0,
        requiresApproval: true,
        isCarryForward: false,
        color: '#3B82F6',
        isActive: true
    });

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLeaveTypeFormChange = (field: string, value: any) => {
        setLeaveTypeForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async (section: string) => {
        setSaveStatus('saving');
        // Simulate API call
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);
    };

    const openLeaveTypeModal = (leaveType?: LeaveType) => {
        if (leaveType) {
            setEditingLeaveType(leaveType);
            setLeaveTypeForm({
                name: leaveType.name,
                code: leaveType.code,
                description: leaveType.description,
                maxDaysPerYear: leaveType.maxDaysPerYear,
                requiresApproval: leaveType.requiresApproval,
                isCarryForward: leaveType.isCarryForward,
                color: leaveType.color,
                isActive: leaveType.isActive
            });
        } else {
            setEditingLeaveType(null);
            setLeaveTypeForm({
                name: '',
                code: '',
                description: '',
                maxDaysPerYear: 0,
                requiresApproval: true,
                isCarryForward: false,
                color: '#3B82F6',
                isActive: true
            });
        }
        setShowLeaveTypeModal(true);
    };

    const handleSaveLeaveType = () => {
        if (editingLeaveType) {
            // Update existing leave type
            setLeaveTypes(prev => prev.map(lt => 
                lt.id === editingLeaveType.id 
                    ? { ...lt, ...leaveTypeForm }
                    : lt
            ));
        } else {
            // Add new leave type
            const newLeaveType: LeaveType = {
                id: Date.now().toString(),
                ...leaveTypeForm
            };
            setLeaveTypes(prev => [...prev, newLeaveType]);
        }
        setShowLeaveTypeModal(false);
        setEditingLeaveType(null);
    };

    const handleDeleteLeaveType = (id: string) => {
        if (window.confirm('Are you sure you want to delete this leave type?')) {
            setLeaveTypes(prev => prev.filter(lt => lt.id !== id));
        }
    };

    const toggleLeaveTypeStatus = (id: string) => {
        setLeaveTypes(prev => prev.map(lt => 
            lt.id === id ? { ...lt, isActive: !lt.isActive } : lt
        ));
    };

    // Toggle Switch Component (matching original design)
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
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Security Settings'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLeaveTypesManagement = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Leave Types Management</h2>
                <p className="text-sm text-teal-100">Configure and manage leave types for your organization</p>
            </div>

            <div className="p-6">
                {/* Stats Cards - matching original design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">{leaveTypes.length}</div>
                        <div className="text-sm text-gray-600 font-medium">Total Leave Types</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">{leaveTypes.filter(lt => lt.isActive).length}</div>
                        <div className="text-sm text-gray-600 font-medium">Active Types</div>
                    </div>
                </div>

                {/* Add New Leave Type Button - matching original style */}
                <div className="mb-8">
                    <button
                        onClick={() => openLeaveTypeModal()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Leave Type
                    </button>
                </div>

                {/* Leave Types List */}
                <div className="space-y-4">
                    {leaveTypes.map((leaveType) => (
                        <div key={leaveType.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow bg-white">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div 
                                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: leaveType.color }}
                                        ></div>
                                        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            {leaveType.name}
                                        </h3>
                                        <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                                            {leaveType.code}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            leaveType.isActive 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {leaveType.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4 text-sm">{leaveType.description}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Days/Year</span>
                                            <span className="text-lg font-bold text-[#129990]">{leaveType.maxDaysPerYear}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requires Approval</span>
                                            <span className="text-lg font-bold text-[#129990]">{leaveType.requiresApproval ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Carry Forward</span>
                                            <span className="text-lg font-bold text-[#129990]">{leaveType.isCarryForward ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-6">
                                    <button
                                        onClick={() => toggleLeaveTypeStatus(leaveType.id)}
                                        className={`p-2 rounded-md transition-colors ${
                                            leaveType.isActive 
                                                ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' 
                                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                        }`}
                                        title={leaveType.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {leaveType.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openLeaveTypeModal(leaveType)}
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-md transition-colors"
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLeaveType(leaveType.id)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {leaveTypes.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No leave types configured yet</h3>
                        <p className="text-gray-500 mb-6">Add your first leave type to get started with leave management.</p>
                        <button
                            onClick={() => openLeaveTypeModal()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Leave Type
                        </button>
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
            <div className="flex">
                {/* Left Sidebar Navigation - exact match to original */}
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
                                        className={`w-full flex items-start gap-3 p-4 rounded-lg text-left transition-all duration-200 ${
                                            activeSection === section.id
                                                ? 'bg-[#129990] text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-[#129990]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 mt-0.5">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold mb-1">{section.name}</span>
                                            <span className={`block text-xs leading-tight ${
                                                activeSection === section.id
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

                        {/* Save Status Indicator - exact match to original */}
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
                        <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
                            </h3>
                            <p className="text-sm text-teal-100 mt-1">
                                {editingLeaveType ? 'Update leave type details' : 'Create a new leave type for your organization'}
                            </p>
                        </div>

                        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type Name</label>
                                    <input
                                        type="text"
                                        value={leaveTypeForm.name}
                                        onChange={(e) => handleLeaveTypeFormChange('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                        placeholder="e.g., Annual Leave"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
                                    <input
                                        type="text"
                                        value={leaveTypeForm.code}
                                        onChange={(e) => handleLeaveTypeFormChange('code', e.target.value.toUpperCase())}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                        placeholder="e.g., AL"
                                        maxLength={5}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={leaveTypeForm.description}
                                    onChange={(e) => handleLeaveTypeFormChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    rows={3}
                                    placeholder="Brief description of this leave type"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Days Per Year</label>
                                    <input
                                        type="number"
                                        value={leaveTypeForm.maxDaysPerYear}
                                        onChange={(e) => handleLeaveTypeFormChange('maxDaysPerYear', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                        min="0"
                                        placeholder="25"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color Theme</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={leaveTypeForm.color}
                                            onChange={(e) => handleLeaveTypeFormChange('color', e.target.value)}
                                            className="w-12 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={leaveTypeForm.color}
                                            onChange={(e) => handleLeaveTypeFormChange('color', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                            placeholder="#3B82F6"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700">Policy Settings</h4>
                                
                                <ToggleSwitch
                                    checked={leaveTypeForm.requiresApproval}
                                    onChange={(checked) => handleLeaveTypeFormChange('requiresApproval', checked)}
                                    label="Requires Approval"
                                    description="Employees need manager approval for this leave type"
                                />

                                <ToggleSwitch
                                    checked={leaveTypeForm.isCarryForward}
                                    onChange={(checked) => handleLeaveTypeFormChange('isCarryForward', checked)}
                                    label="Allow Carry Forward"
                                    description="Unused days can be carried to next year"
                                />

                                <ToggleSwitch
                                    checked={leaveTypeForm.isActive}
                                    onChange={(checked) => handleLeaveTypeFormChange('isActive', checked)}
                                    label="Active Status"
                                    description="This leave type is available for employees to use"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowLeaveTypeModal(false);
                                    setEditingLeaveType(null);
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLeaveType}
                                disabled={!leaveTypeForm.name || !leaveTypeForm.code}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {editingLeaveType ? 'Update Leave Type' : 'Create Leave Type'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManagementSettings;