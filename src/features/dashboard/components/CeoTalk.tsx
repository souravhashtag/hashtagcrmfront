import React from 'react';

const CeoTalk = () => {
  return (
    <div className="max-w-lg mt-8">
      {/* Main card container with turquoise background and blue border */}
      <div className="bg-teal-400 border-1 border-blue-500 relative rounded-lg">
        {/* Content container */}
        <div className="p-6">
          {/* Header */}
          <h1 className="text-black font-bold text-xl mb-6 tracking-wide">
            CEO'S TALK
          </h1>
          
          {/* Content area with profile and quote */}
          <div className="flex items-start gap-6">
            {/* Profile image */}
            <div className="flex-shrink-0">
              <div className="w-20 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" 
                  alt="CEO Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Quote section */}
            <div className="flex-1">
              {/* Opening quote */}
                  {/* <div className="text-4xl text-gray-700 font-serif text-left">"</div> */}
              {/* Quote text */}
              <p className="text-black text-base fontclass">
                '' It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.''
              </p>
              
              {/* Closing quote */}
              {/* <div className="text-4xl text-gray-700 font-serif text-right">"</div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeoTalk;