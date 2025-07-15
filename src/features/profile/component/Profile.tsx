import React, { useState, useRef } from 'react';
import { Edit } from 'lucide-react';
import { useGetEmployeeProfileQuery, useUpdateEmployeeMutation } from '../../../services/employeeServices';
import { useUser } from '../../dashboard/context/DashboardContext';
import { getUserData,logout } from '../../../services/authService';
const Profile: React.FC = () => {
  const { data, isLoading, refetch } = useGetEmployeeProfileQuery({});
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser } = useUser();
  if (isLoading) {

    console.log(isLoading, 'Loading profile data...');
    return <div>Loading...</div>;
  }

  // Function to get initials from first and last name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Function to generate a color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>,employee:any) => {
    //console.log("employeeData",employeeData)
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
      formData.append('profilePicture', file);
      const userData :any = {}
      userData.profilePicture = file;
      const employeeData :any = {}
      employeeData.userData = userData;
      console.log(employeeData)
      const result = await updateEmployee({
        id: employee?._id!,
        data: formData 
      }).unwrap();

      console.log('Upload successful:', result);
      refetch(); // Refresh profile data
      //alert('Profile picture updated successfully!');
      const res = await getUserData();
      // console.log('User Data:', res);
      setUser(res.user);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const firstName = data?.data?.user?.firstName || '';
  const lastName = data?.data?.user?.lastName || '';
  const profilePicture = previewImage || data?.data?.user?.profilePicture;
  const hasProfilePicture = profilePicture && profilePicture.trim() !== '';
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e)=>handleFileChange(e,data?.data)}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center mb-4">
        {/* Profile Picture Container */}
        <div 
          className={`relative w-24 h-24 mr-4 cursor-pointer group ${isUploading ? 'pointer-events-none' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleImageClick}
        >
          {hasProfilePicture ? (
            <>
              {/* Actual Profile Picture */}
              <img 
                src={profilePicture} 
                alt="Profile" 
                className={`w-24 h-24 rounded-full object-cover transition-all duration-300 ${
                  isHovered ? 'blur-sm brightness-50' : ''
                } ${isUploading ? 'opacity-50' : ''}`}
                onError={(e) => {
                  // Handle broken image by hiding it
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Hover Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <Edit size={24} className="text-white" />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Default Avatar with Initials */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                getAvatarColor(firstName || '')
              } ${isHovered ? 'brightness-75' : ''} ${isUploading ? 'opacity-50' : ''}`}>
                {getInitials(firstName, lastName)}
              </div>
              
              {/* Hover Overlay for Default Avatar */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full"></div>
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white relative z-10"></div>
                ) : (
                  <Edit size={24} className="text-white relative z-10" />
                )}
              </div>
            </>
          )}
          
          {/* Hover Ring Effect */}
          <div className={`absolute inset-0 rounded-full border-2 border-blue-500 transition-opacity duration-300 ${
            isHovered && !isUploading ? 'opacity-100' : 'opacity-0'
          }`}></div>
          
          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded shadow">
                Uploading...
              </span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div>
          <h3 className="text-xl font-semibold">{`${firstName} ${lastName}`}</h3>
          <p className="text-gray-600">{data?.data?.user?.email}</p>
        </div>
      </div>
      
      {/* Profile Details */}
      <div className="space-y-2">
        {/* <p><strong>Department:</strong> {data?.data?.department}</p>
        <p><strong>Designation:</strong> {data?.data?.designation}</p> */}
        <p><strong>Date of Joining:</strong> {new Date(data?.data?.joiningDate).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Profile;