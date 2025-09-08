import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useGetDesignationByIdQuery,
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

  const { data, isLoading, isFetching } = useGetDepartmentsQuery(
    { page: 1, limit: 100, search: '' },
    { refetchOnMountOrArgChange: true }
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

  // Derived data
  const activeDepartments = useMemo(() => data?.data || [], [data]);

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

  // Handle input changes
  const handleInputChange = (field: keyof DesignationForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const formData = {
        title: form.title.trim(),
        department: form.department || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };

      if (isEdit && id) {
        const result = await updateDesignation({ id, data: formData }).unwrap();
        if (result.success) navigate('/designations');
      } else {
        const result = await createDesignation(formData).unwrap();
        if (result.success) navigate('/designations');
      }
    } catch (error: any) {
      console.error('Save failed:', error);

      // Handle validation errors from backend
      if (error?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        error.data.errors.forEach((err: any) => {
          if (err.path) backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors);
      } else if (error?.data?.message) {
        setErrors({ general: error.data.message });
      } else {
        setErrors({ general: 'An error occurred while saving the designation' });
      }
    }
  };

  // Loading state (Edit mode fetch)
  if (isEdit && isLoadingDesignation) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading designation…</span>
        </div>
      </div>
    );
  }

  const actionBusy = isCreating || isUpdating;

  const showErrorSummary = Object.values(errors).some(Boolean);

  return (
    <div className="mx-auto">
      <div className="p-6 bg-gray-50 min-h-fit rounded-lg">
        {/* Header */}
        <div className="border-b mb-6 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Designation' : 'Create New Designation'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit ? 'Update designation information' : 'Add a new designation to the system'}
          </p>
        </div>

        {/* Error summary */}
        {showErrorSummary && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">Please fix the following:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
              {errors.title && <li>Title: {errors.title}</li>}
              {errors.department && <li>Department: {errors.department}</li>}
              {errors.description && <li>Description: {errors.description}</li>}
              {errors.general && <li>{errors.general}</li>}
            </ul>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="">
          {/* Fields */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-1">
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter designation title (e.g., Software Engineer)"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p id="title-error" className="mt-1 text-sm text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Department */}
            <div className="sm:col-span-1">
              <label htmlFor="department" className="mb-2 block text-sm font-medium text-gray-700">
                Department
              </label>
              <div className="relative">
                <select
                  id="department"
                  value={form.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={isLoading || isFetching}
                  aria-busy={isLoading || isFetching}
                  className={`w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department (Optional)</option>
                  {activeDepartments.map((dept: any) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
              </div>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
              {(isLoading || isFetching) && (
                <p className="mt-1 text-xs text-gray-500">Loading departments…</p>
              )}
            </div>

         

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter designation description (optional)"
                rows={4}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : 'description-help'}
                className={`w-full resize-y rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="mt-1 flex items-center justify-between text-xs sm:text-sm text-gray-500">
                <span id="description-help" className="sr-only sm:not-sr-only">
                  Optional. Max 500 characters.
                </span>
                {errors.description && (
                  <span id="description-error" className="text-red-600">
                    {errors.description}
                  </span>
                )}
                <span>{form.description.length}/500</span>
              </div>
            </div>
               {/* Status */}
            <div className="sm:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="text-sm text-gray-800">Active</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Inactive designations will not be available for selection.</p>
            </div>
          </div>

          {/* Actions (mobile sticky) */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:static sm:border-0 sm:bg-transparent sm:p-0">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/designations')}
                className="bg-red-500 flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 font-medium text-white  disabled:cursor-not-allowed disabled:opacity-50"
                disabled={actionBusy}
              >
                <XCircle size={18} />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>

              <button
                type="submit"
                disabled={actionBusy}
                className="flex items-center gap-2 rounded-md bg-[#202c74] px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionBusy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isEdit ? (
                  <Save size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {actionBusy ? 'Saving…' : isEdit ? 'Update Designation' : 'Create Designation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DesignationCreate;
