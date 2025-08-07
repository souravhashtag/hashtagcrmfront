import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  Edit3,
  Building,
  Badge,
  Mail,
  Phone,
  Crown,
  Shield,
  AlertCircle,
  Loader2,
  Eye,
  Plus,
  Minus
} from 'lucide-react';
import {
  useGetEmployeesQuery,
} from '../../../services/employeeServices';
import {
  useGetAssignedEmployeesQuery,
  useGetSupervisorsWithTeamCountsQuery,
  useAssignEmployeesMutation,
  useUnassignEmployeeMutation
} from '../../../services/assignmentServices';

interface Role {
  _id: string;
  name: string;
  display_name?: string;
  level: number;
  path: string;
  parent_id?: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: Role;
  department?: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  fullName: string;
}

interface Employee {
  _id: string;
  userId: User;
  employeeId: string;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TreeNode {
  employee: Employee;
  children: TreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
  assignedCount: number;
}

const EmployeeAssignView: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByRole, setFilterByRole] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showOnlyWithTeam, setShowOnlyWithTeam] = useState(false);

  // API Hooks
  const {
    data: employeesData,
    isLoading: isEmployeesLoading,
    error: employeesError,
    refetch: refetchEmployees
  } = useGetEmployeesQuery({
    page: 1,
    limit: 1000,
    search: ''
  });

  const {
    data: supervisorsData,
    isLoading: isSupervisorsLoading,
    refetch: refetchSupervisors
  } = useGetSupervisorsWithTeamCountsQuery({
    page: 1,
    limit: 1000
  });

  const [assignEmployees] = useAssignEmployeesMutation();
  const [unassignEmployee] = useUnassignEmployeeMutation();

  const employees = employeesData?.data || [];
  const supervisors = supervisorsData?.data || [];
  const isLoading = isEmployeesLoading || isSupervisorsLoading;
  console.log('Employees:', supervisors);
  // Build tree structure
  useEffect(() => {
    if (employees.length > 0 && supervisors.length > 0) {
      buildTreeStructure();
    }
  }, [employees, supervisors, showOnlyWithTeam]);

  const buildTreeStructure = async () => {
    try {
      // Create a map to store employee assignment relationships
      const employeeMap = new Map<string, TreeNode>();
      const supervisorCounts = new Map<string, number>();
      const assignmentMap = new Map<string, string[]>(); // supervisorId -> [subordinateIds]

      // Build supervisor counts map
      supervisors.forEach((sup: any) => {
        supervisorCounts.set(sup._id, sup.assignedCount || 0);
      });

      // Initialize all employees as tree nodes
      employees.forEach((employee: Employee) => {
        const assignedCount = supervisorCounts.get(employee._id) || 0;
        
        if (!showOnlyWithTeam || assignedCount > 0 || !supervisorCounts.has(employee._id)) {
          employeeMap.set(employee._id, {
            employee,
            children: [],
            isExpanded: expandedNodes.has(employee._id),
            isLoading: false,
            assignedCount
          });
        }
      });

      // Load assignment relationships for supervisors
      const assignmentPromises = Array.from(supervisorCounts.keys()).map(async (supervisorId) => {
        try {
          const response = await fetch(`/api/assignments/${supervisorId}/assigned?status=active`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const subordinateIds = data.data.map((assignment: any) => assignment.subordinate._id);
              assignmentMap.set(supervisorId, subordinateIds);
            }
          }
        } catch (error) {
          console.error(`Failed to load assignments for ${supervisorId}:`, error);
        }
      });

      await Promise.all(assignmentPromises);

      // Build the tree structure
      const rootNodes: TreeNode[] = [];
      const childNodes = new Set<string>();

      // First pass: identify all children
      assignmentMap.forEach((subordinateIds, supervisorId) => {
        subordinateIds.forEach(subordinateId => {
          childNodes.add(subordinateId);
        });
      });

      // Second pass: build tree structure
      employeeMap.forEach((node, employeeId) => {
        if (!childNodes.has(employeeId)) {
          // This employee is not a subordinate of anyone, so it's a root node
          rootNodes.push(node);
        }
      });

      // Third pass: populate children
      assignmentMap.forEach((subordinateIds, supervisorId) => {
        const supervisorNode = employeeMap.get(supervisorId);
        if (supervisorNode) {
          supervisorNode.children = subordinateIds
            .map(id => employeeMap.get(id))
            .filter(node => node !== undefined) as TreeNode[];
        }
      });

      // Sort root nodes by role level (lower levels first - higher in hierarchy)
      rootNodes.sort((a, b) => {
        if (a.employee.userId.role.level !== b.employee.userId.role.level) {
          return a.employee.userId.role.level - b.employee.userId.role.level;
        }
        
        const nameA = a.employee.userId.fullName || `${a.employee.userId.firstName || ''} ${a.employee.userId.lastName || ''}`.trim();
        const nameB = b.employee.userId.fullName || `${b.employee.userId.firstName || ''} ${b.employee.userId.lastName || ''}`.trim();
        
        return nameA.localeCompare(nameB);
      });

      setTreeData(rootNodes);
    } catch (error) {
      console.error('Failed to build tree structure:', error);
    }
  };

  const loadEmployeeSubordinates = async (employeeId: string) => {
    // Since we're now loading all assignments upfront, we just need to toggle the expanded state
    const node = findNodeInTree(treeData, employeeId);
    if (node && node.children.length > 0) {
      setTreeData(prevData => 
        updateNodeInTree(prevData, employeeId, { isExpanded: true })
      );
      
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(employeeId);
        return newSet;
      });
    }
  };

  const findNodeInTree = (nodes: TreeNode[], targetId: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.employee._id === targetId) {
        return node;
      }
      if (node.children.length > 0) {
        const found = findNodeInTree(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeInTree = (
    nodes: TreeNode[], 
    targetId: string, 
    updates: Partial<TreeNode>
  ): TreeNode[] => {
    return nodes.map(node => {
      if (node.employee._id === targetId) {
        return { ...node, ...updates };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, targetId, updates)
        };
      }
      return node;
    });
  };

  const toggleNode = async (employeeId: string) => {
    const isCurrentlyExpanded = expandedNodes.has(employeeId);
    
    if (isCurrentlyExpanded) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
      setTreeData(prevData => 
        updateNodeInTree(prevData, employeeId, { isExpanded: false })
      );
    } else {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(employeeId);
        return newSet;
      });
      setTreeData(prevData => 
        updateNodeInTree(prevData, employeeId, { isExpanded: true })
      );
    }
  };

  const handleRefresh = () => {
    refetchEmployees();
    refetchSupervisors();
    // Reset expanded state and rebuild tree
    setExpandedNodes(new Set());
    setTreeData([]);
  };

  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.filter(node => {
      const employee = node.employee;
      const fullName = employee.userId.fullName || `${employee.userId.firstName || ''} ${employee.userId.lastName || ''}`.trim();
      
      const matchesSearch = !searchTerm || 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.userId.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !filterByRole || 
        employee.userId.role.name.includes(filterByRole) ||
        (employee.userId.role.display_name && employee.userId.role.display_name.includes(filterByRole));

      return matchesSearch && matchesRole;
    }).map(node => ({
      ...node,
      children: filterTree(node.children)
    }));
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const { employee, children, isExpanded, isLoading, assignedCount } = node;
    const hasChildren = children.length > 0;
    const indent = level * 24;

    return (
      <div key={employee._id} className="select-none">
        {/* Main Node */}
        <div 
          className={`flex items-center py-3 px-4 hover:bg-gray-50 border-l-4 ${
            selectedEmployee === employee._id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-transparent'
          } ${hasChildren ? 'cursor-pointer' : ''}`}
          style={{ marginLeft: `${indent}px` }}
          onClick={() => hasChildren ? toggleNode(employee._id) : setSelectedEmployee(employee._id)}
        >
          {/* Tree Lines and Expand/Collapse Button */}
          <div className="w-8 h-6 flex items-center justify-center mr-2 relative">
            {/* Vertical line for non-root nodes */}
            {level > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
            )}
            {/* Horizontal line for non-root nodes */}
            {level > 0 && (
              <div className="absolute left-0 top-1/2 w-4 h-px bg-gray-300"></div>
            )}
            
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(employee._id);
                }}
                className="p-1 hover:bg-gray-200 rounded bg-white border border-gray-300 z-10"
                disabled={isLoading}
                title={isExpanded ? 'Collapse team' : 'Expand team'}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                ) : isExpanded ? (
                  <Minus className="h-3 w-3 text-gray-600" />
                ) : (
                  <Plus className="h-3 w-3 text-gray-600" />
                )}
              </button>
            ) : level > 0 ? (
              <div className="w-3 h-3 bg-white border border-gray-300 rounded-full z-10"></div>
            ) : null}
          </div>

          {/* Profile Picture */}
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
            {employee.userId.profilePicture ? (
              <img 
                src={employee.userId.profilePicture} 
                alt={employee.userId.fullName || `${employee.userId.firstName || ''} ${employee.userId.lastName || ''}`.trim()}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">
                {employee.userId.fullName || `${employee.userId.firstName || ''} ${employee.userId.lastName || ''}`.trim()}
              </h3>
              
              {/* Role Level Badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                employee.userId.role.level === 0 
                  ? 'bg-purple-100 text-purple-800' 
                  : employee.userId.role.level === 1
                  ? 'bg-blue-100 text-blue-800'
                  : employee.userId.role.level === 2
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.userId.role.level === 0 && <Crown className="w-3 h-3 mr-1" />}
                {employee.userId.role.level === 1 && <Shield className="w-3 h-3 mr-1" />}
                L{employee.userId.role.level}
              </span>

              {/* Team Count Badge */}
              {hasChildren && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <Users className="w-3 h-3 mr-1" />
                  {children.length} direct reports
                </span>
              )}

              {/* Status Indicator */}
              {hasChildren && (
                <span className="text-xs text-blue-600 font-medium">
                  Supervisor
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Badge className="h-3 w-3" />
                {employee.employeeId}
              </span>
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {employee.userId.role.display_name || employee.userId.role.name}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {employee.userId.email}
              </span>
            </div>
          </div>
        </div>

        {/* Children with proper tree lines */}
        {isExpanded && children.length > 0 && (
          <div className="relative">
            {/* Vertical line connecting children */}
            <div 
              className="absolute bg-gray-300 w-px"
              style={{ 
                left: `${indent + 16}px`, 
                top: '0px', 
                height: `${children.length * 70}px` 
              }}
            ></div>
            {children.map((child, index) => (
              <div key={child.employee._id}>
                {renderTreeNode(child, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredTreeData = filterTree(treeData);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizational structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Assignment Tree</h1>
              <p className="text-gray-600 mt-1">Organizational hierarchy and team assignments</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by role..."
                  value={filterByRole}
                  onChange={(e) => setFilterByRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Show only with team */}
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyWithTeam}
                    onChange={(e) => setShowOnlyWithTeam(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Only show supervisors</span>
                </label>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-end gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {filteredTreeData.length} employees
                </span>
                <span className="flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  {supervisors.length} supervisors
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tree Structure */}
        <div className="bg-white rounded-lg shadow">
          {employeesError ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load employees. Please try again.</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredTreeData.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterByRole 
                  ? 'No employees found matching your filters' 
                  : 'No employees found'
                }
              </p>
              {(searchTerm || filterByRole) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterByRole('');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTreeData.map(node => renderTreeNode(node))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Crown className="w-3 h-3 mr-1" />
                L0
              </span>
              <span className="text-gray-600">Executive Level</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Shield className="w-3 h-3 mr-1" />
                L1
              </span>
              <span className="text-gray-600">Management Level</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <Users className="w-3 h-3 mr-1" />
                5
              </span>
              <span className="text-gray-600">Team Members</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Expandable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAssignView;