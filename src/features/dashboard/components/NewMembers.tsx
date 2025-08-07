import React, { useState, useEffect } from 'react';

interface Member {
  id: number;
  name: string;
  position: string;
  date: string;
  joinDate?: string;
  email?: string;
  department?: string;
  image: string;
}

interface ApiResponse {
  success: boolean;
  data: Member[];
  total?: number;
  month?: string;
  message?: string;
}

const NewMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch new members from backend
  useEffect(() => {
    const fetchNewMembers = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/V1/employee/new-members');
        
        if (!response.ok) {
          throw new Error('Failed to fetch new members');
        }
        
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setMembers(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching new members:', err);
        
        // Fallback to static data if API fails
        setMembers([
          {
            id: 1,
            name: "Douglas Gruehl",
            position: "Product Manager",
            date: "08-05-2025",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTTUKUnwROtLJpA7PDFyzDpX1racPPBXgxpkSbiaKZltSWMd2uqZCo2vAweErACu-EiR0&usqp=CAU"
          },
          {
            id: 2,
            name: "Ileana Doe",
            position: "Sr. Software Developer",
            date: "08-03-2025",
            image: "https://images.squarespace-cdn.com/content/v1/5aee389b3c3a531e6245ae76/1531792846005-MYGZAOI0L93I3YJWHB6W/D75_5697-Edit.jpg"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewMembers();
  }, []);

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
  if (loading) {
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

  // Empty state
  if (members.length === 0) {
    return (
      <div className="col-span-4">
        <div className="max-w-lg bg-white rounded-lg border border-[#65e3d7] shadow-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">New Members</h2>
          </div>
          <div className="p-4 text-center text-gray-500">
            <p>No new members this month</p>
            {error && (
              <p className="text-sm text-red-500 mt-2">
                API Error: {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentMember = members[currentIndex];

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
                src={currentMember.image} 
                alt={currentMember.name}
                className="w-15 h-20 rounded-lg object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/150?text=' + encodeURIComponent(currentMember.name.charAt(0));
                }}
              />
            </div>
            
            {/* Member Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                {currentMember.name}
              </h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-600">
                  {currentMember.position}
                </p>
                <p className="text-sm text-gray-500">
                  {currentMember.date}
                </p>
              </div>
              {currentMember.department && (
                <p className="text-xs text-gray-400 mt-1">
                  {currentMember.department}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation dots (if more than one member) */}
        {members.length > 1 && (
          <div className="flex justify-center space-x-2 pb-4">
            {members.map((_, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#65e3d7]' : 'bg-gray-300'
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