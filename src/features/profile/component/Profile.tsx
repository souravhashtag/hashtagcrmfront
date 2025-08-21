import React, { useState, useRef } from 'react';
import {
  Edit,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Camera,
  Briefcase,
  Clock,
  X,
  Check
} from 'lucide-react';
import { useGetEmployeeProfileQuery, useUpdateEmployeeMutation } from '../../../services/employeeServices';
import { useUser } from '../../dashboard/context/DashboardContext';
import { getUserData } from '../../../services/authService';

// TypeScript interfaces
interface Role {
  _id?: string;
  name: string;
  display_name?: string;
}

interface Department {
  _id?: string;
  name: string;
}

interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role?: Role;
  department?: Department;
  status?: 'active' | 'pending' | 'inactive';
}

interface EmployeeData {
  _id: string;
  employeeId: string;
  joiningDate: string;
  dob: string;
  user: UserData;
}

interface EditFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  joiningDate: string;
}

const Profile: React.FC = () => {
  const { data, isLoading, refetch } = useGetEmployeeProfileQuery({});
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser } = useUser();

  // Edit states
  const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    joiningDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const profileData: EmployeeData | undefined = data?.data;
  const userData: UserData | undefined = profileData?.user;

  // Helper functions
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateTenure = (joiningDate: string): string => {
    const today = new Date();
    const joinDate = new Date(joiningDate);
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const remainingMonths = Math.floor(remainingDays / 30);
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForInput = (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Edit functionality
  const startEditingContact = (): void => {
    setEditFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      dob: profileData?.dob || '',
      joiningDate: profileData?.joiningDate || ''
    });
    setIsEditingContact(true);
    setErrors({});
  };

  const startEditingPersonal = (): void => {
    setEditFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      dob: profileData?.dob || '',
      joiningDate: profileData?.joiningDate || ''
    });
    setIsEditingPersonal(true);
    setErrors({});
  };

  const cancelEdit = (): void => {
    setIsEditingContact(false);
    setIsEditingPersonal(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!editFormData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!editFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (editFormData.phone && !/^\+?[\d\s\-()]+$/.test(editFormData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EditFormData, value: string): void => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const saveChanges = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      const formData = new FormData();

      // Prepare user data
      const userData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone
      };

      // Prepare employee data
      const employeeData = {
        dob: editFormData.dob,
        joiningDate: editFormData.joiningDate
      };

      formData.append('userDatast', JSON.stringify(userData));
      formData.append('employeeDatast', JSON.stringify(employeeData));

      await updateEmployee({
        id: profileData?._id!,
        data: formData
      }).unwrap();

      // Update user data in context
      const res = await getUserData();
      setUser(res.user);

      // Refresh profile data
      refetch();

      // Close edit modes
      setIsEditingContact(false);
      setIsEditingPersonal(false);

      // Show success message (you can replace with a toast notification)
      alert('Profile updated successfully!');

    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.data?.message || 'Failed to update profile. Please try again.';
      alert(errorMessage);
    }
  };

  const handleImageClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Create FormData for file upload
      const formData = new FormData();

      // Add the profile picture file
      formData.append('profilePicture', file);

      // Backend expects these fields, send empty objects for profile picture only upload
      formData.append('userDatast', JSON.stringify({}));
      formData.append('employeeDatast', JSON.stringify({}));

      console.log('Uploading profile picture for employee:', profileData?._id);

      const result = await updateEmployee({
        id: profileData?._id!,
        data: formData
      }).unwrap();

      console.log('Upload successful:', result);

      // Update the preview with the new image URL if provided
      if (result.profilePictureUrl) {
        setPreviewImage(result.profilePictureUrl);
      }

      refetch(); // Refresh profile data

      // Update user data in state
      const res = await getUserData();
      setUser(res.user);

    } catch (error: any) {
      console.error('Error uploading file:', error);

      const errorMessage = error?.data?.message || 'Failed to upload image. Please try again.';
      alert(errorMessage);

      // Reset preview on error
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const firstName = userData?.firstName || '';
  const lastName = userData?.lastName || '';
  const profilePicture = previewImage || user?.profilePicture || userData?.profilePicture;
  const hasProfilePicture = profilePicture && profilePicture.trim() !== '';

  if (!profileData || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Cover Photo */}
          <div className="h-48 bg-[#111D32] relative">
            {/* <div className="absolute inset-0 bg-black bg-opacity-20"></div> */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end space-x-6">
                {/* Profile Picture */}
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                  />

                  <div
                    className={`relative w-32 h-32 cursor-pointer group ${isUploading ? 'pointer-events-none' : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleImageClick}
                  >
                    {hasProfilePicture ? (
                      <>
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className={`w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg transition-all duration-300 ${isHovered ? 'blur-sm brightness-75' : ''
                            } ${isUploading ? 'opacity-50' : ''}`}
                          onError={(e) => {
                            // Handle broken image by hiding it
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
                          }`}>
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          ) : (
                            <Camera size={32} className="text-white" />
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-32 h-32 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-2xl transition-all duration-300 ${getAvatarColor(firstName || '')
                          } ${isHovered ? 'brightness-75' : ''} ${isUploading ? 'opacity-50' : ''}`}>
                          {getInitials(firstName, lastName)}
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
                          }`}>
                          <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full"></div>
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white relative z-10"></div>
                          ) : (
                            <Camera size={32} className="text-white relative z-10" />
                          )}
                        </div>
                      </>
                    )}

                    {isUploading && (
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs text-white bg-black bg-opacity-50 px-3 py-1 rounded-full">
                          Uploading...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-white pb-4">
                  <h1 className="text-3xl font-bold mb-2">{`${firstName} ${lastName}`}</h1>
                  <p className="text-blue-100 text-lg mb-2">
                    {userData?.role?.display_name || userData?.role?.name || 'Employee'}
                  </p>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center space-x-2">
                      <CreditCard size={16} />
                      <span>{profileData?.employeeId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase size={16} />
                      <span>{userData?.department?.name || 'No Department'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                {!isEditingContact ? (
                  <button
                    onClick={startEditingContact}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isUpdating}
                  >
                    <Edit size={18} />
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={saveChanges}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isUpdating}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {!isEditingContact ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="text-blue-600" size={18} />
                    </div>
                    <div className="w-full pr-4">
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-gray-900 font-medium truncate">{userData?.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="text-green-600" size={18} />
                    </div>
                    <div className="w-full">
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-gray-900 font-medium">{userData?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
                {!isEditingPersonal ? (
                  <button
                    onClick={startEditingPersonal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isUpdating}
                  >
                    <Edit size={18} />
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={saveChanges}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isUpdating}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {!isEditingPersonal ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-purple-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="text-gray-900 font-medium">{formatDate(profileData?.dob)}</p>
                      <p className="text-xs text-gray-400">{calculateAge(profileData?.dob)} years old</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <User className="text-orange-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="text-gray-900 font-medium">{profileData?.employeeId}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editFormData.dob ? formatDateForInput(editFormData.dob) : ''}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Employment Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-indigo-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joining Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(profileData?.joiningDate)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-teal-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tenure</p>
                    <p className="text-gray-900 font-medium">{calculateTenure(profileData?.joiningDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;