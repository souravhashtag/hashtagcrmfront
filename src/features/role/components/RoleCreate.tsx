import React, { useEffect, useState } from 'react';
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRoleByIdQuery,
  useGetRolesQuery,
} from '../../../services/roleServices';
import {  
  useGetMenusQuery
} from '../../../services/menuServices';
import {  
  Save,
  Plus,
  XCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Menu,
  Folder,
  FolderOpen,
  Check,
  Minus,
  Users,
  TreePine,
  AlertCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface MenuListItem {
  name: string;
  slug: string;
  icon: string;
  menuId: string;
  selectedParentPath?: string; 
}

interface RoleForm {
  name: string;
  display_name: string;
  description: string;
  parent_id: string;
  menulist: MenuListItem[];
}

interface SimpleMenuSelectorProps {
  menus: any[];
  selectedMenus: MenuListItem[];
  onMenuToggle: (menu: any, isSelected: boolean) => void;
  onParentPathChange: (menuId: string, parentPath: string) => void;
}

interface RoleHierarchySelectorProps {
  roles: any[];
  selectedParentId: string;
  onParentChange: (parentId: string) => void;
  currentRoleId?: string;
  disabled?: boolean;
}

const RoleHierarchySelector: React.FC<RoleHierarchySelectorProps> = ({
  roles,
  selectedParentId,
  onParentChange,
  currentRoleId,
  disabled = false
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchy tree from flat roles array
  const buildRoleHierarchy = (rolesList: any[]) => {
    const roleMap = new Map();
    const rootRoles: any[] = [];

    // Create role map
    rolesList.forEach(role => {
      roleMap.set(role._id, { ...role, children: [] });
    });

    // Build hierarchy
    rolesList.forEach(role => {
      if (role.parent_id && roleMap.has(role.parent_id)) {
        const parent = roleMap.get(role.parent_id);
        parent.children.push(roleMap.get(role._id));
      } else {
        rootRoles.push(roleMap.get(role._id));
      }
    });

    return rootRoles.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter out current role and its descendants to prevent circular references
  const getValidParentRoles = (rolesList: any[]) => {
    if (!currentRoleId) return rolesList;
    
    const findDescendants = (parentId: string, visited = new Set<string>()): Set<string> => {
      if (visited.has(parentId)) return visited;
      visited.add(parentId);
      
      rolesList.forEach(role => {
        if (role.parent_id === parentId && !visited.has(role._id)) {
          findDescendants(role._id, visited);
        }
      });
      
      return visited;
    };

    const invalidIds = findDescendants(currentRoleId);
    return rolesList.filter(role => !invalidIds.has(role._id));
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderRoleNode = (role: any, level: number = 0): React.ReactElement => {
    const hasChildren = role.children && role.children.length > 0;
    const isExpanded = expandedNodes.has(role._id);
    const isSelected = selectedParentId === role._id;
    const isCurrentRole = currentRoleId === role._id;
    const indentation = level * 20;

    return (
      <div key={role._id}>
        <div 
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
          } ${isCurrentRole ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ paddingLeft: `${indentation + 8}px` }}
          onClick={() => !isCurrentRole && !disabled && onParentChange(role._id)}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(role._id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              disabled={disabled}
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-600" />
              ) : (
                <ChevronRight size={16} className="text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <input
            type="radio"
            name="parent_role"
            value={role._id}
            checked={isSelected}
            onChange={() => !isCurrentRole && !disabled && onParentChange(role._id)}
            disabled={isCurrentRole || disabled}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          
          <div className="flex items-center gap-2 flex-1">
            <Users size={16} className={`${isCurrentRole ? 'text-gray-400' : 'text-gray-600'}`} />
            <div>
              <span className={`text-sm font-medium ${
                isCurrentRole ? 'text-gray-400' : isSelected ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {role.display_name || role.name}
                {isCurrentRole && ' (Current Role)'}
              </span>
              <div className="text-xs text-gray-500">
                Level {role.level || 0} • {role.name}
              </div>
            </div>
          </div>
          
          {hasChildren && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {role.children.length} child{role.children.length !== 1 ? 'ren' : ''}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {role.children.map((child: any) => renderRoleNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const validRoles = getValidParentRoles(roles);
  const hierarchy = buildRoleHierarchy(validRoles);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <TreePine size={16} />
          Select Parent Role
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Choose a parent role to create a hierarchy. Leave unselected for root-level role.
        </p>
      </div>
      
      {/* No Parent Option */}
      <div className="mb-3 p-2 border-b border-gray-100">
        <div 
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            !selectedParentId ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
          }`}
          onClick={() => !disabled && onParentChange('')}
        >
          <input
            type="radio"
            name="parent_role"
            value=""
            checked={!selectedParentId}
            onChange={() => !disabled && onParentChange('')}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-gray-600" />
            <span className={`text-sm font-medium ${!selectedParentId ? 'text-blue-700' : 'text-gray-700'}`}>
              Root Level (No Parent)
            </span>
          </div>
        </div>
      </div>
      
      {/* Role Hierarchy */}
      <div className="max-h-64 overflow-y-auto">
        {hierarchy.length > 0 ? (
          <div className="space-y-1">
            {hierarchy.map(role => renderRoleNode(role))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm py-4">
            No roles available as parents
          </p>
        )}
      </div>
      
      {currentRoleId && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <AlertCircle size={14} className="inline mr-1" />
          Current role and its descendants are excluded to prevent circular references.
        </div>
      )}
    </div>
  );
};

const SimpleMenuSelector: React.FC<SimpleMenuSelectorProps> = ({
  menus,
  selectedMenus,
  onMenuToggle,
  onParentPathChange
}) => {
  const buildHierarchy = (menuList: any[]) => {
    const menuMap = new Map();
    const rootMenus: any[] = [];

    (menuList || []).forEach(menu => {
      menuMap.set(menu._id, { ...menu, children: [] });
    });

    (menuList || []).forEach(menu => {
      const menuItem = menuMap.get(menu._id);
      
      if (menu.parentIds && menu.parentIds.length > 0) {
        (menu.parentIds || []).forEach((parentId: any) => {
          const actualParentId = typeof parentId === 'object' ? parentId._id : parentId;
          
          if (menuMap.has(actualParentId)) {
            const parent = menuMap.get(actualParentId);
            const menuItemCopy = { 
              ...menuItem, 
              children: [],
              isMultiParent: (menu.parentIds || []).length > 1,
              currentParentId: actualParentId,
              originalId: menu._id,
              possibleParents: (menu.parentIds || []).map((pid: any) => {
                const pId = typeof pid === 'object' ? pid._id : pid;
                const parentMenu = menuList.find(m => m._id === pId);
                return parentMenu ? { id: parentMenu._id, name: parentMenu.name } : null;
              }).filter(Boolean)
            };
            parent.children.push(menuItemCopy);
          }
        });
      } else {
        rootMenus.push(menuItem);
      }
    });

    // Recursively populate children
    const populateChildren = (parentMenu: any) => {
      if (parentMenu.children) {
        parentMenu.children.forEach((child: any) => {
          const childrenOfThisMenu = (menuList || []).filter(m => 
            m.parentIds && m.parentIds.some((pid: any) => {
              const actualPid = typeof pid === 'object' ? pid._id : pid;
              return actualPid === (child.originalId || child._id);
            })
          );
          
          (childrenOfThisMenu || []).forEach(childMenu => {
            const childCopy = {
              ...childMenu,
              children: [],
              isMultiParent: childMenu.parentIds?.length > 1,
              originalId: childMenu._id,
              possibleParents: childMenu.parentIds?.map((pid: any) => {
                const pId = typeof pid === 'object' ? pid._id : pid;
                const parentMenu = menuList.find(m => m._id === pId);
                return parentMenu ? { id: parentMenu._id, name: parentMenu.name } : null;
              }).filter(Boolean) || []
            };
            child.children.push(childCopy);
          });
          
          populateChildren(child);
        });
      }
    };

    (rootMenus || []).forEach(rootMenu => {
      populateChildren(rootMenu);
    });

    return (rootMenus || []).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  };

  const isDirectlySelected = (menu: any) => {
    const menuId = menu.originalId || menu._id;
    const currentParentId = menu.currentParentId;
    
    if (menu.isMultiParent && currentParentId) {
      const parentName = menu.possibleParents?.find((p: any) => p.id === currentParentId)?.name;
      return (selectedMenus || []).some(selected => 
        selected.menuId === menuId && 
        selected.selectedParentPath === parentName
      );
    } else {
      return (selectedMenus || []).some(selected => selected.menuId === menuId);
    }
  };

  const areAnyChildrenSelected = (menu: any) => {
    if (!menu.children || menu.children.length === 0) return false;
    return menu.children.some((child: any) => isDirectlySelected(child));
  };

  const isMenuSelected = (menu: any) => {
    if (isDirectlySelected(menu)) return true;
    if (menu.children && menu.children.length > 0) {
      return areAnyChildrenSelected(menu);
    }
    return false;
  };

  const isIndeterminate = (menu: any) => {
    return false; 
  };

  const onMenuChecked = (menu: any, isChecked: boolean) => {
    const applyToChildren = (currentMenu: any) => {
      const menuId = currentMenu.originalId || currentMenu._id;
      const currentParentId = currentMenu.currentParentId;

      onMenuToggle({
        ...currentMenu,
        currentParentId
      }, isChecked);

      if (currentMenu.children && currentMenu.children.length > 0) {
        currentMenu.children.forEach((child: any) => {
          applyToChildren(child);
        });
      }
    };
    applyToChildren(menu);
  };

  const getSelectedParentPath = (menuId: string) => {
    const selected = (selectedMenus || []).find(item => item.menuId === menuId);
    return selected?.selectedParentPath || '';
  };

  const renderMenuItem = (menu: any, level: number = 0): React.ReactElement => {
    const hasChildren = menu.children && menu.children.length > 0;
    const menuId = menu.originalId || menu._id;
    
    const isSelected = isMenuSelected(menu);
    const isIndeterminateState = isIndeterminate(menu);

    return (
      <div key={`${menuId}-${level}-${menu.currentParentId || 'root'}`}>
        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
          <input
            type="checkbox"
            ref={(el) => {
              if (el) {
                el.indeterminate = isIndeterminateState;
              }
            }}
            id={`menu-${menuId}-${level}-${menu.currentParentId || 'root'}`}
            checked={isSelected}
            onChange={(e) => {
              onMenuChecked(menu, e.target.checked);
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label 
            htmlFor={`menu-${menuId}-${level}-${menu.currentParentId || 'root'}`}
            className="flex-1 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span 
                className={`text-sm ${level === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'} ${isSelected ? 'text-blue-600 font-medium' : ''}`}
                style={{ paddingLeft: `${level * 20}px` }}
              >
                {menu.name} {isSelected && '✓'}
              </span>
              {menu.isMultiParent && (
                <span className="text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded">
                  Multiple parents
                </span>
              )}
              {hasChildren && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                  {menu.children.length} child{menu.children.length !== 1 ? 'ren' : ''}
                </span>
              )}
            </div>
            <div 
              className="text-xs text-gray-500 mt-1"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              /{menu.slug}
              {menu.isMultiParent && menu.currentParentId && (
                <span className="ml-2 text-purple-600">
                  (Under: {menu.possibleParents?.find((p: any) => p.id === menu.currentParentId)?.name})
                </span>
              )}
              {menu.isMultiParent && !menu.currentParentId && (
                <span className="ml-2">
                  (Available under: {(menu.possibleParents || []).map((p: any) => p.name).join(', ')})
                </span>
              )}
            </div>
          </label>
        </div>

        {isSelected && menu.isMultiParent && !menu.currentParentId && (
          <div className="ml-7 mt-2 mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Choose parent path for "{menu.name}":
            </div>
            <div className="text-xs text-gray-600 mb-3">
              Note: You can select this menu under multiple parent paths independently.
            </div>
            <div className="space-y-2">
              {menu.possibleParents?.map((parent: any) => (
                <label key={parent.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={parent.name}
                    checked={getSelectedParentPath(menuId) === parent.name || 
                             (selectedMenus || []).some(item => 
                               item.menuId === menuId && item.selectedParentPath === parent.name
                             )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const alreadySelected = (selectedMenus || []).some(item => 
                          item.menuId === menuId && item.selectedParentPath === parent.name
                        );
                        if (!alreadySelected) {
                          onMenuToggle({
                            ...menu,
                            possibleParents: [parent],
                            currentParentId: parent.id
                          }, true);
                        }
                      } else {
                        onMenuToggle({
                          ...menu,
                          possibleParents: [parent],
                          currentParentId: parent.id
                        }, false);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Via {parent.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {hasChildren && (
          <div className="ml-4">
            {(menu.children || []).map((child: any) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy(menus);
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700">Select Menu Permissions</h4>
        <p className="text-xs text-gray-500 mt-1">
          For submenus with multiple parents, choose which parent path to use. Checking a parent will select all its children.
        </p>
      </div>
      
      <div className="space-y-1">
        {(hierarchy || []).map(menu => renderMenuItem(menu))}
      </div>
      
      {(hierarchy || []).length === 0 && (
        <p className="text-center text-gray-500 text-sm py-4">
          No menus available
        </p>
      )}
    </div>
  );
};

const RoleCreate: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<RoleForm>({ 
    name: '', 
    display_name: '', 
    description: '',
    parent_id: '',
    menulist: []
  });

  const { data: roleData, isLoading, refetch } = useGetRoleByIdQuery({ 
    id: id ?? '',
    include_children: false,
    include_ancestors: false
  }, {
    skip: !isEdit || !id,
  });

  const { data: rolesResponse } = useGetRolesQuery({
    page: 1,
    limit: 1000, // Get all roles for hierarchy
    search: '',
  });

  const { data: menusResponse } = useGetMenusQuery({
    page: 1,
    limit: 100,
    search: '',
  });

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  // Handle responses
  const menus = Array.isArray(menusResponse) ? menusResponse : (menusResponse?.data || []);
  const activeMenus = (menus || []).filter((menu: any) => menu.status === 'active');
  
  const roles = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.data || []);
  const activeRoles = (roles || []).filter((role: any) => role.is_active !== false);

  const flattenMenuListForEdit = (hierarchicalMenuList: any[]): MenuListItem[] => {
    const flatList: MenuListItem[] = [];
    
    const processMenu = (menu: any, parentPath: string = '') => {
      const matchedMenu = activeMenus.find((m: any) => 
        (m.slug === menu.slug && m.name === menu.name) ||
        (m.name === menu.name) ||
        (m.slug === menu.slug)
      );
      
      if (matchedMenu) {
        const menuItem: MenuListItem = {
          name: menu.name,
          slug: menu.slug,
          icon: menu.icon || matchedMenu.icon || '',
          menuId: matchedMenu._id,
          selectedParentPath: parentPath
        };
        
        flatList.push(menuItem);
        
        if (menu.submenu && Array.isArray(menu.submenu) && menu.submenu.length > 0) {
          menu.submenu.forEach((child: any) => {
            processMenu(child, menu.name);
          });
        }
      }
    };
    
    if (Array.isArray(hierarchicalMenuList)) {
      hierarchicalMenuList.forEach(menu => {
        if (menu && typeof menu === 'object') {
          processMenu(menu);
        }
      });
    }
    
    return flatList;
  };

  useEffect(() => {
    if (roleData && activeMenus.length > 0) {
      const existingMenuList = roleData?.data?.menulist || [];
      
      let processedMenuList: MenuListItem[] = [];
      
      if (existingMenuList.length > 0) {
        const firstItem = existingMenuList[0];
        
        if (firstItem.submenu !== undefined || (!firstItem.menuId && firstItem.name && firstItem.slug)) {
          processedMenuList = flattenMenuListForEdit(existingMenuList);
        } else if (firstItem.menuId) {
          processedMenuList = existingMenuList;
        } else {
          processedMenuList = existingMenuList.map((item: any) => {
            const matchedMenu = activeMenus.find((m: any) => 
              (m.slug === item.slug && m.name === item.name) ||
              m.name === item.name
            );
            
            return {
              ...item,
              menuId: matchedMenu?._id || '',
              icon: item.icon || ''
            };
          }).filter((item: MenuListItem) => item.menuId);
        }
      }
      
      setForm({
        name: roleData?.data?.name || '',
        display_name: roleData?.data?.display_name || '',
        description: roleData?.data?.description || '',
        parent_id: roleData?.data?.parent_id || '',
        menulist: processedMenuList,
      });
    }
  }, [roleData, activeMenus.length]);

  const transformMenuListToHierarchy = (flatMenuList: MenuListItem[]) => {
    const allMenusMap = new Map();
    activeMenus.forEach((menu: any) => {
      allMenusMap.set(menu._id, menu);
    });

    const hierarchyMap = new Map();
    const rootMenus: any[] = [];

    flatMenuList.forEach(selectedMenu => {
      const menuData = allMenusMap.get(selectedMenu.menuId);
      if (!menuData) return;

      const menuItem = {
        name: menuData.name,
        slug: menuData.slug,
        icon: menuData.icon || "",
        menuId: menuData._id,
        submenu: []
      };

      const hasParent = menuData.parentIds && menuData.parentIds.length > 0;      
      if (!hasParent) {
        if (!hierarchyMap.has(menuData._id)) {
          hierarchyMap.set(menuData._id, menuItem);
          rootMenus.push(menuItem);
        }
      } else {
        menuData.parentIds.forEach((parentId: any) => {
          const actualParentId = typeof parentId === 'object' ? parentId._id : parentId;
          
          const parentSelected = flatMenuList.find(item => item.menuId === actualParentId);
          
          if (parentSelected) {
            if (!hierarchyMap.has(actualParentId)) {
              const parentMenuData = allMenusMap.get(actualParentId);
              
              if (parentMenuData) {
                const parentItem = {
                  name: parentMenuData.name,
                  slug: parentMenuData.slug,
                  icon: parentMenuData.icon || "",
                  menuId: parentMenuData._id,
                  submenu: []
                };
                hierarchyMap.set(actualParentId, parentItem);
                
                const parentHasParent = parentMenuData.parentIds && parentMenuData.parentIds.length > 0;
                if (!parentHasParent) {
                  rootMenus.push(parentItem);
                }
              }
            }
            
            const parentMenu = hierarchyMap.get(actualParentId);
            if (parentMenu && !parentMenu.submenu.find((child: any) => child.menuId === menuData._id)) {
              parentMenu.submenu.push(menuItem);
            }
          }
        });
      }
    });

    const cleanStructure = (menus: any[]): any[] => {
      return menus.map(menu => {
        const cleanMenu: any = {
          name: menu.name,
          slug: menu.slug,
          icon: menu.icon
        };
        
        if (menu.submenu && menu.submenu.length > 0) {
          cleanMenu.submenu = cleanStructure(menu.submenu);
        }
        
        return cleanMenu;
      });
    };

    return cleanStructure(rootMenus);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hierarchicalMenuList = transformMenuListToHierarchy(form.menulist);
      
      const roleData = {
        name: form.name,
        display_name: form.display_name || undefined,
        description: form.description || undefined,
        parent_id: form.parent_id || undefined,
        menulist: hierarchicalMenuList
      };

      if (isEdit && id) {
        await updateRole({ id, data: roleData });
        navigate('/role');
      } else {
        // console.log('Creating role with data:', roleData);
        await createRole(roleData);
        navigate('/role');
      }      
      
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleInputChange = (field: keyof RoleForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleParentRoleChange = (parentId: string) => {
    setForm(prev => ({ ...prev, parent_id: parentId }));
  };

  const handleMenuToggle = (menu: any, isSelected: boolean) => {
    const menuId = menu.originalId || menu._id;
    const currentParentId = menu.currentParentId;
    
    if (isSelected) {
      let selectedParentPath = '';
      if (menu.isMultiParent) {
        if (currentParentId) {
          selectedParentPath = menu.possibleParents?.find((p: any) => p.id === currentParentId)?.name || '';
        } else {
          selectedParentPath = menu.possibleParents && menu.possibleParents.length > 0 ? menu.possibleParents[0].name : '';
        }
      }
      
      const alreadyExists = (form.menulist || []).some(item => 
        item.menuId === menuId && 
        (menu.isMultiParent ? item.selectedParentPath === selectedParentPath : true)
      );
      
      if (!alreadyExists) {
        const newMenuItem: MenuListItem = {
          name: menu.name,
          slug: menu.slug,
          icon: menu.icon || 'Menu',
          menuId: menuId,
          selectedParentPath: selectedParentPath
        };
        
        setForm((prev: RoleForm) => ({
          ...prev,
          menulist: [...(prev.menulist || []), newMenuItem]
        }));
      }
    } else {
      // For multi-parent menus, only remove the specific parent path instance
      if (menu.isMultiParent && currentParentId) {
        const parentName = menu.possibleParents?.find((p: any) => p.id === currentParentId)?.name;
        setForm((prev: RoleForm) => ({
          ...prev,
          menulist: (prev.menulist || []).filter((item: MenuListItem) => 
            !(item.menuId === menuId && item.selectedParentPath === parentName)
          )
        }));
      } else {
        // For regular menus or root level selections, remove all instances
        setForm((prev: RoleForm) => ({
          ...prev,
          menulist: (prev.menulist || []).filter((item: MenuListItem) => item.menuId !== menuId)
        }));
      }
    }
  };

  const handleParentPathChange = (menuId: string, parentPath: string) => {
    setForm((prev: RoleForm) => ({
      ...prev,
      menulist: (prev.menulist || []).map((item: MenuListItem) => 
        item.menuId === menuId 
          ? { ...item, selectedParentPath: parentPath }
          : item
      )
    }));
  };

  const handleRemoveMenuFromRole = (index: number) => {
    setForm((prev: RoleForm) => ({
      ...prev,
      menulist: (prev.menulist || []).filter((_: MenuListItem, i: number) => i !== index)
    }));
  };

  if (isEdit && isLoading) return <p>Loading role...</p>;

  return (
    <div className="mx-auto p-6 bg-white shadow-lg rounded-lg mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="text-blue-600" />
          {isEdit ? 'Edit Role' : 'Create New Role'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEdit ? 'Update role information, hierarchy, and menu permissions' : 'Create a new role with hierarchy and menu permissions'}
        </p>
      </div>
    
      <form onSubmit={handleSubmit} aria-label="Role form">
        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="name" className="block mb-2 font-semibold text-gray-700">
              Role Name *
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter role name (e.g., admin, manager)"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="display_name" className="block mb-2 font-semibold text-gray-700">
              Display Name
            </label>
            <input
              id="display_name"
              type="text"
              placeholder="Enter display name (e.g., Administrator)"
              value={form.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block mb-2 font-semibold text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Enter role description"
            value={form.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-vertical"
          />
        </div>

        {/* Parent Role Selection */}
        <div className="mb-6">
          <label className="block mb-3 font-semibold text-gray-700">
            Role Hierarchy
          </label>
          <RoleHierarchySelector
            roles={activeRoles}
            selectedParentId={form.parent_id}
            onParentChange={handleParentRoleChange}
            currentRoleId={id}
            disabled={false}
          />
        </div>

        {/* Current Role Info Display */}
        {form.parent_id && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TreePine size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Role Hierarchy Preview</span>
            </div>
            <div className="text-sm text-blue-700">
              {(() => {
                const parentRole = activeRoles.find((r: any) => r._id === form.parent_id);
                const parentLevel = parentRole?.level || 0;
                const currentLevel = parentLevel + 1;
                return (
                  <div>
                    <div>Parent: <strong>{parentRole?.display_name || parentRole?.name}</strong> (Level {parentLevel})</div>
                    <div>Current Role: <strong>{form.display_name || form.name}</strong> (Level {currentLevel})</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Hierarchical Menu Assignment Section */}
        <div className="mb-6">
          <label className="block mb-3 font-semibold text-gray-700">
            Assign Menus to Role
          </label>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menu Selection List */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Available Menus</h4>
              <SimpleMenuSelector
                menus={activeMenus}
                selectedMenus={form.menulist}
                onMenuToggle={handleMenuToggle}
                onParentPathChange={handleParentPathChange}
              />
            </div>

            {/* Selected Menus List */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Selected Menus ({(form.menulist || []).length})
              </h4>

              {(form.menulist || []).length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-gray-500 text-sm text-center">
                    No menus selected yet. Use the tree on the left to select menus.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {(form.menulist || []).map((menuItem, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-100 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Menu size={16} className="text-gray-600" />
                            <div>
                              <span className="font-medium text-gray-800">{menuItem.name}</span>
                              <span className="text-gray-500 text-sm ml-2">({menuItem.slug})</span>
                              {menuItem.selectedParentPath && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Via: {menuItem.selectedParentPath}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMenuFromRole(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition"
                            aria-label={`Remove ${menuItem.name} from role`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/role')}
            className="flex items-center gap-2 px-5 py-3 text-gray-600 font-semibold rounded-md hover:bg-gray-100 transition border border-gray-300"
          >
            <XCircle size={18} />
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
          >
            {isEdit ? <Save size={18} /> : <Plus size={18} />}
            {isEdit ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleCreate;