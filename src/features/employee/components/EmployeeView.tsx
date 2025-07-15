import React,{useEffect} from 'react';
import { useGetEmployeeByIdQuery } from '../../../services/employeeServices';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit, User, Mail, Phone, Calendar, Building, 
  DollarSign, FileText, Download, Star, Badge, MapPin, 
  CreditCard, Shield, AlertCircle, CheckCircle
} from 'lucide-react';

const EmployeeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: employeeData, isLoading, error,refetch } = useGetEmployeeByIdQuery(id!);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: any) => {
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

  const calculateTenure = (joiningDate: string | Date) => {
    const today = new Date();
    const joinDate = new Date(joiningDate);
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };
  useEffect(()=>{
    refetch();
  },[])
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading employee details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employeeData?.data) {
    return (
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Employee not found</p>
          <button
            onClick={() => navigate('/employee')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  const employee = employeeData.data;
  const user = employee.userId;

  return (
    <div className=" mx-auto bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/employee')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Details</h1>
              <p className="text-sm text-gray-600">Complete employee information</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/employee/edit/${employee._id}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Edit size={16} />
            Edit Employee
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Employee Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {user?.profilePicture ? (
                <img 
                  className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg" 
                  // src={user?.profilePicture}
                  src="http://localhost:5000/uploads\profilepicture\1750829812403-man.png" 
                  alt={`${user.firstName} ${user.lastName}`}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                {getStatusBadge(user?.status || 'pending')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">{employee.employeeId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{user?.department?.name || 'Not assigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Tenure:</span>
                  <span className="font-medium">{calculateTenure(employee.joiningDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.phone || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formatDate(employee.dob)} ({calculateAge(employee.dob)} years old)
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joining Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(employee.joiningDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="mt-1">
                    <span className="text-gray-900 font-medium">
                      {user?.role?.display_name || user?.role?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <div className="mt-1">
                    <span className="text-gray-900">{user?.position || 'Not specified'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <div className="mt-1">
                    <span className="text-gray-900">{user?.department?.name || 'Not assigned'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login</label>
                  <div className="mt-1">
                    <span className="text-gray-900">
                      {user?.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            {employee.salary && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Salary</label>
                    <div className="mt-1">
                      <span className="text-gray-900 font-medium text-lg">
                        {formatSalary(employee.salary)}
                      </span>
                    </div>
                  </div>
                  {employee.taxInformation?.taxBracket && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tax Bracket</label>
                      <div className="mt-1">
                        <span className="text-gray-900">{employee.taxInformation.taxBracket}</span>
                      </div>
                    </div>
                  )}
                  {employee.taxInformation?.taxId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tax ID</label>
                      <div className="mt-1">
                        <span className="text-gray-900">{employee.taxInformation.taxId}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Details */}
                {employee.bankDetails && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Bank Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Account Holder</label>
                        <div className="mt-1">
                          <span className="text-gray-900">{employee.bankDetails.accountHolderName}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Bank Name</label>
                        <div className="mt-1">
                          <span className="text-gray-900">{employee.bankDetails.bankName}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Account Number</label>
                        <div className="mt-1">
                          <span className="text-gray-900">****{employee.bankDetails.accountNumber?.slice(-4)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">IFSC Code</label>
                        <div className="mt-1">
                          <span className="text-gray-900">{employee.bankDetails.ifscCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            {employee.documents && employee.documents.length > 0 && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents ({employee.documents.length})
                </h3>
                <div className="space-y-3">
                  {employee.documents.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{doc.type} Document</div>
                        </div>
                      </div>
                      {doc.url && (
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                          <Download size={14} />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Emergency Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <div className="mt-1">
                      <span className="text-gray-900 font-medium">{employee.emergencyContact.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Relationship</label>
                    <div className="mt-1">
                      <span className="text-gray-900">{employee.emergencyContact.relationship}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{employee.emergencyContact.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Reviews */}
            {employee.performanceReviews && employee.performanceReviews.length > 0 && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Performance Reviews ({employee.performanceReviews.length})
                </h3>
                <div className="space-y-4">
                  {employee.performanceReviews.slice(0, 3).map((review: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(review.reviewDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.ratings?.overall || 0)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Reviewer: {review.reviewerId?.firstName} {review.reviewerId?.lastName}
                      </div>
                      {review.feedback && (
                        <div className="text-sm text-gray-700">
                          "{review.feedback}"
                        </div>
                      )}
                    </div>
                  ))}
                  {employee.performanceReviews.length > 3 && (
                    <div className="text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        View all {employee.performanceReviews.length} reviews
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Created</span>
                  <span className="text-sm font-medium">{formatDate(employee.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">{formatDate(employee.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium">{employee.documents?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviews</span>
                  <span className="text-sm font-medium">{employee.performanceReviews?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;