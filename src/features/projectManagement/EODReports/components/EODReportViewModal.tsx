import React from "react";
import { X } from "lucide-react";

interface Props {
    report: any;
    onClose: () => void;
}

export default function EODReportViewModal({ report, onClose }: Props) {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#129990] to-[#117ca7] text-white">
                    <h2 className="text-xl font-bold">
                        EOD Report – {report.employeeName} ({report.date})
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/20 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Employee Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border">
                        <div>
                            <p className="text-sm text-gray-500">Employee</p>
                            <p className="font-semibold">{report.employeeName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Position</p>
                            <p className="font-semibold">{report.position}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Department</p>
                            <p className="font-semibold">{report.department}</p>
                        </div>
                    </div>

                    {/* Activities */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold mb-3 text-lg">Activities</h3>
                        {report.activities && report.activities.length > 0 ? (
                            <ul className="space-y-3">
                                {report.activities.map((a: any, idx: number) => (
                                    <li
                                        key={idx}
                                        className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{a.activity}</span>
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full border
                          ${a.status === "Pending"
                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                                        : a.status === "Ongoing"
                                                            ? "bg-blue-100 text-blue-800 border-blue-300"
                                                            : "bg-green-100 text-green-800 border-green-300"
                                                    }`}
                                            >
                                                {a.status}
                                            </span>
                                        </div>
                                        {a.startTime && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {a.startTime} – {a.endTime}
                                            </p>
                                        )}
                                        {a.description && (
                                            <p className="text-sm text-gray-700 mt-1">{a.description}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No activities recorded</p>
                        )}
                    </div>

                    {/* Breaks */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold mb-3 text-lg">Breaks</h3>
                        {report.breaks && report.breaks.length > 0 ? (
                            <ul className="space-y-3">
                                {report.breaks.map((b: any, idx: number) => (
                                    <li
                                        key={idx}
                                        className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{b.name}</span>
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full border
                          ${b.status === "Pending"
                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                                        : b.status === "Ongoing"
                                                            ? "bg-blue-100 text-blue-800 border-blue-300"
                                                            : "bg-green-100 text-green-800 border-green-300"
                                                    }`}
                                            >
                                                {b.status}
                                            </span>
                                        </div>
                                        {(b.from || b.to) && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {b.from} – {b.to}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No breaks recorded</p>
                        )}
                    </div>

                    {/* Plans */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold mb-2 text-lg">Plans for Tomorrow</h3>
                        <p>
                            {report.plans || (
                                <span className="text-gray-500 italic">No plans added</span>
                            )}
                        </p>
                    </div>

                    {/* Issues */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold mb-2 text-lg">Issues</h3>
                        <p className={report.issues ? "text-red-600" : "text-gray-500 italic"}>
                            {report.issues || "No issues reported"}
                        </p>
                    </div>

                    {/* Comments */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold mb-2 text-lg">Comments</h3>
                        <p>
                            {report.comments || (
                                <span className="text-gray-500 italic">No comments</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
