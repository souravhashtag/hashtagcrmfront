import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Users,
  Search,
  Check,
  X,
  UserPlus,
  Building,
  Badge,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  useGetEmployeeByIdQuery,
} from '../../../services/employeeServices';
import {
  useAssignEmployeesMutation,
  useUnassignEmployeeMutation,
  useGetAvailableEmployeesForAssignmentQuery,
  useGetAssignedEmployeesQuery
} from '../../../services/assignmentServices';
import {
  useGetRoleHierarchyQuery,
  useUpdateRoleMutation
} from '../../../services/roleServices';

interface Role {
  _id: string;
  name: string;
  display_name?: string;
  description?: string;
  level: number;
  path: string;
  parent_id?: string;
  is_active: boolean;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: Role;
  department?: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  // fullName: string;
}

interface Employee {
  _id: string;
  userId: User;
  employeeId: string;
  joiningDate: Date;
  assignedEmployees?: string[];
  supervisor?: string;
}

const EmployeeAssign: React.FC = () => {
  const { id: employeeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  console.log('Employee ID:', employeeId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedParentRoleId, setSelectedParentRoleId] = useState<string | undefined>(undefined);

  // RTK Query hooks
  const [assignEmployeesMutation] = useAssignEmployeesMutation();
  const [unassignEmployeeMutation] = useUnassignEmployeeMutation();
  const [updateRoleMutation] = useUpdateRoleMutation();

  // Fetch current employee data
  const {
    data: currentEmployeeData,
    isLoading: isCurrentEmployeeLoading,
    error: currentEmployeeError,
    refetch: refetchEmployee
  } = useGetEmployeeByIdQuery(employeeId || '', {
    skip: !employeeId
  });

  // Fetch assigned employees using the new service
  const {
    data: assignedEmployeesData,
    isLoading: isAssignedEmployeesLoading,
    error: assignedEmployeesError,
    refetch: refetchAssignedEmployees
  } = useGetAssignedEmployeesQuery({
    supervisorId: employeeId || '',
    status: 'active'
  }, {
    skip: !employeeId
  });

  // Fetch available employees using the new service
  const {
    data: availableEmployeesData,
    isLoading: isAvailableEmployeesLoading,
    error: availableEmployeesError,
    refetch: refetchAvailableEmployees
  } = useGetAvailableEmployeesForAssignmentQuery({
    supervisorId: employeeId || '',
    search: searchTerm
  }, {
    skip: !employeeId
  });

  // Fetch role hierarchy for parent role selection and level comparison
  const {
    data: roleHierarchyData,
    isLoading: isRoleHierarchyLoading,
    refetch: refetchRoleHierarchy
  } = useGetRoleHierarchyQuery({});

  const currentEmployee = currentEmployeeData?.data;
  // console.log('Current Employee:', currentEmployee);
  const assignedEmployees = assignedEmployeesData?.data?.map((assignment: any) => assignment.subordinate) || [];
  const availableEmployees = availableEmployeesData?.data || [];
  const isLoading = isCurrentEmployeeLoading || isAssignedEmployeesLoading || isAvailableEmployeesLoading || isRoleHierarchyLoading;

  useEffect(() => {
    if (currentEmployee) {
      setSelectedParentRoleId(currentEmployee.userId.role.parent_id || undefined);
    }
  }, [currentEmployee]);

  // Handle errors from queries
  useEffect(() => {
    if (currentEmployeeError || assignedEmployeesError || availableEmployeesError) {
      setError('Failed to load employee data. Please try again.');
    }
  }, [currentEmployeeError, assignedEmployeesError, availableEmployeesError]);

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleAssignEmployees = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!employeeId) {
        throw new Error('Current employee not found');
      }

      console.log('*** ASSIGNING EMPLOYEES ***', {
        supervisorId: employeeId,
        employeeIds: selectedEmployees
      });

      await assignEmployeesMutation({
        supervisorId: employeeId,
        employeeIds: selectedEmployees,
        reason: 'Manual assignment from admin panel'
      }).unwrap();

      // Refetch data to get updated lists
      await Promise.all([
        refetchAssignedEmployees(),
        refetchAvailableEmployees()
      ]);

      setSelectedEmployees([]);
      setSuccess(`Successfully assigned ${selectedEmployees.length} employee(s)`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Assignment error:', err);
      setError(err.data?.message || err.message || 'Failed to assign employees');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignEmployee = async (employeeToUnassignId: string) => {
    try {
      if (!employeeId) {
        throw new Error('Current employee not found');
      }

      console.log('*** UNASSIGNING EMPLOYEE ***', {
        supervisorId: employeeId,
        employeeId: employeeToUnassignId
      });

      await unassignEmployeeMutation({
        supervisorId: employeeId,
        employeeId: employeeToUnassignId,
        reason: 'Manual unassignment from admin panel'
      }).unwrap();

      // Refetch data to get updated lists
      await Promise.all([
        refetchAssignedEmployees(),
        refetchAvailableEmployees()
      ]);

      setSuccess('Employee unassigned successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Unassignment error:', err);
      setError(err.data?.message || err.message || 'Failed to unassign employee');
    }
  };

  const handleUpdateRole = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!currentEmployee?.userId?.role?._id) {
        throw new Error('Current employee role not found');
      }

      const roleData = {
        parent_id: selectedParentRoleId || undefined
      };

      console.log('*** UPDATING ROLE ***', {
        roleId: currentEmployee.userId.role._id,
        roleData
      });

      const response = await updateRoleMutation({
        id: currentEmployee.userId.role._id,
        data: roleData
      }).unwrap();

      console.log('*** ROLE UPDATE RESPONSE ***', JSON.stringify(response, null, 2));

      await Promise.all([
        refetchEmployee(),
        refetchRoleHierarchy(),
        refetchAvailableEmployees()
      ]);

      setSuccess('Role updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('*** ROLE UPDATE FAILED ***', JSON.stringify(err, null, 2));
      setError(err.data?.message || err.message || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAvailableEmployees = availableEmployees.filter((employee: Employee) =>
    employee?.userId?.firstName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    employee?.employeeId?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    employee?.userId?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  const canAssignEmployee = (employee: Employee): boolean => {
    if (!currentEmployee) return false;
    return employee.userId.role.level > currentEmployee.userId.role.level;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Employee not found</p>
          <button
            onClick={() => navigate('/employee')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/employee')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Assign Employees</h1>
          </div>

          {/* Current Employee Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                {currentEmployee.userId.profilePicture ? (
                  <img 
                    src={currentEmployee.userId.profilePicture} 
                    alt={currentEmployee.userId.firstName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentEmployee?.userId?.firstName} {currentEmployee?.userId?.lastName}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">                  
                  <span className="flex items-center gap-1">
                    <Badge className="h-4 w-4" />
                    {currentEmployee.employeeId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {currentEmployee.userId.role.display_name || currentEmployee.userId.role.name}
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      Level {currentEmployee.userId.role.level}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {currentEmployee.userId.email}
                  </span>
                </div>
                {/* Parent Role Selector */}
                {/* <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Parent Role
                  </label>
                  <select
                    value={selectedParentRoleId || ''}
                    onChange={(e) => setSelectedParentRoleId(e.target.value || undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Root Level (No Parent)</option>
                    {roleHierarchyData?.data?.map((role: Role) => (
                      <option key={role._id} value={role._id}>
                        {role.display_name || role.name} (Level: {role.level})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateRole}
                    disabled={isSaving || selectedParentRoleId === currentEmployee.userId.role.parent_id}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Updating Role...' : 'Update Role'}
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{success}</p>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Employees */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Employees</h3>
                <span className="text-sm text-gray-500">
                  {filteredAvailableEmployees.length} employees
                </span>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {selectedEmployees.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedEmployees.length} employee(s) selected
                  </span>
                  <button
                    onClick={handleAssignEmployees}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    {isSaving ? 'Assigning...' : 'Assign Selected'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {filteredAvailableEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No employees found matching search' : 'No available employees to assign'}
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAvailableEmployees.map((employee: Employee) => {
                    const canAssign = canAssignEmployee(employee);
                    const isSelected = selectedEmployees.includes(employee._id);
                    
                    return (
                      <div
                        key={employee._id}
                        className={`p-4 border rounded-lg transition cursor-pointer ${
                          !canAssign 
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => canAssign && handleEmployeeSelect(employee._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {employee.userId.profilePicture ? (
                                <img 
                                  src={employee.userId.profilePicture} 
                                  alt={employee.userId.firstName}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {employee.userId.firstName} {employee.userId.lastName}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{employee.employeeId}</span>
                                <span>•</span>
                                <span>{employee.userId.role.display_name || employee.userId.role.name}</span>
                                <span className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                                  L{employee.userId.role.level}
                                </span>
                              </div>
                            </div>
                          </div>
                          {canAssign && (
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                          )}
                          {!canAssign && (
                            <span className="text-xs text-gray-400">Cannot assign</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Employees */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assigned Employees</h3>
                <span className="text-sm text-gray-500">
                  {assignedEmployees.length} assigned
                </span>
              </div>
            </div>

            <div className="p-6">
              {assignedEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No employees assigned yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Select employees from the available list to assign them
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedEmployees.map((employee: Employee) => (
                    <div
                      key={employee._id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {employee.userId.profilePicture ? (
                              <img 
                                src={employee.userId.profilePicture} 
                                alt={employee.userId.firstName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.userId.firstName} {employee.userId.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{employee.employeeId}</span>
                              <span>•</span>
                              <span>{employee.userId.role.display_name || employee.userId.role.name}</span>
                              <span className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                                L{employee.userId.role.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>Joined: {formatDate(employee.joiningDate)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignEmployee(employee._id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                          title="Unassign"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAssign;