import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  User,
  Mail,
  Phone,
  Calendar,
  Badge,
  Building,
  MapPin,
  Eye,
  Edit3,
  UserMinus,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Download,
  Plus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  useGetAssignedEmployeesQuery,
  useUnassignEmployeeMutation
} from '../../../services/assignmentServices';
import {
  useGetEmployeesQuery
} from '../../../services/employeeServices';

interface Role {
  _id: string;
  name: string;
  display_name?: string;
  level: number;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
//   firstName: string;
  phone?: string;
  profilePicture?: string;
  role: Role;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
}

interface Employee {
  _id: string;
  userId: User;
  employeeId: string;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Assignment {
  _id: string;
  supervisor: string;
  subordinate: Employee;
  status: string;
  assignedBy: Employee;
  createdAt: Date;
  updatedAt: Date;
}

const MyTeam: React.FC = () => {
  const navigate = useNavigate();
  
  // Current logged-in user ID
  const currentUserId = '686e4b0fcd9d0c8bea38ed8d';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joiningDate' | 'employeeId'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // First, get the employee record for the current user to find their employeeId
  const {
    data: employeesData,
    isLoading: isEmployeesLoading,
    error: employeesError
  } = useGetEmployeesQuery({
    page: 1,
    limit: 1000,
    search: ''
  });

  // Find current user's employee record
  const currentEmployee = employeesData?.data?.find((emp: any) => 
    emp.userId._id === currentUserId
  );

  const currentEmployeeId = currentEmployee?._id;

  // API Hooks - only fetch team data if we have the employee ID
  const {
    data: teamData,
    isLoading: isTeamLoading,
    error: teamError,
    refetch
  } = useGetAssignedEmployeesQuery({
    supervisorId: currentEmployeeId || '',
    status: 'active', // Always fetch active members only
    page: 1,
    limit: 100
  }, {
    skip: !currentEmployeeId // Skip the query if we don't have the employee ID yet
  });

  const [unassignMember] = useUnassignEmployeeMutation();

  const teamMembers = teamData?.data || [];
  const totalMembers = teamData?.pagination?.total_records || 0;
  const isLoading = isEmployeesLoading || isTeamLoading;

  // Filter and sort team members
  const filteredAndSortedMembers = teamMembers
    .filter((assignment: Assignment) => {
      const employee = assignment.subordinate;
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        employee.userId.firstName.toLowerCase().includes(searchLower) ||
        employee.employeeId.toLowerCase().includes(searchLower) ||
        employee.userId.email.toLowerCase().includes(searchLower) ||
        employee.userId.role.name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: Assignment, b: Assignment) => {
      const empA = a.subordinate;
      const empB = b.subordinate;
      
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'name':
          valueA = empA.userId.firstName;
          valueB = empB.userId.firstName;
          break;
        case 'role':
          valueA = empA.userId.role.display_name || empA.userId.role.name;
          valueB = empB.userId.role.display_name || empB.userId.role.name;
          break;
        case 'joiningDate':
          valueA = new Date(empA.joiningDate);
          valueB = new Date(empB.joiningDate);
          break;
        case 'employeeId':
          valueA = empA.employeeId;
          valueB = empB.employeeId;
          break;
        default:
          valueA = empA.userId.firstName;
          valueB = empB.userId.firstName;
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredAndSortedMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredAndSortedMembers.map((assignment: Assignment) => assignment.subordinate._id));
    }
  };

  const handleUnassignMember = async (employeeId: string, employeeName: string) => {
    if (!currentEmployeeId) {
      setError('Unable to identify current supervisor');
      return;
    }

    try {
      await unassignMember({
        supervisorId: currentEmployeeId,
        employeeId,
        reason: 'Removed from team by manager'
      }).unwrap();

      setSuccess(`${employeeName} has been removed from your team`);
      setTimeout(() => setSuccess(null), 3000);
      refetch();
    } catch (err: any) {
      setError(err.data?.message || 'Failed to remove team member');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleViewMember = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  const handleEditMember = (employeeId: string) => {
    navigate(`/employees/${employeeId}/edit`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderMemberCard = (assignment: Assignment) => {
    const employee = assignment.subordinate;
    const isSelected = selectedMembers.includes(employee._id);

    return (
      <div
        key={employee._id}
        className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow border-2 ${
          isSelected ? 'border-blue-500' : 'border-transparent'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  {employee.userId.profilePicture ? (
                    <img
                      src={employee.userId.profilePicture}
                      alt={employee.userId.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  employee.userId.status === 'active' ? 'bg-green-500' :
                  employee.userId.status === 'inactive' ? 'bg-red-500' :
                  employee.userId.status === 'suspended' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {employee.userId.firstName} {employee.userId.lastName}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    employee.userId.role.level === 1 ? 'bg-blue-100 text-blue-800' :
                    employee.userId.role.level === 2 ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.userId.role.display_name || employee.userId.role.name}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Badge className="h-4 w-4" />
                    <span>{employee.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{employee.userId.email}</span>
                  </div>
                  {employee.userId.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{employee.userId.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined: {formatDate(employee.joiningDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectMember(employee._id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <MoreVertical className="h-5 w-5" />
                </button>
                {/* Dropdown menu would go here */}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Member since {formatDate(employee.joiningDate)}
            </div>
            
            <button
              onClick={() => handleUnassignMember(employee._id, employee.userId.firstName)}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <UserMinus className="h-4 w-4 mr-1" />
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMemberRow = (assignment: Assignment) => {
    const employee = assignment.subordinate;
    const isSelected = selectedMembers.includes(employee._id);

    return (
      <tr key={employee._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
              {employee.userId.profilePicture ? (
                <img
                  src={employee.userId.profilePicture}
                  alt={employee.userId.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {employee.userId.firstName} {employee.userId.lastName}
              </div>
              <div className="text-sm text-gray-500">
                {employee.employeeId}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            employee.userId.role.level === 1 ? 'bg-blue-100 text-blue-800' :
            employee.userId.role.level === 2 ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {employee.userId.role.display_name || employee.userId.role.name}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {employee.userId.email}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {employee.userId.phone || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDate(employee.joiningDate)}
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => handleUnassignMember(employee._id, employee.userId.firstName)}
            className="text-red-600 hover:text-red-900"
            title="Remove from team"
          >
            <UserMinus className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your team...</p>
        </div>
      </div>
    );
  }

  // Show error if we can't find the current employee
  if (!isLoading && !currentEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to find your employee record</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {currentUserId}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Member</h1>
              <p className="text-gray-600 mt-1">
                Team Members ({totalMembers} total)
                {currentEmployee && (
                  <span className="block text-sm text-gray-500">
                    Manager: {currentEmployee.userId.firstName} {currentEmployee.userId.lastName} ({currentEmployee.employeeId})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {(employeesError || teamError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">
                {employeesError ? 'Failed to load employee data' : 'Failed to load team data'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedMembers.length > 0 && (
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedMembers.length} member(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                    Export Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Members Display */}
        {teamError ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load your team. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedMembers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No team members found matching your search.' : 'You don\'t have any team members yet.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={() => navigate('/employees/assign')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Team Members
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedMembers.map(renderMemberCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Employee</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Role</span>
                      {sortBy === 'role' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('joiningDate')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Joining Date</span>
                      {sortBy === 'joiningDate' && (
                        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedMembers.map(renderMemberRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;