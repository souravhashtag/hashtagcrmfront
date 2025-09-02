import React, { useState } from "react";
import { useGetAllEODReportsQuery } from "../../../services/eodReportServices";
import EODReportViewModal from "./components/EODReportViewModal";

export default function AdminEODReportsPage() {
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    const { data, isLoading, refetch } = useGetAllEODReportsQuery({
        page: 1,
        limit: 50,
    });

    const reports = data?.data || [];

    return (
        <div className="p-6 bg-gray-50 min-h-fit rounded-lg">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All EOD Reports</h1>
                    <p className="text-gray-600 mt-1">Admin view of all submitted reports</p>
                </div>
                <button
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    onClick={() => refetch()}
                >
                    Refresh
                </button>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Plans</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Issues</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                    Loading reports...
                                </td>
                            </tr>
                        ) : reports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                    No reports available
                                </td>
                            </tr>
                        ) : (
                            reports.map((r: any) => (
                                <tr key={r._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm">{r.date}</td>
                                    <td className="px-6 py-3 text-sm font-medium">
                                        {r.employeeName}
                                    </td>
                                    <td className="px-6 py-3 text-sm">{r.department}</td>
                                    <td className="px-6 py-3 text-sm">
                                        {r.plans || <span className="text-gray-400 italic">No plans</span>}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                        {r.issues ? (
                                            <span className="text-red-600">{r.issues}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">No issues</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                        <button
                                            onClick={() => setSelectedReport(r)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {selectedReport && (
                <EODReportViewModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
}
