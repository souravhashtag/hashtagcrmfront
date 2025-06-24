import React, { useState } from "react";
import {
  useGetEmployeeBirthDayQuery
} from '../../../services/employeeServices';
const BirthDay: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const {
      data,
      isLoading,
      refetch,
      isFetching
    } = useGetEmployeeBirthDayQuery({});
    const margedBirthdayData=[...(data?.data?.[0]?.todaybirthday || []),...(data?.data?.[1]?.thismonth || [])]
  const birthdays = margedBirthdayData;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === birthdays.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? birthdays.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="col-span-4 bg-gradient-to-r from-[#0E4980] to-[#000000] rounded-xl p-6 text-white text-center h-[300px]">
      <h3 className="font-normal mb-4 tracking-wide">{birthdays[currentIndex]?.header}</h3>
      
      <div className="relative">
        <div className="text-center">
          <div className={`w-16 h-16  rounded-full mx-auto mb-2`}><img src={birthdays[currentIndex]?.image}/></div>
          <p className="font-medium">{birthdays[currentIndex]?.name}</p>
          <p className="font-medium">{birthdays[currentIndex]?.date}</p>
        </div>

        {birthdays.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
              aria-label="Previous birthday"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
              aria-label="Next birthday"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          {birthdays.map((_:any, index:number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-teal-400' : 'bg-gray-400'
              }`}
              aria-label={`Go to birthday ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BirthDay;
