import React from 'react';

const PopupLogoutModal = ({
    showPopup,
    setManualClockOutTime,
    missedRecord,
    manualClockOutTime,
    reason,
    setReason,
    handleSubmitManualClockOut
}: any) => {
    return (
        <div>
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-96">
                        <h2 className="text-lg font-semibold mb-2">Missed Clock-Out Detected</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            You clocked in on {new Date(missedRecord.clockIn).toLocaleString()} but did not clock out within 12 hours.
                        </p>

                        <label className="block text-sm font-medium">Actual Clock-Out Time</label>
                        <input
                            type="datetime-local"
                            className="border rounded-md p-2 w-full mb-3"
                            value={manualClockOutTime}
                            onChange={(e) => setManualClockOutTime(e.target.value)}
                        />

                        <label className="block text-sm font-medium">Reason</label>
                        <textarea
                            className="border rounded-md p-2 w-full mb-4"
                            placeholder="Explain why you forgot to clock out"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            {/* <button
                                onClick={() => setShowPopup(false)}
                                className="px-3 py-1 rounded-md border border-gray-300"
                            >
                                Cancel
                            </button> */}
                            <button
                                onClick={handleSubmitManualClockOut}
                                className="bg-blue-600 text-white px-4 py-1 rounded-md"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PopupLogoutModal;
