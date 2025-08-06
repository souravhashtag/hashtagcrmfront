import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Graph = () => {
  // Sample data for attendance chart
  const data = [
    { month: 'Jan', present: 20, absent: 80 },
    { month: 'Feb', present: 60, absent: 40 },
    { month: 'Mar', present: 30, absent: 70 },
    { month: 'Apr', present: 80, absent: 20 },
    { month: 'May', present: 10, absent: 90 },
    { month: 'Jun', present: 15, absent: 85 },
    { month: 'Jul', present: 65, absent: 35 },
    { month: 'Aug', present: 25, absent: 75 },
    { month: 'Sep', present: 50, absent: 50 },
    { month: 'Oct', present: 25, absent: 75 },
    { month: 'Nov', present: 20, absent: 80 },
    { month: 'Dec', present: 15, absent: 85 }
  ];
const maxHeight = 200;
  // Sample data for pie chart
  const taskData = [
    { name: 'Completed', value: 45, color: '#4FD1C5' },
    { name: 'Pending', value: 25, color: '#00354B' },
    { name: 'Overdue', value: 30, color: '#007170' }
  ];

  return (
    <div className="gap-6">
      <div className="grid grid-cols-12 gap-6 p-6">
        <div className="col-span-8 bg-white rounded-lg p-6 shadow-lg border border-[#65e3d7]">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm mb-1">Statistics</p>
        <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
        
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-400"></div>
            <span className="text-gray-600 text-sm">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-800"></div>
            <span className="text-gray-600 text-sm">Absent</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Chart container */}
        <div className="flex items-end justify-between gap-4 h-64 mb-4">
          {data.map((item, index) => {
            const presentHeight = (item.present / 100) * maxHeight;
            const absentHeight = (item.absent / 100) * maxHeight;
            const totalHeight = presentHeight + absentHeight;
            
            return (
              <div key={item.month} className="flex flex-col items-center flex-1 relative">
                {/* Bar */}
                <div 
                  className="w-full max-w-12 relative bg-gray-100 rounded-sm"
                  style={{ height: `${maxHeight}px` }}
                >
                  {/* Present section */}
                  <div 
                    className="absolute bottom-0 w-full bg-teal-400 rounded-sm"
                    style={{ height: `${presentHeight}px` }}
                  ></div>
                  
                  {/* Absent section */}
                  <div 
                    className="absolute w-full bg-gray-800 rounded-sm"
                    style={{ 
                      height: `${absentHeight}px`,
                      bottom: `${presentHeight}px`
                    }}
                  ></div>
                  
                  {/* Percentage labels */}
                  {item.present > 0 && (
                    <div 
                      className="absolute w-full text-xs font-medium text-white flex items-center justify-center"
                      style={{ 
                        bottom: `${presentHeight / 2 - 8}px`,
                        height: '16px'
                      }}
                    >
                      {item.present}%
                    </div>
                  )}
                  
                  {item.absent > 0 && (
                    <div 
                      className="absolute w-full text-xs font-medium text-white flex items-center justify-center"
                      style={{ 
                        bottom: `${presentHeight + (absentHeight / 2) - 8}px`,
                        height: '16px'
                      }}
                    >
                      {item.absent}%
                    </div>
                  )}
                </div>
                
                {/* Month label */}
                <div className="mt-3 text-sm text-gray-600">
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Red dot indicator (like in original) */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
        </div>
      </div>
      
   

        </div>
        {/* Attendance Chart Card */}
      

        {/* Key Task Milestone Card */}
        <div className="bg-white col-span-4 p-6 rounded-lg shadow-lg  border border-[#65e3d7]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Key Task Milestone</h3>
            <p className="text-sm text-gray-500 mt-1">Statistics</p>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">45%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-6">
            {taskData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
          
          {/* Percentage labels */}
          <div className="flex justify-center space-x-8 mt-4">
            <span className="text-sm font-medium text-gray-900">45%</span>
            <span className="text-sm font-medium text-gray-900">25%</span>
            <span className="text-sm font-medium text-gray-900">30%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graph;