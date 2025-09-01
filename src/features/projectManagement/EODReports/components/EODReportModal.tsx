import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useCreateEODReportMutation } from "../../../../services/eodReportServices";
import { getUserData } from "../../../../services/authService";

interface Activity {
  activity: string;
  startTime: string;
  endTime: string;
  description: string;
  status: "Pending" | "Ongoing" | "Completed";
}

interface Break {
  name: string;
  from: string;
  to: string;
  status: "Pending" | "Ongoing" | "Completed";
}

interface EODReport {
  _id?: string;
  employeeName: string;
  position: string;
  department: string;
  date: string;
  activities: Activity[];
  breaks: Break[];
  plans: string;
  issues: string;
  comments: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EODReportModal({ isOpen, onClose, onSuccess }: Props) {
  const [report, setReport] = useState<EODReport | null>(null);
  const [createReport, { isLoading }] = useCreateEODReportMutation();

  useEffect(() => {
    if (isOpen) {
      const fetchUser = async () => {
        try {
          const res = await getUserData();
          if (!res.user) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            window.location.href = "/";
            return;
          }

          const user = res.user;

          setReport({
            employeeName: `${user.firstName} ${user.lastName}`,
            position: user.position || "N/A",
            department: user.department?.name || "N/A",
            date: new Date().toISOString().split("T")[0],
            activities: [
              { activity: "", startTime: "", endTime: "", description: "", status: "Pending" },
            ],
            breaks: [
              { name: "", from: "", to: "", status: "Pending" },
            ],
            plans: "",
            issues: "",
            comments: "",
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      };

      fetchUser();
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handleReportChange = (field: keyof EODReport, value: any) => {
    setReport((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleActivityChange = (index: number, field: keyof Activity, value: any) => {
    if (!report) return;
    const updated = [...report.activities];
    updated[index][field] = value;
    setReport((prev) => (prev ? { ...prev, activities: updated } : prev));
  };

  const addActivity = () => {
    if (!report) return;
    setReport((prev) =>
      prev
        ? {
            ...prev,
            activities: [
              ...prev.activities,
              { activity: "", startTime: "", endTime: "", description: "", status: "Pending" },
            ],
          }
        : prev
    );
  };

  const handleBreakChange = (index: number, field: keyof Break, value: any) => {
    if (!report) return;
    const updated = [...report.breaks];
    updated[index][field] = value;
    setReport((prev) => (prev ? { ...prev, breaks: updated } : prev));
  };

  const addBreak = () => {
    if (!report) return;
    setReport((prev) =>
      prev
        ? {
            ...prev,
            breaks: [...prev.breaks, { name: "", from: "", to: "", status: "Pending" }],
          }
        : prev
    );
  };

  const submitReport = async () => {
    try {
      if (!report) return;
      await createReport(report).unwrap();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating report:", error);
      alert("Failed to submit report");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#129990] to-[#117ca7] text-white">
          <h2 className="text-xl font-bold">Create Today&apos;s Report</h2>
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
            <input className="border p-2 rounded bg-gray-100" value={report.employeeName} readOnly />
            <input className="border p-2 rounded bg-gray-100" value={report.position} readOnly />
            <input className="border p-2 rounded bg-gray-100" value={report.department} readOnly />
          </div>

          {/* Date */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-semibold mb-1">Date</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={report.date}
              onChange={(e) => handleReportChange("date", e.target.value)}
            />
          </div>

          {/* Activities */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Activities</h3>
            {report.activities.map((a, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 mb-3">
                <input
                  className="border p-2 rounded"
                  placeholder="Activity"
                  value={a.activity}
                  onChange={(e) => handleActivityChange(idx, "activity", e.target.value)}
                />
                <input
                  type="time"
                  className="border p-2 rounded"
                  value={a.startTime}
                  onChange={(e) => handleActivityChange(idx, "startTime", e.target.value)}
                />
                <input
                  type="time"
                  className="border p-2 rounded"
                  value={a.endTime}
                  onChange={(e) => handleActivityChange(idx, "endTime", e.target.value)}
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Description"
                  value={a.description}
                  onChange={(e) => handleActivityChange(idx, "description", e.target.value)}
                />
                <select
                  className="border p-2 rounded"
                  value={a.status}
                  onChange={(e) =>
                    handleActivityChange(idx, "status", e.target.value as Activity["status"])
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            ))}
            <button
              onClick={addActivity}
              className="mt-2 px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Activity
            </button>
          </div>

          {/* Breaks */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Breaks</h3>
            {report.breaks.map((b, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 mb-3">
                <input
                  className="border p-2 rounded"
                  placeholder="Break Name"
                  value={b.name}
                  onChange={(e) => handleBreakChange(idx, "name", e.target.value)}
                />
                <input
                  type="time"
                  className="border p-2 rounded"
                  value={b.from}
                  onChange={(e) => handleBreakChange(idx, "from", e.target.value)}
                />
                <input
                  type="time"
                  className="border p-2 rounded"
                  value={b.to}
                  onChange={(e) => handleBreakChange(idx, "to", e.target.value)}
                />
                <select
                  className="border p-2 rounded"
                  value={b.status}
                  onChange={(e) =>
                    handleBreakChange(idx, "status", e.target.value as Break["status"])
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            ))}
            <button
              onClick={addBreak}
              className="mt-2 px-4 py-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Break
            </button>
          </div>

          {/* Plans */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-semibold mb-1">Plans for Tomorrow</label>
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Plans for tomorrow"
              value={report.plans}
              onChange={(e) => handleReportChange("plans", e.target.value)}
            />
          </div>

          {/* Issues */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-semibold mb-1">Issues / Challenges</label>
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Issues / Challenges"
              value={report.issues}
              onChange={(e) => handleReportChange("issues", e.target.value)}
            />
          </div>

          {/* Comments */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-semibold mb-1">Comments to Management</label>
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Comments to Management"
              value={report.comments}
              onChange={(e) => handleReportChange("comments", e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={submitReport}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium transition disabled:opacity-50"
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
