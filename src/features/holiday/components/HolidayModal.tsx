import { Calendar, Loader2, X } from 'lucide-react';
import React from 'react';
import { HolidayFormData } from '../../../services/holidayServices';


interface HolidayModalProps {
    editingHoliday?: HolidayFormData | null;
    closeModal: () => void;
    isSaving: boolean;
    formData: HolidayFormData;
    handleInputChange: <K extends keyof HolidayFormData>(
        field: K,
        value: HolidayFormData[K]
    ) => void;
    errors: Partial<Record<keyof HolidayFormData, string>>;
    handleSubmit: () => void;
}


const HolidayModal = ({
    editingHoliday,
    closeModal,
    isSaving,
    formData,
    handleInputChange,
    errors,
    handleSubmit
}: HolidayModalProps) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-[#129990]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                        </h3>
                        <button
                            onClick={closeModal}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-teal-100 mt-1">
                        {editingHoliday ? 'Update holiday information' : 'Create a new holiday entry'}
                    </p>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4 space-y-6">
                    {isSaving && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="inline-flex items-center gap-2 text-[#129990]">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {editingHoliday ? 'Updating...' : 'Saving...'}
                            </span>
                        </div>
                    )}

                    {/* Holiday Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Holiday Name *
                        </label>
                        <input
                            type="text"
                            placeholder="Holiday Name"
                            disabled={isSaving}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#129990] focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Date *
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                disabled={isSaving}
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#129990] focus:border-transparent ${errors.date ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>
                        {errors.date && (
                            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Holiday Type
                        </label>
                        <select
                            value={formData.type}
                            disabled={isSaving}
                            onChange={(e) => handleInputChange('type', e.target.value as 'national' | 'religious' | 'company')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#129990] focus:border-transparent"
                        >
                            <option value="company">Company</option>
                            <option value="national">National</option>
                            <option value="religious">Religious</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            placeholder="Holiday description (optional)"
                            disabled={isSaving}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#129990] focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Recurring Checkbox */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isRecurring"
                            checked={formData.isRecurring}
                            onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                            className="w-4 h-4 text-[#129990] border-gray-300 rounded focus:ring-[#129990]"
                        />
                        <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                            Recurring Holiday (occurs annually)
                        </label>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={closeModal}
                        disabled={isSaving}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#129990] text-white rounded-md hover:bg-[#0f7a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {editingHoliday ? 'Updating...' : 'Saving...'}
                            </span>
                        ) : (
                            editingHoliday ? 'Update' : 'Add'
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default HolidayModal;
