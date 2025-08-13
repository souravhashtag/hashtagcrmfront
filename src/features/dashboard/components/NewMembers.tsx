import React, { useState, useEffect } from 'react';
import {
  useGetCurrentMonthNewMembersQuery,
  Member
} from '../../../services/newMemberServices';

const NewMembers: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Redux query hook
  const {
    data: membersResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useGetCurrentMonthNewMembersQuery({ limit: 10 });

  const members = membersResponse?.data || [];

  // Auto-rotate through members
  useEffect(() => {
    if (members.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === members.length - 1 ? 0 : prevIndex + 1
        );
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [members.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="col-span-4">
        <div className="max-w-lg bg-white rounded-lg border border-[#65e3d7] shadow-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">New Members</h2>
          </div>
          <div className="p-4">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="w-15 h-20 bg-gray-300 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="col-span-4">
        <div className="max-w-lg bg-white rounded-lg border border-[#65e3d7] shadow-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">New Members</h2>
          </div>
          <div className="p-4 text-center text-gray-500">
            <p className="text-red-500 mb-2">
              {(error as any)?.data?.message || 'Failed to load new members'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      // <div className="col-span-4">
      //   <div className="max-w-lg bg-white rounded-lg border border-[#65e3d7] shadow-md overflow-hidden">
      //     <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
      //       <h2 className="text-lg font-semibold text-gray-800">New Members</h2>
      //     </div>
      //     <div className="p-4 text-center text-gray-500">
      //       <p>No new members this month</p>
      //     </div>
      //   </div>
      // </div>
      <div>

      </div>
    );
  }

  const currentMember = members[currentIndex];

  // Helper function to get member image
  const getMemberImage = (member: Member): string => {
    return member.image ||
      member.profilePicture ||
      `https://via.placeholder.com/150?text=${encodeURIComponent(member.name.charAt(0))}`;
  };

  // Helper function to format member name
  const getMemberName = (member: Member): string => {
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.name;
  };

  return (
    <div className="col-span-4">
      <div className="max-w-lg bg-white rounded-lg border border-[#65e3d7] shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            New Members
            {members.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({currentIndex + 1} of {members.length})
              </span>
            )}
          </h2>
        </div>

        {/* Member Card Content */}
        <div className={`p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-left space-x-4">
            {/* Avatar */}
            <div className="flex items-center justify-center text-white text-xl">
              <img
                src={getMemberImage(currentMember)}
                alt={getMemberName(currentMember)}
                className="w-15 h-20 rounded-lg object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(getMemberName(currentMember).charAt(0))}`;
                }}
              />
            </div>

            {/* Member Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                {getMemberName(currentMember)}
              </h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-600">
                  {currentMember.position}
                </p>
                <p className="text-sm text-gray-500">
                  {currentMember.date || currentMember.joinDate}
                </p>
              </div>
              {currentMember.department && (
                <p className="text-xs text-gray-400 mt-1">
                  {currentMember.department}
                </p>
              )}
              {currentMember.email && (
                <p className="text-xs text-gray-400 mt-1">
                  {currentMember.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation dots (if more than one member) */}
        {members.length > 1 && (
          <div className="flex justify-center space-x-2 pb-4">
            {members.map((_: Member, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-[#65e3d7]' : 'bg-gray-300'
                  }`}
                aria-label={`View member ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewMembers;