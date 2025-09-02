import React, { useState, useEffect } from "react";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeByIdQuery,
} from "../../../services/employeeServices";
import { useListDeductionRulesQuery } from "../../../services/salaryDeductionRuleServices";
import { useGetRolesQuery } from "../../../services/roleServices";
import { useGetDepartmentsQuery } from "../../../services/depertmentServices";
import { useGetDesignationsQuery } from "../../../services/designationServices";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  Building,
  DollarSign,
  FileText,
  Shield,
  MapPin,
  Upload,
  X,
  Plus,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { constants } from "buffer";

interface FormData {
  // User fields
  userId: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  roleId: string;
  departmentId: string;
  position: string;
  isrotationroster: boolean;
  status: "active" | "inactive" | "suspended" | "pending";
  deduction: [string];

  // Employee specific fields
  employeeId: string;
  joiningDate: string;
  dob: string;

  // Emergency contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;

  // Salary information
  salaryAmount: string;
  salaryCurrency: string;
  paymentFrequency: "monthly" | "bi-weekly" | "weekly";

  // Tax information
  taxId: string;
  taxBracket: string;

  // Bank details
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
}

interface Document {
  type: "id" | "contract" | "certificate" | "other";
  name: string;
  file: File | null;
}

const EmployeeCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Queries and mutations
  const { data: employeeData, isLoading: isLoadingEmployee } =
    useGetEmployeeByIdQuery(id!, {
      skip: !isEditMode,
    });
  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] =
    useUpdateEmployeeMutation();
  const {
    data: deductionList,
    isLoading: deductionLoading,
    isFetching,
    refetch,
  } = useListDeductionRulesQuery();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // console.log("deductionList", deductionList);
  // Fetch roles and departments from API
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useGetRolesQuery({ page: 1, limit: 100, search: "" });

  const {
    data: departmentsData,
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useGetDepartmentsQuery({ page: 1, limit: 100, search: "" });

  const [formData, setFormData] = useState<FormData>({
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    password: "",
    isrotationroster: false,
    confirmPassword: "",
    phone: "",
    roleId: "",
    deduction: [""],
    departmentId: "",
    position: "",
    status: "active",
    employeeId: "",
    joiningDate: "",
    dob: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    salaryAmount: "",
    salaryCurrency: "INR",
    paymentFrequency: "monthly",
    taxId: "",
    taxBracket: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    accountHolderName: "",
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<
    "personal" | "employment" | "financial" | "documents"
  >("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(!isEditMode);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Extract data from API responses
  const roles = rolesData?.data || [];
  const departments = departmentsData?.data || [];

  // Populate form when employee data loads (edit mode)
  useEffect(() => {
    if (isEditMode && employeeData?.data) {
      const emp = employeeData.data;
      const user = emp.userId;

      const initialData: FormData = {
        userId: user?._id || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        gender: user?.gender || "",
        password: "", // Don't populate password in edit mode
        isrotationroster: emp?.issetrosterauto || false,
        confirmPassword: "",
        phone: user?.phone || "",
        roleId: user?.role?._id || user?.role || "",
        departmentId: user?.department?._id || user?.department || "",
        position: user?.position || "",
        status: user?.status || "active",
        employeeId: emp.employeeId || "",
        deduction: emp?.deductionDetails || [""],
        joiningDate: emp.joiningDate
          ? new Date(emp.joiningDate).toISOString().split("T")[0]
          : "",
        dob: emp.dob ? new Date(emp.dob).toISOString().split("T")[0] : "",
        emergencyContactName: emp.emergencyContact?.name || "",
        emergencyContactRelationship: emp.emergencyContact?.relationship || "",
        emergencyContactPhone: emp.emergencyContact?.phone || "",
        salaryAmount: emp.salary?.amount?.toString() || "",
        salaryCurrency: emp.salary?.currency || "INR",
        paymentFrequency: emp.salary?.paymentFrequency || "monthly",
        taxId: emp.taxInformation?.taxId || "",
        taxBracket: emp.taxInformation?.taxBracket || "",
        accountNumber: emp.bankDetails?.accountNumber || "",
        bankName: emp.bankDetails?.bankName || "",
        ifscCode: emp.bankDetails?.ifscCode || "",
        accountHolderName: emp.bankDetails?.accountHolderName || "",
      };

      setFormData(initialData);
      setOriginalData(initialData);

      // Set existing documents
      if (emp.documents) {
        setDocuments(
          emp.documents.map((doc: any) => ({
            type: doc.type,
            name: doc.name,
            file: null, // Can't populate file objects from server
          }))
        );
      }
    }
  }, [employeeData, isEditMode]);

  // Generate employee ID for create mode
  // useEffect(() => {
  //   if (!isEditMode) {
  //     const generateEmployeeId = () => {
  //       const prefix = 'HBEC';
  //       const timestamp = Date.now().toString().slice(-6);
  //       return `${prefix}`;
  //     };

  //     setFormData(prev => ({
  //       ...prev,
  //       employeeId: generateEmployeeId()
  //     }));
  //   }
  // }, [isEditMode]);

  // Check for changes (only in edit mode)
  useEffect(() => {
    if (isEditMode && originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // console.log(`Input changed: ${name} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const addDocument = () => {
    setDocuments((prev) => [...prev, { type: "other", name: "", file: null }]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: keyof Document, value: any) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  const handleFileChange = (index: number, file: File | null) => {
    updateDocument(index, "file", file);
    if (file) {
      updateDocument(index, "name", file.name);
    }
    setHasChanges(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";

    if (!isEditMode) {
      if (!formData.password.trim())
        newErrors.password = "Password is required";
      if (!formData.confirmPassword.trim())
        newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password || formData.confirmPassword) {
      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      }
    }
    if (isEditMode) {
      if (!formData.employeeId || !formData.employeeId.trim()) {
        newErrors.employeeId = "Employee ID is required";
      } else {
        // Only validate format if Employee ID is provided
        const employeeIdRegex = /^[A-Z]{3}\d{3}$/;
        if (!employeeIdRegex.test(formData.employeeId.trim())) {
          newErrors.employeeId =
            "Employee ID must be in format HBS123 (3 letters followed by 3 numbers)";
        }
      }
    }
    if (!formData.joiningDate)
      newErrors.joiningDate = "Joining date is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.roleId) newErrors.roleId = "Role is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password strength validation
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }
    }

    // Confirm password validation
    if (
      formData.password !== "" &&
      formData.confirmPassword !== "" &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Date validation
    if (formData.dob && formData.joiningDate) {
      const dobDate = new Date(formData.dob);
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();

      if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }

      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 16) {
        newErrors.dob = "Employee must be at least 16 years old";
      }

      if (joiningDate > today) {
        newErrors.joiningDate = "Joining date cannot be in the future";
      }
    }

    // Salary validation
    if (formData.salaryAmount && isNaN(Number(formData.salaryAmount))) {
      newErrors.salaryAmount = "Please enter a valid salary amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    if (isEditMode && !hasChanges) {
      navigate("/employee");
      return;
    }

    try {
      // Filter documents that have files
      const documentsWithFiles = documents.filter((doc) => doc.file);

      const employeeData: any = {
        employeeId: formData.employeeId,
        joiningDate: formData.joiningDate,
        dob: formData.dob,

        emergencyContact: formData.emergencyContactName
          ? {
              name: formData.emergencyContactName,
              relationship: formData.emergencyContactRelationship,
              phone: formData.emergencyContactPhone,
            }
          : undefined,

        salary: formData.salaryAmount
          ? {
              amount: Number(formData.salaryAmount),
              currency: formData.salaryCurrency,
              paymentFrequency: formData.paymentFrequency,
            }
          : undefined,

        taxInformation:
          formData.taxId || formData.taxBracket
            ? {
                taxId: formData.taxId,
                taxBracket: formData.taxBracket,
              }
            : undefined,

        bankDetails: formData.accountNumber
          ? {
              accountNumber: formData.accountNumber,
              bankName: formData.bankName,
              ifscCode: formData.ifscCode,
              accountHolderName: formData.accountHolderName,
            }
          : undefined,

        // Only include documents metadata if there are files to upload
        documents: documentsWithFiles.map((doc) => ({
          type: doc.type,
          name: doc.name,
        })),
      };

      // Add user data for create mode or update
      const userData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        roleId: formData.roleId,
        departmentId: formData.departmentId,
        position: formData.position,
        status: formData.status,
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("employeeDatast", JSON.stringify(employeeData));
      formDataToSend.append("userDatast", JSON.stringify(userData));

      // Add document files in the same order as metadata
      documentsWithFiles.forEach((doc: any, index) => {
        formDataToSend.append("documents[]", doc.file);
      });

      if (isEditMode) {
        const update = await updateEmployee({
          id: id!,
          data: formDataToSend,
        }).unwrap();

        navigate("/employee", {
          state: { message: "Employee updated successfully!" },
        });
      } else {
        await createEmployee(formDataToSend).unwrap();
        navigate("/employee", {
          state: { message: "Employee created successfully!" },
        });
      }
    } catch (error: any) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} employee:`,
        error
      );

      if (error?.data?.message) {
        alert(error.data.message);
      } else {
        alert(
          `Failed to ${
            isEditMode ? "update" : "create"
          } employee. Please try again.`
        );
      }
    }
  };

  const handleCancel = () => {
    const shouldConfirm = isEditMode
      ? hasChanges
      : Object.values(formData).some(
          (value) => typeof value === "string" && value.trim() !== ""
        );

    if (shouldConfirm) {
      if (
        window.confirm(
          "Are you sure you want to cancel? All unsaved changes will be lost."
        )
      ) {
        navigate("/employee");
      }
    } else {
      navigate("/employee");
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      if (isEditMode && originalData) {
        setFormData(originalData);
      } else {
        setFormData({
          userId: "",
          firstName: "",
          lastName: "",
          email: "",
          gender: "",
          password: "",
          isrotationroster: false,
          deduction: [""],
          confirmPassword: "",
          phone: "",
          roleId: "",
          departmentId: "",
          position: "",
          status: "active",
          employeeId: formData.employeeId, // Keep generated ID
          joiningDate: "",
          dob: "",
          emergencyContactName: "",
          emergencyContactRelationship: "",
          emergencyContactPhone: "",
          salaryAmount: "",
          salaryCurrency: "INR",
          paymentFrequency: "monthly",
          taxId: "",
          taxBracket: "",
          accountNumber: "",
          bankName: "",
          ifscCode: "",
          accountHolderName: "",
        });
        setDocuments([]);
      }
      setErrors({});
    }
  };
  const { data: designationData } = useGetDesignationsQuery({
    search: "",
    department: "",
    status: "",
    page: 1,
    limit: 100,
  });
  const [getDesignation, setDesignation] = useState([]);
  const GetDesignation = (departmentId: any) => {
    // console.log(departmentId)

    //console.log("designationData===>",designationData)
    const filterData = designationData?.data?.filter(
      (val: any) => val?.department?._id === departmentId
    );
    console.log("designationData===>", filterData);
    setDesignation(filterData);
  };
  // Loading state for edit mode
  if (isEditMode && isLoadingEmployee) {
    return (
      <div className="mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading employee...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (isEditMode && !employeeData?.data) {
    return (
      <div className="mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Employee not found</p>
          <button
            onClick={() => navigate("/employee")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  const isLoading = isCreating || isUpdating;

  const tabs = [
    { key: "personal", label: "Personal Info", icon: User },
    { key: "employment", label: "Employment", icon: Building },
    { key: "financial", label: "Financial", icon: DollarSign },
    { key: "documents", label: "Documents", icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  name="gender"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
                {isEditMode && (
                  <span className="text-sm text-gray-500 font-normal">
                    (Leave blank to keep current password)
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!isEditMode && "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={
                        isEditMode
                          ? "Enter new password (optional)"
                          : "Enter password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters with uppercase,
                    lowercase, and number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password {!isEditMode && "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={
                        isEditMode ? "Confirm new password" : "Confirm password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dob ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.dob && (
                  <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "employment":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.employeeId ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter employee ID"
                  />
                  {errors.employeeId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.employeeId}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joining Date *
                </label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.joiningDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.joiningDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.joiningDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                {rolesLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">Loading roles...</span>
                    </div>
                  </div>
                ) : rolesError ? (
                  <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50">
                    <span className="text-red-600 text-sm">
                      Error loading roles
                    </span>
                  </div>
                ) : (
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.roleId ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role: any) => (
                      <option key={role._id} value={role._id}>
                        {role.display_name || role.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.roleId && (
                  <p className="text-red-500 text-xs mt-1">{errors.roleId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                {departmentsLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">
                        Loading departments...
                      </span>
                    </div>
                  </div>
                ) : departmentsError ? (
                  <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50">
                    <span className="text-red-600 text-sm">
                      Error loading departments
                    </span>
                  </div>
                ) : (
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => {
                      handleInputChange(e);
                      GetDesignation(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept: any) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a department</option>
                  {getDesignation?.length > 0 &&
                    getDesignation.map((des: any) => (
                      <option key={des.title} value={des.title}>
                        {des.title}
                      </option>
                    ))}
                </select>                
              </div>
              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Is the rotation roster?
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>                
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            {/* Salary Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Salary Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Amount
                  </label>
                  <input
                    type="number"
                    name="salaryAmount"
                    value={formData.salaryAmount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.salaryAmount ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter amount"
                  />
                  {errors.salaryAmount && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.salaryAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="salaryCurrency"
                    value={formData.salaryCurrency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Frequency
                  </label>
                  <select
                    name="paymentFrequency"
                    value={formData.paymentFrequency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* {console.log("formData===>",formData)}} */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Didaction Applicable
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select if deduction is applicable
                  </label>
                  
                  {!deductionLoading && deductionList?.data?.map((item: any) => (
                    <div key={item._id} className="flex items-center mb-6">
                      <input
                        type="checkbox"
                        name="deduction"
                        value={item.code}
                        checked={formData?.deduction?.includes(item.code)}
                        onChange={(e) => {
                          const value = e.target.value;
                          let newdeduction = [...(formData.deduction || [])];
                          if (newdeduction.includes(value)) {
                            newdeduction = newdeduction.filter(
                              (d) => d !== value
                            );
                          } else {
                            newdeduction.push(value);
                          }
                          setFormData((prev: any) => ({
                            ...prev,
                            deduction: newdeduction,
                          }));
                          setHasChanges(true);
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tax Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tax ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Bracket
                    </label>
                    <input
                      type="text"
                      name="taxBracket"
                      value={formData.taxBracket}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tax bracket"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter IFSC code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter account holder name"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Documents
              </h3>
              <button
                type="button"
                onClick={addDocument}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Add Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents added yet</p>
                <p className="text-gray-400 text-sm">
                  Click "Add Document" to upload employee documents
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Document {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Document Type
                        </label>
                        <select
                          value={doc.type}
                          onChange={(e) =>
                            updateDocument(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="id">ID Document</option>
                          <option value="contract">Contract</option>
                          <option value="certificate">Certificate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Document Name
                        </label>
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) =>
                            updateDocument(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter document name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            onChange={(e) =>
                              handleFileChange(
                                index,
                                e.target.files?.[0] || null
                              )
                            }
                            className="flex-1"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          {doc.file && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Upload size={16} />
                              <span className="text-sm">{doc.file.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto bg-white shadow-lg rounded-lg">
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
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Update Employee" : "Add New Employee"}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode
                  ? `Editing: ${formData.firstName} ${formData.lastName} (${formData.employeeId})`
                  : "Fill in the employee information below"}
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {renderTabContent()}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>

            {(isEditMode
              ? hasChanges
              : Object.values(formData).some(
                  (value) =>
                    typeof value === "string" &&
                    value.trim() !== "" &&
                    value !== "active" &&
                    value !== "INR" &&
                    value !== "monthly"
                )) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition"
              >
                {isEditMode ? "Reset Changes" : "Clear Form"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== "documents" && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    (tab) => tab.key === activeTab
                  );
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].key as any);
                  }
                }}
                className="px-4 py-2 text-white rounded-lg hover:bg-[#00d9b0] transition bg-[#00bebb]"
              >
                Next
              </button>
            )}
            {activeTab === "documents" ? (
              <button
                type="submit"
                disabled={isLoading || (isEditMode && !hasChanges)}
                className="flex items-center gap-2 px-6 py-2  bg-[#284084] text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save size={16} />{" "}
                    {isEditMode
                      ? hasChanges
                        ? "Update Employee"
                        : "No Changes"
                      : "Create Employee"}
                  </>
                )}
              </button>
            ) : (
              ""
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreate;
