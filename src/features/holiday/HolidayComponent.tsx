import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit3, Trash2, X, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import {
    useGetHolidaysQuery,
    useCreateHolidayMutation,
    useUpdateHolidayMutation,
    useDeleteHolidayMutation,
    Holiday,
    HolidayFormData
} from '../../services/holidayServices';

const HolidayComponent: React.FC = () => {
    // State for filters and UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showPastHolidays, setShowPastHolidays] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState<HolidayFormData>({
        name: '',
        date: '',
        type: 'company',
        description: '',
        isRecurring: false,
        appliesTo: ['all']
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // RTK Query hooks
    const {
        data: holidaysResponse,
        isLoading,
        isError,
        error,
        refetch
    } = useGetHolidaysQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        type: filterType === 'all' ? undefined : filterType, // <-- key fix
        includePast: showPastHolidays
    });


    const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
    const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
    const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();


    const isSaving = isCreating || isUpdating;           // for modal save
    const isMutating = isSaving || isDeleting;           // any mutation in flight
    const [deletingId, setDeletingId] = useState<string | null>(null); // row-level delete spinner

    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, showPastHolidays]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const openModal = (holiday?: Holiday) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setFormData({
                name: holiday.name,
                date: holiday.date,
                type: holiday.type,
                description: holiday.description || '',
                isRecurring: holiday.isRecurring,
                appliesTo: holiday.appliesTo
            });
        } else {
            setEditingHoliday(null);
            setFormData({
                name: '',
                date: '',
                type: 'company',
                description: '',
                isRecurring: false,
                appliesTo: ['all']
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingHoliday(null);
        setFormData({
            name: '',
            date: '',
            type: 'company',
            description: '',
            isRecurring: false,
            appliesTo: ['all']
        });
        setErrors({});
    };

    const handleInputChange = (field: keyof HolidayFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Holiday name is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // put near your other helpers
    const getDayFromYMD = (ymd: string, locale = 'en-IN') => {
        if (!ymd) return '';
        const [y, m, d] = ymd.split('-').map(Number);
        // Use UTC so "YYYY-MM-DD" isn't shifted by local timezone
        const dt = new Date(Date.UTC(y, m - 1, d));
        return dt.toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' });
    };


    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const payload = {
                ...formData,
                day: getDayFromYMD(formData.date) // <-- add computed day
            };

            if (editingHoliday) {
                await updateHoliday({ id: editingHoliday._id, data: payload }).unwrap();
            } else {
                await createHoliday(payload).unwrap();
                refetch();
            }
            closeModal();
        } catch (error: any) {
            console.error('Error saving holiday:', error);
            setErrors({ submit: error?.data?.message || 'Failed to save holiday' });
        }
    };

    const handleDelete = async (holidayId: string) => {
        try {
            setDeletingId(holidayId);
            await deleteHoliday({ id: holidayId, permanent: false }).unwrap();
            refetch();
        } catch (error: any) {
            console.error('Error deleting holiday:', error);
            alert(error?.data?.message || 'Failed to delete holiday');
        } finally {
            setDeletingId(null);
        }
    };


    const getTypeBadge = (type: string) => {
        const styles = {
            national: 'bg-blue-100 text-blue-800',
            religious: 'bg-purple-100 text-purple-800',
            company: 'bg-green-100 text-green-800'
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
        );
    };

    const isUpcoming = (date: string) => date >= today;
    const isToday = (date: string) => date === today;

    const getStatusBadge = (date: string) => {
        if (isToday(date)) {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    Today
                </span>
            );
        } else if (isUpcoming(date)) {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Upcoming
                </span>
            );
        } else {
            return (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    Past
                </span>
            );
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-[#129990]" />
                        <span className="text-gray-600">Loading holidays...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mt-20">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-900">Error Loading Holidays</h3>
                    </div>
                    <p className="text-red-700 mb-4">
                        {(error as any)?.data?.message || 'Failed to load holidays. Please try again.'}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const holidays = holidaysResponse?.data
        ?? holidaysResponse?.items
        ?? holidaysResponse
        ?? [];
    const pagination = holidaysResponse?.pagination ?? {
        currentPage: 1,
        totalItems: holidays.length,
        totalPages: 1
    };


    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Holiday Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage company holidays and events - Showing today's and upcoming holidays
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Holiday
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search holidays..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-transparent w-64"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="national">National</option>
                            <option value="religious">Religious</option>
                            <option value="company">Company</option>
                        </select>
                    </div>

                    {/* Toggle for Past Holidays */}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={showPastHolidays}
                                onChange={(e) => setShowPastHolidays(e.target.checked)}
                                className="w-4 h-4 text-[#129990] border-gray-300 rounded focus:ring-[#129990]"
                            />
                            Include Past Holidays
                        </label>
                    </div>
                </div>
            </div>

            {/* Holiday Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {holidays.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Day
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Holiday Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {holidays.map((holiday: any) => (
                                        <tr
                                            key={holiday._id}
                                            className={`hover:bg-gray-50 ${isToday(holiday.date)
                                                ? 'border-l-4 border-orange-500 bg-orange-50'
                                                : isUpcoming(holiday.date)
                                                    ? 'border-l-4 border-[#129990]'
                                                    : ''
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(holiday.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {holiday.day || getDayFromYMD(holiday.date)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {holiday.name}
                                                    </div>
                                                    {holiday.description && (
                                                        <div className="text-sm text-gray-500">
                                                            {holiday.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTypeBadge(holiday.type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(holiday.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(holiday)}
                                                        disabled={isDeleting && deletingId === holiday._id}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(holiday._id)}
                                                        disabled={isDeleting && deletingId === holiday._id}
                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete"
                                                    >
                                                        {isDeleting && deletingId === holiday._id
                                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                                            : <Trash2 className="w-4 h-4" />
                                                        }
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">
                                            {(pagination.currentPage - 1) * itemsPerPage + 1}
                                        </span> to <span className="font-medium">
                                            {Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems)}
                                        </span> of <span className="font-medium">{pagination.totalItems}</span> results
                                    </p>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={pagination.currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.currentPage === pageNum
                                                    ? 'z-10 bg-[#129990] border-[#129990] text-white'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(p + 1, pagination.totalPages))}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        )}

                    </>
                ) : (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm ?
                                `No holidays match "${searchTerm}"` :
                                'Get started by adding your first holiday'
                            }
                        </p>
                        <button
                            onClick={() => openModal()}
                            disabled={isMutating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isMutating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isCreating ? 'Adding...' : isUpdating ? 'Updating...' : 'Deleting...'}
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add New Holiday
                                </>
                            )}
                        </button>

                    </div>
                )}
            </div>

            {/* Add/Edit Holiday Modal */}
            {showModal && (
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
            )}
        </div>
    );
};

export default HolidayComponent;