import { Edit3, Loader2, Trash2 } from 'lucide-react';
import React from 'react';


type HolidayType = 'company' | 'national' | 'religious';

interface Holiday {
    _id: string;
    name: string;
    date: string;
    type: HolidayType;
    description?: string;
    day?: string;
    isRecurring?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface HolidayTableProps {
    holidays: Holiday[];
    isUpcoming: (date: string) => boolean;
    formatDate: (date: string) => string;
    isToday: (date: string) => boolean;
    getDayFromYMD: (date: string) => string;
    getTypeBadge: (type: HolidayType) => React.ReactNode;
    getStatusBadge: (date: string) => React.ReactNode;
    openModal: (holiday: any) => void;
    isDeleting: boolean;
    deletingId?: string | null;
    handleDelete: (id: string) => void;
}


const HolidayTable = ({
    holidays,
    isUpcoming,
    formatDate,
    isToday,
    getDayFromYMD,
    getTypeBadge,
    getStatusBadge,
    openModal,
    isDeleting,
    deletingId,
    handleDelete
}: HolidayTableProps) => {
    return (
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
    );
};

export default HolidayTable;
