import { Globe, Mail, MapPin, MessageSquare, Phone, Plus, Save, Send, Upload, X } from 'lucide-react';
import React from 'react';

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface CompanyData {
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
    settings: {
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
    companyData: CompanyData;
    handleCompanyDataChange: (field: string, value: any) => void;
    setRecipientType: React.Dispatch<React.SetStateAction<'to' | 'cc' | 'bcc'>>;
    setShowRecipientModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleSave: (section: string) => void;
}

const CompanySettingsPage = ({
    companyData,
    handleCompanyDataChange,
    setRecipientType,
    setShowRecipientModal,
    handleSave
}: CompanySettingsPageProps) => {
    return (
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
};

export default CompanySettingsPage;
