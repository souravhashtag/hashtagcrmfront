import React, { useState, useEffect } from 'react';

const NewMembers = () => {
  const members = [
    {
      id: 1,
      name: "Douglas Gruehl",
      position: "Sr. UI Designer",
      date: "06-05-2025",
      avatar: "👤"
    },
    {
      id: 2,
      name: "Sarah Chen",
      position: "Frontend Developer",
      date: "06-04-2025",
      avatar: "👩‍💻"
    },
    {
      id: 3,
      name: "Mike Johnson",
      position: "Product Manager",
      date: "06-03-2025",
      avatar: "👨‍💼"
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      position: "UX Researcher",
      date: "06-02-2025",
      avatar: "👩‍🔬"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
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

  const currentMember = members[currentIndex];

 

  return (
    <div className="col-span-4 ">
      <div className="max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">New Members</h2>
        </div>
        
        {/* Member Card Content */}
        <div className={`p-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-left space-x-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
              {currentMember.avatar}
            </div>
            
            {/* Member Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
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
            </div>
          </div>
        </div>
      </div>



    </div>
  );
};

export default NewMembers;