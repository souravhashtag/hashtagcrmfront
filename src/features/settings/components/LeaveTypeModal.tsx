import { Loader2, Save, X } from 'lucide-react';
import React from 'react';
import { LeaveType, LeaveTypeFormData } from '../../../services/leaveTypesServices';


interface Props {
    editingLeaveType: LeaveType | null;
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

const LeaveTypeModal = ({
    editingLeaveType,
    setShowLeaveTypeModal,
    isCreating,
    isUpdating,
    leaveTypeForm,
    handleLeaveTypeFormChange,
    setEditingLeaveType,
    handleSaveLeaveType
}: Props) => {

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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Days *</label>
                        <input
                            type="number"
                            step="0.5"  // 👈 allow .5 steps
                            value={leaveTypeForm.monthlyDays ?? 0}
                            onChange={(e) => {
                                let monthly = parseFloat(e.target.value) || 0;

                                // ensure max = 5
                                if (monthly > 5) monthly = 5;
                                if (monthly < 0) monthly = 0;

                                handleLeaveTypeFormChange('monthlyDays', monthly);
                                handleLeaveTypeFormChange('leaveCount', monthly * 12); // auto yearly
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            min="0"
                            max="5"
                            placeholder="e.g., 2.5"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Days Per Year</label>
                        <input
                            type="number"
                            value={leaveTypeForm.leaveCount ?? 0}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Calculated automatically (Monthly × 12)</p>
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
    );
};

export default LeaveTypeModal;
