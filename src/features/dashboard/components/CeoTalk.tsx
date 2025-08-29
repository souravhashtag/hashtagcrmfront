import React from 'react';
import { useGetCompanyDetailsQuery } from '../../../services/companyDetailsServices';


const CeoTalk = () => {
  const { data, isLoading, isError } = useGetCompanyDetailsQuery();

  if (isLoading) {
    return <div className="text-center py-8">Loading CEO Talk…</div>;
  }

  if (isError || !data?.data) {
    return <div className="text-center py-8 text-red-600">Failed to load CEO Talk</div>;
  }

  const company = data.data;

  const ceo = company.ceo;
  const message =
    company.settings?.ceoTalk?.Message ||
    "Thank you for reaching out. Your success is our priority. We will get back to you soon.";

  return (
    <div className="max-w-lg mt-8">
      <div className="bg-teal-400 relative rounded-lg">
        <div className="p-6">
          <h1 className="text-black font-bold text-xl mb-6 tracking-wide">
            CEO&apos;S TALK
          </h1>

          <div className="flex items-start gap-6">
            {/* Profile image */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
                <img
                  src={
                    ceo?.profileImage 
                    // "https://www.hashtagbizsolutions.com/assets/images/team/team-1-11.webp"
                  }
                  alt={ceo?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quote */}
            <div className="flex-1">
              <p className="text-black text-base italic">
                “{message}”
              </p>
              <p className="mt-3 font-semibold text-sm text-gray-900">
                – {ceo?.name}
              </p>
              <p className="text-xs text-gray-600">{ceo?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeoTalk;
