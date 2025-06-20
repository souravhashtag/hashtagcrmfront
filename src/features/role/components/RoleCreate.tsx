import React, { useEffect, useState } from 'react';
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRoleByIdQuery,
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
  menulist: MenuListItem[];
}

interface SimpleMenuSelectorProps {
  menus: any[];
  selectedMenus: MenuListItem[];
  onMenuToggle: (menu: any, isSelected: boolean) => void;
  onParentPathChange: (menuId: string, parentPath: string) => void;
}

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
    //console.log("selectedMenus==>",selectedMenus);
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

  // Check if any direct children are selected
  const areAnyChildrenSelected = (menu: any) => {
    if (!menu.children || menu.children.length === 0) return false;
    
    return menu.children.some((child: any) => isDirectlySelected(child));
  };

  // Main function to determine if menu should show as checked
  const isMenuSelected = (menu: any) => {
    // First check if directly selected
    if (isDirectlySelected(menu)) return true;
    
    // If has children, check if ANY children are selected
    if (menu.children && menu.children.length > 0) {
      return areAnyChildrenSelected(menu);
    }
    
    return false;
  };

  const isIndeterminate = (menu: any) => {
    return false; 
  };

  const onMenuChecked = (menu: any, isChecked: boolean) => {
    //console.log("menu===>",menu)
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
    
    // Use the isMenuSelected function for consistent logic
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

        {/* Parent Path Selection for Multi-Parent Menus - Only show once per unique menu */}
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

        {/* Children */}
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
    menulist: []
  });

  const { data: roleData, isLoading, refetch } = useGetRoleByIdQuery(id ?? '', {
    skip: !isEdit || !id,
  });

  const { data: menusResponse } = useGetMenusQuery({
    page: 1,
    limit: 100,
    search: '',
  });

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  // Handle menu response structure
  const menus = Array.isArray(menusResponse) ? menusResponse : (menusResponse?.data || []);
  const activeMenus = (menus || []).filter((menu: any) => menu.status === 'active');

  const flattenMenuListForEdit = (hierarchicalMenuList: any[]): MenuListItem[] => {
    const flatList: MenuListItem[] = [];
    
    const processMenu = (menu: any, parentPath: string = '') => {
      const matchedMenu = activeMenus.find((m: any) => 
        (m.slug === menu.slug && m.name === menu.name) ||
        (m.name === menu.name) ||
        (m.slug === menu.slug)
      );
      
      if (matchedMenu) {
        // Add current menu to flat list
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
    
    // Process each root menu
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
      
      // Check if menulist is hierarchical (has submenu property) or flat (has menuId property)
      let processedMenuList: MenuListItem[] = [];
      
      if (existingMenuList.length > 0) {
        const firstItem = existingMenuList[0];
        
        if (firstItem.submenu !== undefined || (!firstItem.menuId && firstItem.name && firstItem.slug)) {
          // Hierarchical structure - flatten it
          //console.log('Detected hierarchical structure, flattening...');
          processedMenuList = flattenMenuListForEdit(existingMenuList);
          //console.log('Flattened menulist:', processedMenuList);
        } else if (firstItem.menuId) {
          // Already flat structure with menuId
          console.log('Detected flat structure with menuId');
          processedMenuList = existingMenuList;
        } else {
          // Old structure without menuId - try to match by name/slug
          //console.log('Detected old structure, matching by name/slug...');
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
          }).filter((item: MenuListItem) => item.menuId); // Remove items without valid menuId
        }
      }
      
      //console.log('Final processed menulist:', processedMenuList);
      
      setForm({
        name: roleData?.data?.name || '',
        display_name: roleData?.data?.display_name || '',
        description: roleData?.data?.description || '',
        menulist: processedMenuList,
      });
    }
  }, [roleData, activeMenus.length]);

  const transformMenuListToHierarchy = (flatMenuList: MenuListItem[]) => {
    //console.log("flatMenuList===>", flatMenuList)
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

      // Determine if this is a root menu or child menu
      const hasParent = menuData.parentIds && menuData.parentIds.length > 0;      
      if (!hasParent) {
        // This is a root menu
        if (!hierarchyMap.has(menuData._id)) {
          hierarchyMap.set(menuData._id, menuItem);
          rootMenus.push(menuItem);
        }
      } else {
        // This is a child menu, find its parents in the selected list
        menuData.parentIds.forEach((parentId: any) => {
          const actualParentId = typeof parentId === 'object' ? parentId._id : parentId;
          
          // Check if parent is also selected
          const parentSelected = flatMenuList.find(item => item.menuId === actualParentId);
          
          if (parentSelected) {
            // Parent is selected, add this as child
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
                
                // Check if parent should be root
                const parentHasParent = parentMenuData.parentIds && parentMenuData.parentIds.length > 0;
                if (!parentHasParent) {
                  rootMenus.push(parentItem);
                }
              }
            }
            
            // Add current menu as child to parent
            const parentMenu = hierarchyMap.get(actualParentId);
            if (parentMenu && !parentMenu.submenu.find((child: any) => child.menuId === menuData._id)) {
              parentMenu.submenu.push(menuItem);
            }
          }
        });
      }
    });

    // Remove menuId from final structure and clean up empty submenus
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
      // Transform flat menu list to hierarchical structure
      const hierarchicalMenuList = transformMenuListToHierarchy(form.menulist);
      
      const roleData = {
        name: form.name,
        display_name: form.display_name || null,
        description: form.description || null,
        menulist: hierarchicalMenuList
      };

      if (isEdit && id) {
        //console.log("roleData==", roleData);
        await updateRole({ id, data: roleData });
        navigate('/role');
      } else {
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
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Role' : 'Create New Role'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEdit ? 'Update role information and menu permissions' : 'Create a new role with specific menu permissions'}
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
              placeholder="Enter role name (e.g., admin, user)"
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