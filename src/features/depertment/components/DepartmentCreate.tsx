import React, { useState, useEffect } from 'react';
import { 
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation 
} from '../../../services/depertmentServices';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Building, FileText } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
}

const DepartmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Queries and mutations
  const { data: departmentData, isLoading: isLoadingDepartment,refetch } = useGetDepartmentByIdQuery(id!, {
    skip: !isEditMode
  });
  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(!isEditMode); 
  const [originalData, setOriginalData] = useState<FormData>({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isEditMode && departmentData?.data) {
      const dept = departmentData.data;
      const initialData = {
        name: dept.name || '',
        description: dept.description || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [departmentData, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      refetch()
      const changed = formData.name !== originalData.name || 
                     formData.description !== originalData.description;
      setHasChanges(changed);
    }
  }, [formData, originalData, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Department name must be less than 100 characters';
    }

    // Optional description validation
    if (formData.description && formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // In edit mode, check if there are changes
    if (isEditMode && !hasChanges) {
      navigate('/department');
      return;
    }

    try {
      const departmentData = {
        name: formData.name.trim(),
        description: formData.description.trim()
      };

      if (isEditMode) {
        await updateDepartment({ id: id!, data: departmentData }).unwrap();
        navigate('/department', { 
          state: { message: 'Department updated successfully!' }
        });
      } else {
        await createDepartment(departmentData).unwrap();
        navigate('/department', { 
          state: { message: 'Department created successfully!' }
        });
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} department:`, error);
      
      // Handle specific error messages from backend
      if (error?.data?.message) {
        if (error.data.message.includes('already exists') || error.data.message.includes('duplicate')) {
          setErrors({ name: 'A department with this name already exists' });
        } else {
          alert(error.data.message);
        }
      } else {
        alert(`Failed to ${isEditMode ? 'update' : 'create'} department. Please try again.`);
      }
    }
  };

  const handleCancel = () => {
    const shouldConfirm = isEditMode ? hasChanges : (formData.name.trim() || formData.description.trim());
    
    if (shouldConfirm) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        navigate('/department');
      }
    } else {
      navigate('/department');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      if (isEditMode) {
        setFormData(originalData);
      } else {
        setFormData({ name: '', description: '' });
      }
      setErrors({});
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingDepartment) {
    return (
      <div className=" mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading department...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (isEditMode && !departmentData?.data) {
    return (
      <div className=" mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Department not found</p>
          <button
            onClick={() => navigate('/department')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  const isLoading = isCreating || isUpdating;

  return (
    <div className=" mx-auto bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {isEditMode ? 'Update Department' : 'Create New Department'}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? `Editing: ${originalData.name}`
                  : 'Add a new department to your organization'
                }
              </p>
            </div>
          </div>
          {isEditMode && hasChanges && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Unsaved changes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter department name (e.g., Engineering, Marketing, Sales)"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">!</span>
                {errors.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Department Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-vertical ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the department's role, responsibilities, and purpose (optional)"
              maxLength={500}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">!</span>
                {errors.description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Change Summary (Edit Mode Only) */}
          {isEditMode && hasChanges && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-orange-900 mb-2">Changes detected:</h3>
              <ul className="text-xs text-orange-800 space-y-1">
                {formData.name !== originalData.name && (
                  <li>• Name: "{originalData.name}" → "{formData.name}"</li>
                )}
                {formData.description !== originalData.description && (
                  <li>• Description: "{originalData.description || 'Empty'}" → "{formData.description || 'Empty'}"</li>
                )}
              </ul>
            </div>
          )}

          
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-700 transition"
            >
              Cancel
            </button>
            
            {(isEditMode ? hasChanges : (formData.name.trim() || formData.description.trim())) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition"
              >
                {isEditMode ? 'Reset Changes' : 'Clear Form'}
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim() || (isEditMode && !hasChanges)}
            className="flex items-center gap-2 px-6 py-2 bg-[#202c74] text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditMode 
                  ? (hasChanges ? 'Update Department' : 'No Changes')
                  : 'Create Department'
                }
              </>
            )}
          </button>
        </div>

        {/* Preview Section */}
        {(formData.name.trim() || formData.description.trim()) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview:</h3>
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {formData.name.trim() || 'Department Name'}
                  </div>
                  {formData.description.trim() && (
                    <div className="text-sm text-gray-600 mt-1">
                      {formData.description.trim()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default DepartmentForm;