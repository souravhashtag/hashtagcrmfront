import React, { useState, useEffect } from 'react';
import { Calendar, Upload, X, Clock } from 'lucide-react';
import {
  useCreateLeaveMutation,
  useGetLeaveByIdQuery,
  useUpdateLeaveMutation,
  useGetLeaveBalanceQuery
} from '../../../services/leaveServices';

interface LeaveFormData {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
  attachments: File[];
}

interface LeaveApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLeaveId?: string;
  onSuccess?: () => void;
}

const LeaveApplyModal: React.FC<LeaveApplyModalProps> = ({
  isOpen,
  onClose,
  editLeaveId,
  onSuccess
}) => {
  const isEdit = Boolean(editLeaveId);

  const [formData, setFormData] = useState<LeaveFormData>({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    attachments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Queries and mutations
  const { data: leaveData, isLoading: isLoadingLeave } = useGetLeaveByIdQuery(editLeaveId!, {
    skip: !isEdit || !editLeaveId
  });
  const { data: leaveBalance } = useGetLeaveBalanceQuery();
  const [createLeave] = useCreateLeaveMutation();
  const [updateLeave] = useUpdateLeaveMutation();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && !isEdit) {
      setFormData({
        type: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false,
        attachments: []
      });
      setErrors({});
      setCurrentStep(1);
    }
  }, [isOpen, isEdit]);

  // Populate form for edit mode
  useEffect(() => {
    if (isEdit && leaveData?.data) {
      const leave = leaveData.data;
      setFormData({
        type: leave.type || 'casual',
        startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
        endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
        reason: leave.reason || '',
        isHalfDay: leave.totalDays === 0.5,
        attachments: []
      });
    }
  }, [isEdit, leaveData]);

  const handleInputChange = (field: keyof LeaveFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const calculateDays = () => {
    if (!formData.startDate) return 0;

    if (formData.isHalfDay) return 0.5;

    if (!formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.type) newErrors.type = 'Leave type is required';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';

      // End date is only required if NOT half day
      if (!formData.isHalfDay && !formData.endDate) {
        newErrors.endDate = 'End date is required';
      }

      // Date validation
      if (formData.startDate) {
        const start = new Date(formData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
          newErrors.startDate = 'Start date cannot be in the past';
        }

        // Only validate end date if it's provided (for non-half-day leaves)
        if (!formData.isHalfDay && formData.endDate) {
          const end = new Date(formData.endDate);
          if (end < start) {
            newErrors.endDate = 'End date must be after start date';
          }
        }
      }
    }

    if (step === 2) {
      if (!formData.reason.trim()) newErrors.reason = 'Reason is required';

      // File size validation
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      formData.attachments.forEach((file, index) => {
        if (file.size > maxFileSize) {
          newErrors[`file_${index}`] = `${file.name} is too large. Maximum size is 5MB.`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('startDate', formData.startDate);
      // For half day, use start date as end date
      submitData.append('endDate', formData.isHalfDay ? formData.startDate : formData.endDate);
      submitData.append('reason', formData.reason);
      submitData.append('isHalfDay', formData.isHalfDay.toString());

      // Add attachments
      formData.attachments.forEach((file) => {
        submitData.append('attachments', file);
      });

      if (isEdit) {
        await updateLeave({ id: editLeaveId!, data: submitData }).unwrap();
      } else {
        await createLeave(submitData).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting leave:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to submit leave request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe getter for leave balance with fallbacks
  const getLeaveBalanceSafe = (type: 'casual' | 'medical') => {
    const typeMap = {
      casual: 'casualLeaves',
      medical: 'medicalLeaves'
    };

    const balanceData = leaveBalance?.data?.[typeMap[type] as keyof typeof leaveBalance.data];

    return {
      total: balanceData?.total ?? 0,
      used: balanceData?.used ?? 0,
      remaining: balanceData?.remaining ?? 0
    };
  };

  const getLeaveBalance = (type: string) => {
    if (!leaveBalance?.data) return null;

    const balanceMap: Record<string, any> = {
      casual: leaveBalance.data.casualLeaves,
      medical: leaveBalance.data.medicalLeaves,
      annual: leaveBalance.data.annualLeaves
    };

    return balanceMap[type];
  };

  if (!isOpen) return null;

  if (isEdit && isLoadingLeave) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Leave Request' : 'Apply for Leave'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? 'Update your leave request details'
                : 'Submit a new leave request for approval'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Leave Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Reason & Attachments</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Leave Balance Card */}
          {leaveBalance?.data && currentStep === 1 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Leave Balance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Casual Leave Card */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                  <p className="text-sm font-semibold text-blue-700 mb-2">Casual Leave</p>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-base font-bold text-blue-900">{getLeaveBalanceSafe('casual').total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Used</p>
                      <p className="text-base font-bold text-blue-600">
                        {getLeaveBalanceSafe('casual').used}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p className="text-base font-bold text-green-700">
                        {getLeaveBalanceSafe('casual').remaining}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-blue-100 rounded">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{
                        width: `${(getLeaveBalanceSafe('casual').used / getLeaveBalanceSafe('casual').total) * 100
                          }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Medical Leave Card */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
                  <p className="text-sm font-semibold text-red-700 mb-2">Medical Leave</p>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-base font-bold text-red-900">{getLeaveBalanceSafe('medical').total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Used</p>
                      <p className="text-base font-bold text-red-600">
                        {getLeaveBalanceSafe('medical').used}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p className="text-base font-bold text-green-700">
                        {getLeaveBalanceSafe('medical').remaining}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-red-100 rounded">
                    <div
                      className="h-full bg-red-500 rounded"
                      style={{
                        width: `${(getLeaveBalanceSafe('medical').used / getLeaveBalanceSafe('medical').total) * 100
                          }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Step 1: Leave Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Leave Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'casual', label: 'Casual', color: 'blue' },
                    { value: 'medical', label: 'Medical', color: 'red' }
                  ].map((type) => {
                    const balance = getLeaveBalance(type.value);
                    const isSelected = formData.type === type.value;

                    return (
                      <label
                        key={type.value}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${isSelected
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="leaveType"
                          value={type.value}
                          checked={isSelected}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-center w-full">
                          <p className="font-medium text-gray-900">{type.label}</p>
                          {balance?.remaining !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              {balance.remaining} left
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.type && (
                  <p className="mt-2 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              {/* Half Day Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isHalfDay}
                    onChange={(e) => {
                      const isHalfDay = e.target.checked;
                      handleInputChange('isHalfDay', isHalfDay);

                      // If half day is selected, set end date to start date
                      if (isHalfDay && formData.startDate) {
                        handleInputChange('endDate', formData.startDate);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Half Day Leave
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.isHalfDay ? 'End date will be set to the same as start date' : 'Select for half day leave'}
                </p>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    From Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        handleInputChange('startDate', e.target.value);
                        // Auto-set end date if half day
                        if (formData.isHalfDay) {
                          handleInputChange('endDate', e.target.value);
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {errors.startDate && (
                    <p className="mt-2 text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    To Date {!formData.isHalfDay && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      disabled={formData.isHalfDay}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.isHalfDay ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {formData.isHalfDay && (
                    <p className="mt-2 text-xs text-gray-500">
                      Not required for half day leave
                    </p>
                  )}
                  {errors.endDate && (
                    <p className="mt-2 text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Days Calculation */}
              {formData.startDate && (formData.endDate || formData.isHalfDay) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Total Leave Days: {calculateDays()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Reason & Attachments */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Leave Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Leave Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium capitalize">{formData.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 font-medium">{calculateDays()} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">From:</span>
                    <span className="ml-2 font-medium">{formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not selected'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>
                    <span className="ml-2 font-medium">
                      {formData.isHalfDay
                        ? (formData.startDate ? new Date(formData.startDate).toLocaleDateString() + ' (Half Day)' : 'Not selected')
                        : (formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Not selected')
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Leave *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Please provide a detailed reason for your leave request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between mt-2">
                  {errors.reason && (
                    <p className="text-sm text-red-600">{errors.reason}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.reason.length}/300 characters
                  </p>
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Attach medical certificates, documents, etc. (Max 5MB per file)
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload-modal"
                  />
                  <label
                    htmlFor="file-upload-modal"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload files or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOC, DOCX, JPG, PNG up to 5MB
                    </p>
                  </label>
                </div>

                {/* File List */}
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <Upload className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Errors */}
                {Object.keys(errors).some(key => key.startsWith('file_')) && (
                  <div className="mt-2">
                    {Object.entries(errors)
                      .filter(([key]) => key.startsWith('file_'))
                      .map(([key, error]) => (
                        <p key={key} className="text-sm text-red-600">{error}</p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-200">
          {currentStep === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEdit ? 'Updating...' : 'Submitting...'}
                  </div>
                ) : (
                  isEdit ? 'Update Leave Request' : 'Submit Leave Request'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApplyModal;