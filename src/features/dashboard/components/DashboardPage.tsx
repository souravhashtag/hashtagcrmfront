import React, { useState, useEffect } from 'react';

import Timmer from './Timmer';
import BirthDay from './BirthDay';

import { getIndividualAttendanceData } from '../../../services/AttendanceService';

const DashboardPage: React.FC = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [TakeaBreak, setTakeaBreak] = useState(false);
  const [isTimmerReady, setIsTimmerReady] = useState(false);
  //console.log("isClockedIn rendered===>",isClockedIn);
   

  return (
    <div className="p-6 grid grid-cols-12 gap-6">     

      <Timmer setIsClockedIn={setIsClockedIn} isClockedIn={isClockedIn} TakeaBreak={TakeaBreak} setTakeaBreak={setTakeaBreak} setIsTimmerReady={setIsTimmerReady} />
      <BirthDay />
      

    </div>
  );
};

export default DashboardPage;
