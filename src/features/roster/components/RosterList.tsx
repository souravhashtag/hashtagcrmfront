import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';

interface Schedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface Employee {
  id: number;
  name: string;
  schedule: Schedule;
}

const EmployeeScheduleTable: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const scheduleData: Employee[] = [
    {
      id: 1,
      name: 'Darlene Robertson',
      schedule: {
        monday: '10am-7pm',
        tuesday: '10am-7pm',
        wednesday: '10am-7pm',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: 'OFF',
        sunday: 'OFF'
      }
    },
    {
      id: 2,
      name: 'Jenny Wilson',
      schedule: {
        monday: '10am-7pm',
        tuesday: 'OFF',
        wednesday: 'OFF',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: '10am-7pm',
        sunday: '10am-7pm'
      }
    },
    {
      id: 3,
      name: 'Darlene Robertson',
      schedule: {
        monday: '10am-7pm',
        tuesday: '10am-7pm',
        wednesday: '10am-7pm',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: 'OFF',
        sunday: 'OFF'
      }
    },
    {
      id: 4,
      name: 'Jenny Wilson',
      schedule: {
        monday: '10am-7pm',
        tuesday: 'OFF',
        wednesday: 'OFF',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: '10am-7pm',
        sunday: '10am-7pm'
      }
    },
    {
      id: 5,
      name: 'Darlene Robertson',
      schedule: {
        monday: '10am-7pm',
        tuesday: '10am-7pm',
        wednesday: '10am-7pm',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: 'OFF',
        sunday: 'OFF'
      }
    },
    {
      id: 6,
      name: 'Jenny Wilson',
      schedule: {
        monday: '10am-7pm',
        tuesday: 'OFF',
        wednesday: 'OFF',
        thursday: '10am-7pm',
        friday: '10am-7pm',
        saturday: '10am-7pm',
        sunday: '10am-7pm'
      }
    }
  ];

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === scheduleData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(scheduleData.map(item => item.id)));
    }
  };

  const pageNumbers: number[] = [1, 2, 3, 4];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="">
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  checked={selectedRows.size === scheduleData.length && scheduleData.length > 0}
                  onChange={toggleAllRows}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#000] min-w-[180px]">
                Employee Name
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium min-w-[120px] text-[#000]">
                <div className="flex flex-col items-center text-[#000]">
                  <span>Monday</span>
                  <span className="text-xs font-normal text-[#000]">28th July</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#000] min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Tuesday</span>
                  <span className="text-xs font-normal text-[#000]">29th July</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#000] min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Wednesday</span>
                  <span className="text-xs font-normal text-[#000]">30th July</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#000] min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Thursday</span>
                  <span className="text-xs font-normal text-[#000]">31th July</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#000] min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Friday</span>
                  <span className="text-xs font-normal text-[#000]">1st Aug</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#000] min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Saturday</span>
                  <span className="text-xs font-normal text-[#000]">2nd Aug</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[#000] min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Sunday</span>
                  <span className="text-xs font-normal text-[#000]">3rd Aug</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium  w-20 text-[#000]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {scheduleData.map((employee: Employee, index: number) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    checked={selectedRows.has(employee.id)}
                    onChange={() => toggleRowSelection(employee.id)}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {employee.name}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.monday}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.tuesday}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.wednesday}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.thursday}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.friday}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.saturday}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-700">
                  {employee.schedule.sunday}
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-md transition-colors">
            Multiple Edit
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm h-[30px]">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Showing 1 to 10 out of 65 records
          </span>
          
          <div className="flex items-center gap-1">
            <button 
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {pageNumbers.map((page: number) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm font-medium rounded ${
                  currentPage === page
                    ? 'text-black border border-[#14b8a6]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button 
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setCurrentPage(Math.min(4, currentPage + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeScheduleTable;