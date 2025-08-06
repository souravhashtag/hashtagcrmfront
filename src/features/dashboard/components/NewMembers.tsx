import React, { useState, useEffect } from 'react';


const NewMembers = () => {
  const members = [
    {
      id: 1,
      name: "Douglas Gruehl",
      position: "Product Manager",
      date: "06-05-2025",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTTUKUnwROtLJpA7PDFyzDpX1racPPBXgxpkSbiaKZltSWMd2uqZCo2vAweErACu-EiR0&usqp=CAU"
    },
     {
      id: 2,
      name: "ileana Doe",
      position: "Sr. Software Developer",
      date: "06-05-2025",
      image: "https://images.squarespace-cdn.com/content/v1/5aee389b3c3a531e6245ae76/1531792846005-MYGZAOI0L93I3YJWHB6W/D75_5697-Edit.jpg"
    },
   
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
      <div className="max-w-lg bg-white rounded-lg  border border-[#65e3d7] shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">New Members</h2>
        </div>
        
        {/* Member Card Content */}
        <div className={`p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-left space-x-4">
            {/* Avatar */}
            <div className="flex items-center justify-center text-white text-xl">
              
              <img src={currentMember.image} alt="" className='w-15 h-20 rounded-lg' />
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
            </div>
          </div>
        </div>
      </div>



    </div>
  );
};

export default NewMembers;