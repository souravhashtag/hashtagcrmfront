import React, { useState, useEffect } from 'react';
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useMoveRoleMutation,
} from '../../../services/roleServices';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Eye,
  Move,
  Filter,
  RotateCcw,
  X,
  ChevronDown,
  ChevronRight,
  TreePine
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Role {
  _id: string;
  name: string;
  display_name?: string;
  description?: string;
  parent_id?: string;
  level?: number;
  menulist: any[];
  children?: Role[];
  createdAt: string;
  updatedAt: string;
}

interface RoleTreeNodeProps {
  role: Role;
  level: number;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onMove: (role: Role) => void;
  onView: (role: Role) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (roleId: string) => void;
  allRoles: Role[];
}

const RoleTreeNode: React.FC<RoleTreeNodeProps> = ({
  role,
  level,
  onEdit,
  onDelete,
  onMove,
  onView,
  expandedNodes,
  onToggleExpand,
  allRoles
}) => {
  const hasChildren = role.children && role.children.length > 0;
  const isExpanded = expandedNodes.has(role._id);
  const indentationStep = 24;
  const baseIndent = 12;
  const totalIndent = baseIndent + (level * indentationStep);

  const levelColors = {
    0: { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    1: { bg: 'bg-green-100', text: 'text-green-600', badge: 'bg-green-50 text-green-700' },
    2: { bg: 'bg-yellow-100', text: 'text-yellow-600', badge: 'bg-yellow-50 text-yellow-700' },
    default: { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' }
  };

  const colorScheme = levelColors[(role.level || 0) as keyof typeof levelColors] || levelColors.default;

  return (
    <div className="relative">
      {/* Tree lines */}
      {level > 0 && (
        <>
          {/* Vertical line connecting to parent */}
          <div 
            className="absolute border-l-2 border-gray-200"
            style={{
              left: `${baseIndent + ((level - 1) * indentationStep) + 12}px`,
              top: '-12px',
              height: '24px',
              width: '1px'
            }}
          />
          {/* Horizontal line to node */}
          <div 
            className="absolute border-t-2 border-gray-200"
            style={{
              left: `${baseIndent + ((level - 1) * indentationStep) + 12}px`,
              top: '12px',
              width: `${indentationStep - 12}px`,
              height: '1px'
            }}
          />
        </>
      )}

      <div 
        className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 relative z-10 group"
        style={{ marginLeft: `${totalIndent}px` }}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Expand/Collapse Button */}
          <div className="w-6 h-6 flex items-center justify-center">
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(role._id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
            )}
          </div>
          
          {/* Role Icon and Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-3 rounded-lg ${colorScheme.bg}`}>
              <Users size={20} className={colorScheme.text} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {role.display_name || role.name}
                </h3>
                <span className={`px-3 py-1 text-sm rounded-full ${colorScheme.badge} whitespace-nowrap`}>
                  Level {role.level || 0}
                </span>
                <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                  Active
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 flex-wrap">
                <span className="font-mono text-xs bg-gray-100 px-3 py-1 rounded">
                  {role.name}
                </span>
                {hasChildren && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">
                      {role.children?.length} child{role.children?.length !== 1 ? 'ren' : ''}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="text-gray-600">
                  {role.menulist?.length || 0} menu{(role.menulist?.length || 0) !== 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span className="text-gray-400">
                  Created {new Date(role.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {role.description && (
                <p className="text-sm text-gray-600 mt-2 truncate max-w-2xl">
                  {role.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(role)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Role Details"
          >
            <Eye size={16} />
          </button>
          
          <button
            onClick={() => onMove(role)}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Move Role"
          >
            <Move size={16} />
          </button>
          
          <button
            onClick={() => onEdit(role)}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit Role"
          >
            <Edit size={16} />
          </button>
          
          <button
            onClick={() => onDelete(role)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Role"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line for children */}
          {role.children && role.children.length > 1 && (
            <div 
              className="absolute border-l-2 border-gray-200"
              style={{
                left: `${totalIndent + 12}px`,
                top: '0px',
                height: `${(role.children.length - 1) * 80}px`,
                width: '1px'
              }}
            />
          )}
          {role.children?.map((child, index) => (
            <RoleTreeNode
              key={child._id}
              role={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onView={onView}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              allRoles={allRoles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MoveRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  allRoles: Role[];
  onMove: (roleId: string, newParentId: string | null) => void;
}

const MoveRoleModal: React.FC<MoveRoleModalProps> = ({
  isOpen,
  onClose,
  role,
  allRoles,
  onMove
}) => {
  const [newParentId, setNewParentId] = useState<string>('');

  React.useEffect(() => {
    if (role) {
      setNewParentId(role.parent_id || '');
    }
  }, [role]);

  if (!isOpen || !role) return null;

  // Filter out current role and its descendants to prevent circular references
  const getValidParentRoles = () => {
    const findDescendants = (parentId: string, visited = new Set<string>()): Set<string> => {
      if (visited.has(parentId)) return visited;
      visited.add(parentId);
      
      allRoles.forEach((r: Role) => {
        if (r.parent_id === parentId && !visited.has(r._id)) {
          findDescendants(r._id, visited);
        }
      });
      
      return visited;
    };

    const invalidIds = findDescendants(role._id);
    return allRoles.filter(r => !invalidIds.has(r._id));
  };

  const validRoles = getValidParentRoles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMove(role._id, newParentId || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Move Role
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            <span className="font-medium text-blue-900">
              {role.display_name || role.name}
            </span>
          </div>
          <div className="text-sm text-blue-700 mt-1">
            Current: {role.parent_id ? 
              allRoles.find((r: Role) => r._id === role.parent_id)?.display_name || 'Unknown' : 
              'Root Level'
            } (Level {role.level || 0})
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Parent Role
            </label>
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Root Level (No Parent)</option>
              {validRoles.map((r) => (
                <option key={r._id} value={r._id}>
                  {'  '.repeat(r.level || 0)} {r.display_name || r.name} (Level {r.level || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Move Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RoleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            Role Details: {role.display_name || role.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{role.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{role.display_name || 'N/A'}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{role.description || 'No description'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Menu Count</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{role.menulist?.length || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Role</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {role.parent_id ? 'Has Parent' : 'Root Level'}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu Permissions</label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
              {role.menulist && role.menulist.length > 0 ? (
                <div className="p-2 space-y-1">
                  {role.menulist.map((menu, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                      <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                      <span className="flex-1">{menu.name}</span>
                      <span className="text-gray-400 text-xs">({menu.slug})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 p-4 text-center">No menu permissions assigned</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t">
            <div>
              <label className="block font-medium text-gray-600 mb-1">Created</label>
              <p>{new Date(role.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="block font-medium text-gray-600 mb-1">Updated</label>
              <p>{new Date(role.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Fetch all roles
  const { data: rolesResponse, isLoading, refetch } = useGetRolesQuery({
    page: 1,
    limit: 1000, // Get all roles
    search: searchTerm,
  });

  const [deleteRole] = useDeleteRoleMutation();
  const [moveRole] = useMoveRoleMutation();

  const roles: Role[] = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.data || []);

  // Set all nodes as expanded by default when roles change
  useEffect(() => {
    const allIds = new Set<string>();
    const collectIds = (roles: Role[]) => {
      roles.forEach((role: Role) => {
        allIds.add(role._id);
        if (role.children) {
          collectIds(role.children);
        }
      });
    };
    collectIds(roles);
    setExpandedNodes(allIds);
  }, [roles]);

  // Build complete tree structure from flat roles array with level calculation
  const buildRoleTree = (rolesList: Role[]): Role[] => {
    const roleMap = new Map<string, Role>();
    const rootRoles: Role[] = [];

    // First pass: Calculate levels for each role
    const calculateLevel = (role: Role, visited = new Set<string>()): number => {
      if (visited.has(role._id)) return 0; // Prevent infinite loops
      visited.add(role._id);
      
      if (!role.parent_id) return 0;
      
      const parent = rolesList.find(r => r._id === role.parent_id);
      if (!parent) return 0;
      
      return calculateLevel(parent, visited) + 1;
    };

    // Create role map with calculated levels
    rolesList.forEach((role: Role) => {
      const level = calculateLevel(role);
      roleMap.set(role._id, { 
        ...role, 
        children: [],
        level: level
      });
    });

    // Second pass: Build parent-child relationships
    rolesList.forEach((role: Role) => {
      const roleWithChildren = roleMap.get(role._id);
      
      if (role.parent_id && roleMap.has(role.parent_id)) {
        // This role has a parent - add it to parent's children
        const parent = roleMap.get(role.parent_id);
        if (parent && roleWithChildren) {
          parent.children?.push(roleWithChildren);
        }
      } else {
        // This is a root level role
        if (roleWithChildren) {
          rootRoles.push(roleWithChildren);
        }
      }
    });

    // Sort root roles and recursively sort children
    const sortRoles = (roles: Role[]): Role[] => {
      return roles.sort((a, b) => a.name.localeCompare(b.name)).map(role => ({
        ...role,
        children: role.children ? sortRoles(role.children) : []
      }));
    };

    return sortRoles(rootRoles);
  };

  // Filter roles based on search
  const filteredRoles = roles.filter((role: Role) => {
    const matchesSearch = !searchTerm || 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.display_name && role.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const treeRoles = buildRoleTree(filteredRoles);

  const handleSearch = () => {
    refetch();
  };

  const handleDelete = async (role: Role) => {
    const hasChildren = role.children && role.children.length > 0;
    const message = hasChildren 
      ? `Are you sure you want to delete "${role.display_name || role.name}" and all its ${role.children?.length} child roles?`
      : `Are you sure you want to delete "${role.display_name || role.name}"?`;
    
    if (window.confirm(message)) {
      try {
        await deleteRole({ 
          id: role._id, 
          force: hasChildren 
        }).unwrap();
        refetch();
      } catch (error) {
        console.error('Error deleting role:', error);
        alert('Error deleting role. Please try again.');
      }
    }
  };

  const handleMove = async (roleId: string, newParentId: string | null) => {
    try {
      await moveRole({
        id: roleId,
        new_parent_id: newParentId
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Error moving role:', error);
      alert('Error moving role. Please try again.');
    }
  };

  const toggleExpand = (roleId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    
    const collectIds = (roles: Role[]) => {
      roles.forEach((role: Role) => {
        allIds.add(role._id);
        if (role.children) {
          collectIds(role.children);
        }
      });
    };
    
    collectIds(treeRoles);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Loading roles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TreePine className="text-blue-600" />
                Role Hierarchy
              </h1>
              <p className="text-gray-600 mt-2">
                Manage roles and their hierarchical relationships
              </p>
            </div>
            <button
              onClick={() => navigate('/role/create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Create Role
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Search"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Tree Controls */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Collapse All
              </button>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
                title="Refresh"
              >
                <RotateCcw size={14} />
                Refresh
              </button>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    refetch();
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tree Structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {treeRoles.length > 0 ? (
            <div className="p-6">
              <div className="space-y-2">
                {treeRoles.map((role) => (
                  <RoleTreeNode
                    key={role._id}
                    role={role}
                    level={0}
                    onEdit={(role) => navigate(`/role/edit/${role._id}`)}
                    onDelete={handleDelete}
                    onMove={(role) => {
                      setSelectedRole(role);
                      setShowMoveModal(true);
                    }}
                    onView={(role) => {
                      setSelectedRole(role);
                      setShowDetailsModal(true);
                    }}
                    expandedNodes={expandedNodes}
                    onToggleExpand={toggleExpand}
                    allRoles={roles}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <TreePine size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No roles found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'No roles match your search criteria. Try adjusting your search term.' 
                  : 'Get started by creating your first role to build your organizational hierarchy.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/role/create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Plus size={20} />
                  Create First Role
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    refetch();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Move Role Modal */}
      <MoveRoleModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        role={selectedRole}
        allRoles={roles}
        onMove={handleMove}
      />

      {/* Role Details Modal */}
      <RoleDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        role={selectedRole}
      />
    </div>
  );
};

export default RoleList;