// components/designation/DesignationCreate.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  useCreateDesignationMutation, 
  useUpdateDesignationMutation, 
  useGetDesignationByIdQuery 
} from '../../../services/designationServices';
import { useGetDepartmentsQuery } from '../../../services/depertmentServices';
import { Save, Plus, XCircle, Loader2 } from 'lucide-react';

interface DesignationForm {
  title: string;
  department: string;
  description: string;
  isActive: boolean;
}

const DesignationCreate: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<DesignationForm>({
    title: '',
    department: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // RTK Query hooks
  const { data: designationData, isLoading: isLoadingDesignation } = useGetDesignationByIdQuery(id!, {
    skip: !isEdit || !id,
  });

  const {
      data,
      isLoading,
      refetch,
      isFetching
    } = useGetDepartmentsQuery(
      { page: 1, limit:100, search:'' },
      {
        refetchOnMountOrArgChange: true,
      }
    );

  const [createDesignation, { isLoading: isCreating }] = useCreateDesignationMutation();
  const [updateDesignation, { isLoading: isUpdating }] = useUpdateDesignationMutation();

  // Populate form for edit mode
  useEffect(() => {
    if (isEdit && designationData?.success && designationData?.data) {
      const designation = designationData.data;
      setForm({
        title: designation.title || '',
        department: designation.department?._id || '',
        description: designation.description || '',
        isActive: designation.isActive ?? true,
      });
    }
  }, [isEdit, designationData]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    } else if (form.title.trim().length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }

    if (form.description && form.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const formData = {
        title: form.title.trim(),
        department: form.department || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };

      if (isEdit && id) {
        const result = await updateDesignation({ id, data: formData }).unwrap();
        if (result.success) {
          navigate('/designations');
        }
      } else {
        const result = await createDesignation(formData).unwrap();
        if (result.success) {
          navigate('/designations');
        }
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      
      // Handle validation errors from backend
      if (error?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        error.data.errors.forEach((err: any) => {
          if (err.path) {
            backendErrors[err.path] = err.msg;
          }
        });
        setErrors(backendErrors);
      } else if (error?.data?.message) {
        setErrors({ general: error.data.message });
      } else {
        setErrors({ general: 'An error occurred while saving the designation' });
      }
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof DesignationForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Loading state
  if (isEdit && isLoadingDesignation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading designation...</span>
        </div>
      </div>
    );
  }

  // Get active departments
  const activeDepartments = data?.data || [];
//   console.log("activeDepartments===>",activeDepartments);
  return (
    <div className=" mx-auto p-6 shadow-lg rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Designation' : 'Create New Designation'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEdit ? 'Update designation information' : 'Add a new designation to the system'}
        </p>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter designation title (e.g., Software Engineer)"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-300 bg-red-50' : ''
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Department Field */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            id="department"
            value={form.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.department ? 'border-red-300 bg-red-50' : ''
            }`}
            disabled={isLoading}
          >
            <option value="">Select Department (Optional)</option>
            {activeDepartments.map((dept: any) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          {isLoading && (
            <p className="mt-1 text-sm text-gray-500">Loading departments...</p>
          )}
          {errors.department && (
            <p className="mt-1 text-sm text-red-600">{errors.department}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter designation description (optional)"
            rows={4}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
              errors.description ? 'border-red-300 bg-red-50' : ''
            }`}
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>{errors.description || ''}</span>
            <span>{form.description.length}/500</span>
          </div>
        </div>

        {/* Status Field */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Inactive designations will not be available for selection
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/designations')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium rounded-md hover:bg-gray-100 transition duration-200 border border-gray-300"
            disabled={isCreating || isUpdating}
          >
            <XCircle size={18} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating || isUpdating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isEdit ? (
              <Save size={18} />
            ) : (
              <Plus size={18} />
            )}
            {isCreating || isUpdating
              ? 'Saving...'
              : isEdit
              ? 'Update Designation'
              : 'Create Designation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DesignationCreate;