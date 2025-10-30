import React, { JSX, useEffect, useState } from 'react';
import { getIndividualAttendanceDataByDate } from '../../../../services/AttendanceService';
import { getUserData } from '../../../../services/authService';

const IndivisualAttendance = (): JSX.Element => {
    const [selectedMonth, setSelectedMonth] = useState<string>('2025-10'); // default month
    const [attendanceData, setAttendanceData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            const res = await getUserData();
            setUser(res.user);
        };

        fetchUserData();
    }, []);

    // Fetch attendance data from API
    useEffect(() => {
        if (!user?._id) return; // wait until user is loaded

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getIndividualAttendanceDataByDate({
                    employeeId: user._id,
                    startDate: `${selectedMonth}-01`,
                    endDate: `${selectedMonth}-31`,
                    page: 1,
                    limit: 50,
                    sort: 'asc',
                });

                setAttendanceData(data?.data?.[0] || null);
            } catch (err: any) {
                setError('Failed to fetch attendance data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?._id, selectedMonth]);

    const getDaysInMonth = (month: string): number => {
        if (!month) return 0;
        const [year, mon] = month.split('-');
        return new Date(Number(year), Number(mon), 0).getDate();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Present</span>;
            case '-':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600">Not Logged</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Absent</span>;
        }
    };

    if (loading) return <div className="text-center p-6 text-gray-600">Loading attendance...</div>;
    if (error) return <div className="text-center text-red-600 p-6">{error}</div>;
    if (!attendanceData) return <div className="text-center text-gray-600 p-6 items-center">No attendance data available <button onClick={() => { window.location.reload() }} className='block p-3 bg-blue-500 text-white rounded border rounded-lg mx-auto mt-5'>Refresh</button></div>;

    const { userId, attendance } = attendanceData;
    const daysInMonth = getDaysInMonth(selectedMonth);

    return (
        <div className="font-sans bg-gray-100 min-h-screen p-6 border rounded-lg">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between items-center">
                {/* Header */}
                <div className="header text-start text-teal-700 mb-5">
                    <h1 className="text-2xl font-bold">My Attendance</h1>
                </div>

                {/* Month Selector */}
                <div className="text-center mb-5">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border rounded p-2 text-gray-700"
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <div className="max-w-full mx-auto rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full border-collapse text-sm sm:text-base">
                    <thead className="bg-teal-700 text-white">
                        <tr>
                            <th className="p-3 text-left min-w-[150px]">Date</th>
                            <th className="p-3 text-left  min-w-[120px]">Status</th>
                            <th className="p-3 text-left  min-w-[90px]">In Time</th>
                            <th className="p-3 text-left  min-w-[90px]">Out Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const [year, month] = selectedMonth.split('-');
                            const dateObj = new Date(Number(year), Number(month) - 1, day);

                            // Full date with weekday, e.g., Friday, 10 October 2025
                            const fullDate = dateObj.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                                day: '2-digit',
                                weekday: 'long',
                            });

                            const formattedDate = `${day.toString().padStart(2, '0')}/${month}/${year}`;
                            const dayData = attendance?.[formattedDate] || { status: '-' };
                            const status = dayData.status;

                            const inTime = dayData.clockIn
                                ? new Date(dayData.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '--';
                            const outTime = dayData.clockOut
                                ? new Date(dayData.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '--';

                            return (
                                <tr key={day} className="border-b last:border-none hover:bg-gray-50 transition">
                                    <td className="p-3 text-gray-700 font-medium">{fullDate}</td>
                                    <td className="p-3">{getStatusBadge(status)}</td>
                                    <td className="p-3 text-gray-600">{inTime}</td>
                                    <td className="p-3 text-gray-600">{outTime}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IndivisualAttendance;
