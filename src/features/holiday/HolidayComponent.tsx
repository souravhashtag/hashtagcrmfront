import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import {
    useGetHolidaysQuery,
    useCreateHolidayMutation,
    useUpdateHolidayMutation,
    useDeleteHolidayMutation,
    Holiday,
    HolidayFormData
} from '../../services/holidayServices';
import HolidayModal from './components/HolidayModal';
import Pagination from './components/Pagination';
import HolidayTable from './components/HolidayTable';

const HolidayComponent: React.FC = () => {
    // State for filters and UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showPastHolidays, setShowPastHolidays] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
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
        const confirmed = window.confirm(
            'Are you sure you want to delete this holiday? This action cannot be undone.'
        );

        if (!confirmed) return; // exit if user cancels

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
        <div className="p-6 bg-gray-50 min-h-fit rounded-lg">
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
                        className="inline-flex items-center gap-2 px-4 py-4 bg-[#129990] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#1dbfb4] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Holiday
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        {/* Search */}
                        <div className="relative w-[400px]">
                            <Search className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search holidays..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-transparent w-64"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-[600px]border border-gray-300 rounded-md px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-transparent"
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
                        <HolidayTable
                            holidays={holidays}
                            isUpcoming={isUpcoming}
                            formatDate={formatDate}
                            isToday={isToday}
                            getDayFromYMD={getDayFromYMD}
                            getTypeBadge={getTypeBadge}
                            getStatusBadge={getStatusBadge}
                            openModal={openModal}
                            isDeleting={isDeleting}
                            deletingId={deletingId}
                            handleDelete={handleDelete}
                        />

                        {/* Pagination */}
                        <Pagination
                            pagination={pagination}
                            itemsPerPage={itemsPerPage}
                            setCurrentPage={setCurrentPage}
                        />

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
                <HolidayModal
                    editingHoliday={editingHoliday}
                    closeModal={closeModal}
                    isSaving={isSaving}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    errors={errors}
                    handleSubmit={handleSubmit}
                />
            )}
        </div>
    );
};

export default HolidayComponent;