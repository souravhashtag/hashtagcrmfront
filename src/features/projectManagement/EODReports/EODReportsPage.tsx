import React, { useState, useEffect } from "react";
import EODReportModal from "./components/EODReportModal";

interface Activity {
    activity: string;
    startTime: string;
    endTime: string;
    description: string;
    status: "Pending" | "Ongoing" | "Completed";
}

interface EODReport {
    _id?: string;
    employeeName: string;
    position: string;
    department: string;
    date: string;
    activities: Activity[];
    plans: string;
    issues: string;
    comments: string;
}

export default function EODReportsPage() {
    const [reports, setReports] = useState<EODReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);


    // Fetch all reports from backend
    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/eod-reports"); // 👈 adjust endpoint
            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error("Error fetching reports:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen rounded-lg">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My EOD Reports</h1>
                    <p className="text-gray-600 mt-1">Track your daily activities and challenges</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#1dbfb4]"
                >
                    + New Report
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
                <input className="border rounded-lg px-3 py-2" placeholder="Search by activity or plan" />
                <input type="date" className="border rounded-lg px-3 py-2" />
                <select className="border rounded-lg px-3 py-2">
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                </select>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Refresh</button>
                <button className="px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#1dbfb4]">Export</button>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Activities</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Plans</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Issues</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {reports.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-10 text-center text-gray-500 italic"
                                >
                                    No records available
                                </td>
                            </tr>
                        ) : (
                            reports.map((r) => {
                                const activities =
                                    r.activities && r.activities.length > 0
                                        ? r.activities
                                        : [
                                            {
                                                activity: "No activity recorded",
                                                status: "Pending",
                                                startTime: "",
                                                endTime: "",
                                                description: "",
                                            },
                                        ];

                                return (
                                    <tr key={r._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm">{r.date}</td>

                                        <td className="px-6 py-3 text-sm">
                                            {activities.map((a, i) => (
                                                <span
                                                    key={i}
                                                    className={`inline-block mr-1 mb-1 px-2 py-1 text-xs rounded-full border
                                                            ${a.status === "Pending"
                                                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                                            : a.status === "Ongoing"
                                                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                                                : "bg-green-100 text-green-800 border-green-300"
                                                        }`}
                                                >
                                                    {a.activity} ({a.status})
                                                </span>
                                            ))}
                                        </td>

                                        <td className="px-6 py-3 text-sm">
                                            {r.plans || "No plans added"}
                                        </td>

                                        <td className="px-6 py-3 text-sm">
                                            {r.issues ? (
                                                <span className="text-red-600">{r.issues}</span>
                                            ) : (
                                                "No issues"
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>


            {/* Report Form Modal (similar to LeaveApplyModal) */}
            {showForm && (
                <EODReportModal
                    isOpen={showForm}
                    onClose={() => setShowForm(false)}
                    onSuccess={fetchReports}
                />
            )}
        </div>

    );
}
