import React from 'react';
import {
  useGetAllNoticesQuery
} from '../../../services/noticeService';
const NoticeBoard = () => {
  const { 
      data: noticesResponse, 
      isLoading, 
      isError,
      error,
      refetch 
    } = useGetAllNoticesQuery({
      limit: 6,
      status: 'published',
    });
    // console.log("Notices Response:", noticesResponse);
  const noticeItems = noticesResponse?.data?.notices?.map((notice: any) => notice.content) || [];

  return (
    <div className="max-w-lg bg-white bg-white rounded-lg border border-[#65e3d7] shadow-md p-6 font-sans mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Notice Board</h2>
        <span className="text-orange-500">✏️</span>
      </div>
      
      {/* Notice Items */}
      <div className="space-y-3">
        {noticeItems.map((item:any, index:number) => (
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