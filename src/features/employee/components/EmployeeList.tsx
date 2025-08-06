import React, { useState, useEffect } from 'react';
import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation
} from '../../../services/employeeServices';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Search, X, User, Calendar, DollarSign, Phone, 
  Mail, Building, Badge, FileText, Star, Eye, UserPlus
} from 'lucide-react';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: {
    _id: string;
    name: string;
    display_name?: string;
  };
  department?: {
    _id: string;
    name: string;
  };
  position?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin?: Date;
  fullName: string;
}

interface Employee {
  _id: string;
  userId: User;
  employeeId: string;
  joiningDate: Date;
  dob: Date;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents: Array<{
    type: 'id' | 'contract' | 'certificate' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    accountHolderName: string;
  };
  salary?: {
    amount: number;
    currency: string;
    paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  };
  taxInformation?: {
    taxId: string;
    taxBracket: string;
  };
  performanceReviews: Array<{
    reviewDate: Date;
    reviewerId: string;
    ratings: {
      productivity: number;
      communication: number;
      teamwork: number;
      initiative: number;
      overall: number;
    };
    feedback: string;
    goals: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const limit = 10;

  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useGetEmployeesQuery(
    { page: currentPage, limit, search },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const [deleteEmployee] = useDeleteEmployeeMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    refetch();
  };

  const handleDelete = async (id: string, employeeId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete employee "${name}" (${employeeId})?`)) {
      try {
        await deleteEmployee(id).unwrap();
        refetch();
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  const handleAssign = (employee: Employee) => {
    // Add your assign logic here
    // For example, navigate to an assignment page or open a modal
    // console.log('Assign action for employee:', employee.employeeId);
    // You can implement navigation to assignment page:
    navigate(`/employee/assign/${employee._id}`);
    // Or open a modal for assignment
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary?: Employee['salary']) => {
    if (!salary?.amount) return 'Not specified';
    return `${salary.currency} ${salary.amount.toLocaleString()}/${salary.paymentFrequency}`;
  };

  const calculateAge = (dob: string | Date) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAverageRating = (reviews: Employee['performanceReviews']) => {
    if (!reviews || reviews.length === 0) return null;
    const latestReview = reviews[reviews.length - 1];
    return latestReview?.ratings?.overall || null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={12}
        className={index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  useEffect(() => {
    refetch();
  }, [currentPage, search]);

  const employees: Employee[] = data?.data || [];
  const pagination = data?.pagination;

  // Filter employees by status if needed
  const filteredEmployees = statusFilter === 'all' 
    ? employees 
    : employees.filter(emp => emp.userId?.status === statusFilter);

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your organization's workforce</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={() => navigate('/employee/create')}
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, employee ID, email, or department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </form>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      {isLoading || isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading employees...</p>
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No employees found.</p>
          <p className="text-gray-400 text-sm">Try adjusting your search criteria or add a new employee.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Role & Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Personal Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Employment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Compensation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Emergency Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#FFF] uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#FFF] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                const averageRating = getAverageRating(employee.performanceReviews);
                return (
                  <tr key={employee._id} className="hover:bg-gray-50 transition-colors duration-200">
                    {/* Employee Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {employee.userId?.profilePicture ? (
                            <img 
                              className="h-12 w-12 rounded-full object-cover" 
                              src={employee.userId.profilePicture} 
                              alt={employee.userId.fullName || `${employee.userId.firstName} ${employee.userId.lastName}`}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.userId?.fullName || `${employee.userId?.firstName} ${employee.userId?.lastName}`}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Badge className="h-3 w-3" />
                            {employee.employeeId}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.userId?.email}
                          </div>
                          <div className="mt-1">
                            {getStatusBadge(employee.userId?.status || 'pending')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Department */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {employee.userId?.role?.display_name || employee.userId?.role?.name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Building className="h-3 w-3" />
                          <span className="text-xs">{employee.userId?.department?.name || 'No Department'}</span>
                        </div>
                        {employee.userId?.position && (
                          <div className="text-xs text-gray-500">
                            Position: {employee.userId.position}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Personal Info */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">DOB: {formatDate(employee.dob)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Age: {calculateAge(employee.dob)} years
                        </div>
                        {employee.userId?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">{employee.userId.phone}</span>
                          </div>
                        )}
                        {employee.documents && employee.documents.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">{employee.documents.length} document(s)</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Employment */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">Joined: {formatDate(employee.joiningDate)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Tenure: {Math.floor((new Date().getTime() - new Date(employee.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                        </div>
                        {employee.userId?.lastLogin && (
                          <div className="text-xs text-gray-500">
                            Last Login: {formatDate(employee.userId.lastLogin)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Compensation */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{formatSalary(employee.salary)}</span>
                        </div>
                        {employee.taxInformation?.taxBracket && (
                          <div className="text-xs text-gray-500">
                            Tax: {employee.taxInformation.taxBracket}
                          </div>
                        )}
                        {employee.bankDetails?.bankName && (
                          <div className="text-xs text-gray-500">
                            Bank: {employee.bankDetails.bankName}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Emergency Contact */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.emergencyContact?.name ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium">{employee.emergencyContact.name}</div>
                          <div className="text-xs text-gray-500">{employee.emergencyContact.relationship}</div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">{employee.emergencyContact.phone}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not provided</span>
                      )}
                    </td>

                    {/* Performance */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {averageRating ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {renderStars(averageRating)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {employee.performanceReviews.length} review(s)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No reviews yet</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => navigate(`/employee/${employee._id}`)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleAssign(employee)}
                          className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition"
                          title="Assign Task/Role"
                        >
                          <UserPlus size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/employee/edit/${employee._id}`)}
                          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(
                            employee._id, 
                            employee.employeeId, 
                            employee.userId?.fullName || `${employee.userId?.firstName} ${employee.userId?.lastName}`
                          )}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_records} total employees)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded">
              {pagination.current_page}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;