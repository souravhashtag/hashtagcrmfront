import React, { useState, useEffect } from 'react';
import {
    User,
    Shield,
    Bell,
    Globe,
    Palette,
    Database,
    Users,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Save,
    RefreshCw,
    Download,
    Upload,
    Trash2,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

interface SettingsSection {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    description: string;
}

const settingsSections: SettingsSection[] = [
    {
        id: 'security',
        name: 'Security & Privacy',
        icon: Shield,
        description: 'Password, two-factor authentication, and privacy settings'
    },
    // {
    //     id: 'notifications',
    //     name: 'Notifications',
    //     icon: Bell,
    //     description: 'Configure email and push notification preferences'
    // },
    // {
    //     id: 'appearance',
    //     name: 'Appearance',
    //     icon: Palette,
    //     description: 'Customize theme, layout, and display preferences'
    // },
    // {
    //     id: 'system',
    //     name: 'System Settings',
    //     icon: Database,
    //     description: 'Application configuration and system preferences'
    // },
    {
        id: 'users',
        name: 'User Management',
        icon: Users,
        description: 'Manage users, roles, and permissions'
    }
];

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        // Profile Settings
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1 234 567 8900',
        jobTitle: 'Software Engineer',
        department: 'Engineering',

        // Security Settings
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false,

        // Notification Settings
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        systemAlerts: true,

        // Appearance Settings
        theme: 'dark',
        language: 'en',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',

        // System Settings
        autoBackup: true,
        backupFrequency: 'daily',
        sessionTimeout: '30',
        allowMultipleSessions: false
    });

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
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

    const renderProfileSettings = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile Settings</h2>
                <p className="text-sm text-teal-100">Manage your personal information and account details</p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Title
                        </label>
                        <input
                            type="text"
                            id="jobTitle"
                            value={formData.jobTitle}
                            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                            Department
                        </label>
                        <select
                            id="department"
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm cursor-pointer"
                        >
                            <option value="Engineering">Engineering</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Sales">Sales</option>
                            <option value="HR">Human Resources</option>
                            <option value="Finance">Finance</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={() => handleSave('profile')}
                        disabled={saveStatus === 'saving'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
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

    const renderNotificationSettings = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Notifications</h2>
                <p className="text-sm text-teal-100">Configure your email and push notification preferences</p>
            </div>

            <div className="p-6">
                <div className="space-y-0">
                    <ToggleSwitch
                        checked={formData.emailNotifications}
                        onChange={(checked) => handleInputChange('emailNotifications', checked)}
                        label="Email Notifications"
                        description="Receive important updates via email"
                    />
                    <ToggleSwitch
                        checked={formData.pushNotifications}
                        onChange={(checked) => handleInputChange('pushNotifications', checked)}
                        label="Push Notifications"
                        description="Get real-time notifications in your browser"
                    />
                    <ToggleSwitch
                        checked={formData.weeklyReports}
                        onChange={(checked) => handleInputChange('weeklyReports', checked)}
                        label="Weekly Reports"
                        description="Receive weekly activity summaries"
                    />
                    <ToggleSwitch
                        checked={formData.systemAlerts}
                        onChange={(checked) => handleInputChange('systemAlerts', checked)}
                        label="System Alerts"
                        description="Get notified about system maintenance and updates"
                    />
                </div>

                <div className="pt-6 border-t border-gray-200 mt-6">
                    <button
                        onClick={() => handleSave('notifications')}
                        disabled={saveStatus === 'saving'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderAppearanceSettings = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Appearance</h2>
                <p className="text-sm text-teal-100">Customize theme, layout, and display preferences</p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 mb-2">
                            Theme
                        </label>
                        <select
                            id="theme"
                            value={formData.theme}
                            onChange={(e) => handleInputChange('theme', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm cursor-pointer"
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto (System)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-2">
                            Language
                        </label>
                        <select
                            id="language"
                            value={formData.language}
                            onChange={(e) => handleInputChange('language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm cursor-pointer"
                        >
                            <option value="en">English</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="dateFormat" className="block text-sm font-semibold text-gray-700 mb-2">
                            Date Format
                        </label>
                        <select
                            id="dateFormat"
                            value={formData.dateFormat}
                            onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm cursor-pointer"
                        >
                            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="timeFormat" className="block text-sm font-semibold text-gray-700 mb-2">
                            Time Format
                        </label>
                        <select
                            id="timeFormat"
                            value={formData.timeFormat}
                            onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm cursor-pointer"
                        >
                            <option value="12h">12 Hour</option>
                            <option value="24h">24 Hour</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={() => handleSave('appearance')}
                        disabled={saveStatus === 'saving'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Appearance Settings'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSystemSettings = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>System Settings</h2>
                <p className="text-sm text-teal-100">Application configuration and system preferences</p>
            </div>

            <div className="p-6">
                <div className="mb-8 pb-6 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Backup & Data</h3>

                    <ToggleSwitch
                        checked={formData.autoBackup}
                        onChange={(checked) => handleInputChange('autoBackup', checked)}
                        label="Automatic Backup"
                        description="Automatically backup your data"
                    />

                    <div className="mt-4">
                        <label htmlFor="backupFrequency" className="block text-sm font-semibold text-gray-700 mb-2">
                            Backup Frequency
                        </label>
                        <select
                            id="backupFrequency"
                            value={formData.backupFrequency}
                            onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                            disabled={!formData.autoBackup}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                            <Download className="w-4 h-4" />
                            Download Backup
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                            <Upload className="w-4 h-4" />
                            Restore from Backup
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Session Management</h3>

                    <div className="mb-4">
                        <label htmlFor="sessionTimeout" className="block text-sm font-semibold text-gray-700 mb-2">
                            Session Timeout (minutes)
                        </label>
                        <input
                            type="number"
                            id="sessionTimeout"
                            value={formData.sessionTimeout}
                            onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                            min="5"
                            max="480"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>

                    <ToggleSwitch
                        checked={formData.allowMultipleSessions}
                        onChange={(checked) => handleInputChange('allowMultipleSessions', checked)}
                        label="Allow Multiple Sessions"
                        description="Allow the same user to login from multiple devices"
                    />
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={() => handleSave('system')}
                        disabled={saveStatus === 'saving'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save System Settings'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLeaveManagement = () => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>User Management</h2>
                <p className="text-sm text-teal-100">Manage users, roles, and permissions</p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">24</div>
                        <div className="text-sm text-gray-600 font-medium">Total Users</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">18</div>
                        <div className="text-sm text-gray-600 font-medium">Active Users</div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-[#129990] mb-2">6</div>
                        <div className="text-sm text-gray-600 font-medium">Roles</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors">
                        <Users className="w-4 h-4" />
                        Manage Users
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                        <Shield className="w-4 h-4" />
                        Manage Roles
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                        <Lock className="w-4 h-4" />
                        Permissions
                    </button>
                </div>

                <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                    <h3 className="text-base font-semibold text-red-700 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                            <Trash2 className="w-4 h-4" />
                            Clear All User Sessions
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                            Reset All Passwords
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'security':
                return renderSecuritySettings();
            // case 'notifications':
            //     return renderNotificationSettings();
            // case 'appearance':
            //     return renderAppearanceSettings();
            // case 'system':
            //     return renderSystemSettings();
            case 'users':
                return renderLeaveManagement();
            default:
                return renderSecuritySettings();
        }
    };

    return (
        <div className="bg-[#E8EDF2] min-h-screen">
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
        </div>
    );
};

export default Settings;