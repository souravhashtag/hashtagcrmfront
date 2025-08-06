import React from 'react';

const NoticeBoard = () => {
  const noticeItems = [
    "Quality objectives.",
    "Achievements of the last ten years - Improvements.",
    "Future plans for the organization.",
    "Birthday and wedding anniversary wishes.",
    "Names of the Safety and Quality Committee should be",
    "Location of the First-Aid Box should be indicated."
  ];

  return (
    <div className="max-w-lg bg-white bg-white rounded-lg border border-[#65e3d7] shadow-md p-6 font-sans mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Notice Board</h2>
        <span className="text-orange-500">✏️</span>
      </div>
      
      {/* Notice Items */}
      <div className="space-y-3">
        {noticeItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-gray-600 font-medium text-sm mt-0.5">
              {String(index + 1).padStart(2, '0')}.
            </span>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoticeBoard;