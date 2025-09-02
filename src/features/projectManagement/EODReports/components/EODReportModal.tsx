import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EODReportModal({ isOpen, onClose, onSuccess }: Props) {
  const [report, setReport] = useState<EODReport>({
    employeeName: "Reshab Naskar",
    position: "Jr. Web Developer",
    department: "MERN Stack Developer",
    date: new Date().toISOString().split("T")[0],
    activities: [
      { activity: "", startTime: "", endTime: "", description: "", status: "Pending" },
    ],
    plans: "",
    issues: "",
    comments: "",
  });

  useEffect(() => {
    if (isOpen) {
      setReport({
        employeeName: "Reshab Naskar",
        position: "Jr. Web Developer",
        department: "MERN Stack Developer",
        date: new Date().toISOString().split("T")[0],
        activities: [
          { activity: "", startTime: "", endTime: "", description: "", status: "Pending" },
        ],
        plans: "",
        issues: "",
        comments: "",
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReportChange = (field: keyof EODReport, value: any) => {
    setReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleActivityChange = (index: number, field: keyof Activity, value: any) => {
    const updated = [...report.activities];
    updated[index][field] = value;
    setReport((prev) => ({ ...prev, activities: updated }));
  };

  const addActivity = () => {
    setReport((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        { activity: "", startTime: "", endTime: "", description: "", status: "Pending" },
      ],
    }));
  };

  const submitReport = async () => {
    try {
      const res = await fetch("/api/eod-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto w-full max-w-4xl bg-white rounded-lg shadow-lg border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Create Today&apos;s Report</h2>
            <p className="text-gray-600">Log your daily activities, plans, and issues</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <input
            className="w-full border p-2 rounded"
            placeholder="Employee Name"
            value={report.employeeName}
            onChange={(e) => handleReportChange("employeeName", e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="w-full border p-2 rounded"
              placeholder="Position"
              value={report.position}
              onChange={(e) => handleReportChange("position", e.target.value)}
            />
            <input
              className="w-full border p-2 rounded"
              placeholder="Department"
              value={report.department}
              onChange={(e) => handleReportChange("department", e.target.value)}
            />
          </div>

          <input
            type="date"
            className="w-full border p-2 rounded"
            value={report.date}
            onChange={(e) => handleReportChange("date", e.target.value)}
          />

          {/* Activities */}
          <div>
            <h3 className="font-semibold mb-2">Activities</h3>
            {report.activities.map((a, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
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
                  onChange={(e) => handleActivityChange(idx, "status", e.target.value as Activity["status"])}
                >
                  <option value="Pending">Pending</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            ))}
            <button
              onClick={addActivity}
              className="mt-2 px-3 py-1 flex items-center gap-1 bg-blue-500 text-white rounded"
            >
              <Plus className="w-4 h-4" /> Add Activity
            </button>
          </div>

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Plans for tomorrow"
            value={report.plans}
            onChange={(e) => handleReportChange("plans", e.target.value)}
          />

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Issues / Challenges"
            value={report.issues}
            onChange={(e) => handleReportChange("issues", e.target.value)}
          />

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Comments to Management"
            value={report.comments}
            onChange={(e) => handleReportChange("comments", e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={submitReport} className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
