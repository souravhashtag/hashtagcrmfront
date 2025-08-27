import { Eye, EyeOff, Save } from 'lucide-react';
import React from 'react';


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

const SecuritySettingsPage = ({
    handleSave,
    showPassword,
    formData,
    handleInputChange,
    setShowPassword
}: SecuritySettingsPageProps) => {

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
    return (
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
};

export default SecuritySettingsPage;
