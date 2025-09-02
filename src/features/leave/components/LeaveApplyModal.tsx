import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Upload, X, Clock } from 'lucide-react';
import {
  useCreateLeaveMutation,
  useGetLeaveByIdQuery,
  useUpdateLeaveMutation,
  useGetLeaveTypesQuery,
  useGetLeaveBalanceQuery
} from '../../../services/leaveServices';


const LeaveApplyModal: React.FC<LeaveApplyModalProps> = ({
  isOpen,
  onClose,
  leavesData,
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
  const { data: leaveTypesData, isLoading: isLoadingLeaveTypes } = useGetLeaveTypesQuery({
    page: 1,
    limit: 50, // Get enough leave types for selection
    search: ''
  });
  const [createLeave] = useCreateLeaveMutation();
  const [updateLeave] = useUpdateLeaveMutation();

  const getMinDate = () => {
    const today = new Date();

    // For medical leave, allow up to 2 weeks in the past
    if (formData.type === 'medical') {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);
      return twoWeeksAgo.toISOString().split('T')[0];
    }

    // For other leave types, only allow today onwards
    return today.toISOString().split('T')[0];
  };

  // Helper function to get leave types with color mapping
  const getAvailableLeaveTypes = () => {
    if (isLoadingLeaveTypes || !leaveTypesData?.data) {
      // Fallback to default types while loading
      return [
        {
          _id: 'casual',
          name: 'casual',
          displayName: 'Casual Leave',
          color: '#129990',
          ispaidLeave: true,
          leaveCount: 9
        },
        {
          _id: 'medical',
          name: 'medical',
          displayName: 'Medical Leave',
          color: '#ef4444',
          ispaidLeave: true,
          leaveCount: 9
        }
      ];
    }

    // Map API data to component format
    return leaveTypesData.data.map((type: {
      _id: string;
      name: string;
      ispaidLeave: boolean;
      leaveCount: number;
    }) => ({
      _id: type._id,
      name: type.name.toLowerCase(),
      displayName: type.name,
      color: getLeaveTypeColor(type.name),
      ispaidLeave: type.ispaidLeave,
      leaveCount: type.leaveCount
    }));
  };

  // Helper function to assign colors to leave types
  const getLeaveTypeColor = (name: string) => {
    const colors: Record<string, string> = {
      'casual': '#129990',
      'medical': '#ef4444',
      'sick': '#ef4444',
      'vacation': '#3b82f6',
      'emergency': '#f59e0b',
      'maternity': '#ec4899',
      'paternity': '#8b5cf6',
      'bereavement': '#6b7280',
      'study': '#10b981'
    };

    const normalizedName = name.toLowerCase();
    return colors[normalizedName] || '#6b7280'; // Default gray color
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && !isEdit) {
      const availableTypes = getAvailableLeaveTypes();

      // Filter types with remaining > 0
      const firstAvailable = availableTypes.find((t: any) => {
        const bal = getLeaveBalance(t.name);
        return Number(bal?.remaining ?? 0) > 0;
      });

      // Fallback: if none available, set to 'normal' or your unpaid leave type
      const defaultType = firstAvailable ? firstAvailable.name : 'normal';

      setFormData({
        type: defaultType,
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false,
        attachments: []
      });
      setErrors({});
      setCurrentStep(1);
    }
  }, [isOpen, isEdit, leaveTypesData, leaveBalance]);


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
          if (formData.type !== 'medical') {
            newErrors.startDate = 'Start date cannot be in the past';
          }
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


  const getLeaveBalance = (type: string) => {
    if (!leaveBalance?.data) return null;

    const balanceMap: Record<string, any> = {
      casual: leaveBalance.data.casualLeaves,
      medical: leaveBalance.data.medicalLeaves
    };

    return balanceMap[type];
  };

  // Add this helper function after your existing helper functions
  const formatLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getDisabledDates = () => {
    if (!leavesData?.data) return [];

    const disabledDates: string[] = [];

    leavesData.data.forEach((leave: any) => {
      if (leave.status === 'approved') {
        // Parse and normalize to local midnight
        const start = new Date(leave.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(leave.endDate);
        end.setHours(0, 0, 0, 0);

        // Loop inclusive of end date
        const current = new Date(start);
        while (current.getTime() <= end.getTime()) {
          const key = formatLocalYMD(current); // local YYYY-MM-DD
          if (!disabledDates.includes(key)) disabledDates.push(key);
          current.setDate(current.getDate() + 1);
        }
      }
    });

    return disabledDates;
  };

  const disabledDates = getDisabledDates();


  // NEW – group disabled dates into readable ranges
  const toLocalMidnight = (s: string) => new Date(`${s}T00:00:00`);
  const groupDisabledRanges = (dates: string[]) => {
    const sorted = [...dates].sort();
    const ranges: { start: string; end: string }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      let start = sorted[i];
      let end = start;
      while (i + 1 < sorted.length) {
        const d = toLocalMidnight(sorted[i]);
        const n = toLocalMidnight(sorted[i + 1]);
        if (n.getTime() - d.getTime() === 24 * 60 * 60 * 1000) {
          end = sorted[i + 1];
          i++;
        } else break;
      }
      ranges.push({ start, end });
    }
    return ranges;
  };

  const disabledRanges = useMemo(() => groupDisabledRanges(disabledDates), [disabledDates]);

  // Reuse your formatLocalYMD helper
  const getMaxEndDate = () => {
    // No cap if no start date yet
    if (!formData.startDate) return '';

    // For half-day, end must equal start
    if (formData.isHalfDay) return formData.startDate;

    // "normal" leave (unpaid) usually has no cap
    if (formData.type === 'normal') return '';

    const bal = getLeaveBalance(formData.type);
    // If we don't have balance yet, don't cap
    if (!bal) return '';

    const remaining = Number(bal.remaining) || 0;

    // If no remaining, force end to be start (cannot extend)
    if (remaining <= 0) return formData.startDate;

    const start = new Date(formData.startDate);
    const maxEnd = new Date(start);
    // remaining N days means maxEnd = start + (N-1) days
    maxEnd.setDate(start.getDate() + remaining - 1);
    return formatLocalYMD(maxEnd);
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
            <div className={`flex items-center ${currentStep >= 1 ? 'text-[#129990]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-[#129990] text-white' : 'bg-gray-200'
                }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Leave Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-[#129990]' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-[#129990]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-[#129990] text-white' : 'bg-gray-200'
                }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Reason & Attachments</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Step 1: Leave Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Leave Type *
                </label>
                {isLoadingLeaveTypes ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#129990]"></div>
                    <span className="ml-2 text-gray-500">Loading leave types...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getAvailableLeaveTypes().map((type: any) => {
                      const balance = getLeaveBalance(type.name);
                      const remaining = Number(balance?.remaining ?? 0);
                      const isSelected = formData.type === type.name;
                      const isDisabled = remaining === 0;

                      return (
                        <label
                          key={type.name}
                          className={`flex items-center p-3 rounded-lg transition-colors border-2 
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          style={{
                            borderColor: isSelected ? type.color : '#e5e7eb',
                            backgroundColor: isSelected ? `${type.color}20` : '#ffffff'
                          }}
                        >
                          <input
                            type="radio"
                            name="leaveType"
                            value={type.name}
                            checked={isSelected}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            disabled={isDisabled}
                            className="sr-only"
                          />
                          <div className="text-center w-full">
                            <p className="font-medium text-gray-900">{type.displayName}</p>
                            {balance && (
                              <p className="text-xs text-gray-500 mt-1">
                                {balance.remaining} left
                              </p>
                            )}
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <p className="text-xs text-gray-400">
                                {type.ispaidLeave ? 'Paid' : 'Unpaid'}
                              </p>
                              <span className="text-xs text-gray-300">•</span>
                              <p className="text-xs text-gray-400">
                                {type.leaveCount} days/year
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
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

              {/* Unavailable dates (from approved leaves) */}
              {disabledDates.length > 0 && (
                <div className="mt-4 p-3 rounded-lg border bg-gray-50">
                  <div className="text-sm font-semibold text-gray-800 mb-2">
                    Unavailable dates (already on approved leave)
                  </div>

                  {/* Render as compact chips for individual dates when there are just a few */}
                  {disabledRanges.length <= 6 ? (
                    <div className="flex flex-wrap gap-2">
                      {disabledRanges.map((r, i) => {
                        const same = r.start === r.end;
                        const label = same
                          ? new Date(r.start).toLocaleDateString()
                          : `${new Date(r.start).toLocaleDateString()} — ${new Date(r.end).toLocaleDateString()}`;
                        return (
                          <span key={i} className="px-2 py-1 text-xs bg-gray-200 rounded">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    // If many ranges, use a simple list
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {disabledRanges.map((r, i) => {
                        const same = r.start === r.end;
                        const label = same
                          ? new Date(r.start).toLocaleDateString()
                          : `${new Date(r.start).toLocaleDateString()} — ${new Date(r.end).toLocaleDateString()}`;
                        return <li key={i}>{label}</li>;
                      })}
                    </ul>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    You won’t be able to select these dates in the picker.
                  </p>
                </div>
              )}

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
                        const selectedDate = e.target.value;

                        // Block selection if date is in the disabled list
                        if (disabledDates.includes(selectedDate)) {
                          alert("This date is unavailable for leave.");
                          return; // Do not update state
                        }

                        handleInputChange("startDate", selectedDate);

                        if (formData.isHalfDay) {
                          handleInputChange("endDate", selectedDate);
                        }
                      }}
                      min={getMinDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {formData.type === 'medical' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Medical leave can be selected up to 2 weeks in the past
                    </p>
                  )}
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
                      onChange={(e) => {
                        const selectedDate = e.target.value;

                        // Block if disabled
                        if (disabledDates.includes(selectedDate)) {
                          alert("This date is unavailable for leave.");
                          return;
                        }

                        // Half-day: must equal start date
                        if (formData.isHalfDay) {
                          if (selectedDate !== formData.startDate) {
                            alert("Half day leave must start and end on the same date.");
                            return;
                          }
                          handleInputChange("endDate", selectedDate);
                          return;
                        }

                        // Enforce remaining-day cap for paid/allocated types
                        if (formData.type !== 'normal' && formData.startDate) {
                          const bal = getLeaveBalance(formData.type);
                          const remaining = Number(bal?.remaining ?? 0);

                          if (remaining > 0) {
                            const start = new Date(formData.startDate);
                            const end = new Date(selectedDate);
                            // inclusive day count
                            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                            if (diffDays > remaining) {
                              alert(`You can select up to ${remaining} day(s) from the start date based on your remaining balance.`);
                              return;
                            }
                          } else {
                            // no remaining: can't extend beyond start
                            if (selectedDate !== formData.startDate) {
                              alert("You have 0 days remaining for this leave type. Please select only the start date or choose Normal Leave.");
                              return;
                            }
                          }
                        }

                        handleInputChange("endDate", selectedDate);
                      }}
                      min={formData.startDate || getMinDate()}
                      // NEW: cap the range using max
                      max={getMaxEndDate()}
                      disabled={formData.isHalfDay}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.isHalfDay ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                className="flex-1 px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#129990] transition-colors"
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
                className="flex-1 px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#129990] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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