import { Plus } from 'lucide-react';
import React from 'react';

const RecipientModal = ({
    recipientType,
    setRecipientType,
    newRecipient,
    setNewRecipient,
    setShowRecipientModal,
    handleAddRecipient
}: RecipientModalProps) => {
    return (
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
    );
};

export default RecipientModal;
