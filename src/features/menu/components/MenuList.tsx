import React, { useState, useEffect } from 'react';
import {
  useGetMenusQuery,
  useDeleteMenuMutation
} from '../../../services/menuServices';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Search, X, Building, Users, Calendar,
  User, Mail, Phone, MessageCircle, CheckSquare, Clipboard,
  DollarSign, BarChart2, Activity, Briefcase, Tag, ShoppingCart,
  Settings, Globe, Bell, FileText, MapPin, CreditCard, Star,
  Truck, Home, Folder, ChevronRight, ChevronDown, Link2,PlaneTakeoff, CalendarDays
} from 'lucide-react';

// Icon mapping for display
const ICON_MAP: Record<string, any> = {
  Home,
  Building,
  Folder,
  User,
  Users,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  CheckSquare,
  Clipboard,
  DollarSign,
  BarChart2,
  Activity,
  Briefcase,
  Tag,
  ShoppingCart,
  Settings,
  Globe,
  Bell,
  FileText,
  MapPin,
  CreditCard,
  Star,
  Truck,
  PlaneTakeoff,
  CalendarDays
};

interface MenuItemProps {
  menu: any;
  level: number;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onToggleExpand: (id: string) => void;
  expandedIds: Set<string>;
  allMenus: any[]; // For looking up parent names
}

const MenuItem: React.FC<MenuItemProps> = ({
  menu,
  level,
  onEdit,
  onDelete,
  onToggleExpand,
  expandedIds,
  allMenus,
}) => {
  const hasChildren = menu.children && menu.children.length > 0;
  const isExpanded = expandedIds.has(menu._id);
  
  const Icon = ICON_MAP[menu.icon] || Folder;

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getOrderBadge = (order: number) => {
    const colors = {
      0: 'bg-blue-100 text-blue-800',
      1: 'bg-gray-100 text-gray-800',
    };
    
    const labels = {
      0: 'Main Menu',
      1: 'Sub Menu',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[order as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[order as keyof typeof labels] || `Order ${order}`}
      </span>
    );
  };

  const getParentNames = (parentIds: any[]) => {
    if (!parentIds || parentIds.length === 0) return 'Root Level';
    
    return parentIds.map(parentId => {
      if (typeof parentId === 'object' && parentId.name) {
        return parentId.name;
      }
      // Look up parent name in allMenus
      const parent = allMenus.find(m => m._id === parentId);
      return parent?.name || 'Unknown';
    }).join(', ');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="menu-item">
      <div
        className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => hasChildren && onToggleExpand(menu._id)}
          className={`p-1 rounded transition-colors ${
            hasChildren
              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              : 'text-transparent cursor-default'
          }`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon size={18} className="text-gray-600" />
        </div>

        {/* Menu Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{menu.name}</span>
            {menu.parentIds && menu.parentIds.length > 1 && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Link2 size={12} />
                {menu.parentIds.length} parents
              </span>
            )}
            {menu.isMultiParent && (
              <span className="text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded">
                Multi-parent
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>Slug: /{menu.slug}</span>
            <span>Level: {menu.level}</span>
            <span>Created: {formatDate(menu.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">Parents: {getParentNames(menu.parentIds)}</span>
          </div>
        </div>

        {/* Order Badge */}
        <div className="flex-shrink-0">
          {getOrderBadge(menu.order)}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          {getStatusBadge(menu.status)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(menu._id)}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(menu._id, menu.name)}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="children">
          {menu.children.map((child: any) => (
            <MenuItem
              key={child._id}
              menu={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              expandedIds={expandedIds}
              allMenus={allMenus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MenuList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [orderFilter, setOrderFilter] = useState<string>(''); // New filter for order
  const limit = 50; // Higher limit for hierarchy view

  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useGetMenusQuery(
    { 
      page: currentPage, 
      limit, 
      search
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const [deleteMenu] = useDeleteMenuMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    refetch();
  };

  // const handleOrderFilter = (order: string) => {
  //   setOrderFilter(order);
  //   setCurrentPage(1);
  //   refetch();
  // };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all its children or remove parent relationships.`)) {
      try {
        await deleteMenu(id).unwrap();
        refetch();
      } catch (err) {
        alert('Failed to delete menu item');
      }
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/menu/edit/${id}`);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Build hierarchy from flat list (updated for multiple parents)
  const buildHierarchy = (menus: any[]): any[] => {
    const menuMap = new Map();
    const rootMenus: any[] = [];

    // First pass: create map of all menus
    menus.forEach(menu => {
      menuMap.set(menu._id, { ...menu, children: [] });
    });

    // Second pass: build hierarchy
    menus.forEach(menu => {
      const menuItem = menuMap.get(menu._id);
      
      if (menu.parentIds && menu.parentIds.length > 0) {
        menu.parentIds.forEach((parentId: any) => {
          const actualParentId = typeof parentId === 'object' ? parentId._id : parentId;
          
          if (menuMap.has(actualParentId)) {
            const parent = menuMap.get(actualParentId);
            // Create a copy of the menu item for each parent to avoid reference issues
            const menuItemCopy = { 
              ...menuItem, 
              children: [...menuItem.children],
              isMultiParent: menu.parentIds.length > 1,
              currentParentId: actualParentId
            };
            parent.children.push(menuItemCopy);
          }
        });
      } else {
        
        rootMenus.push(menuItem);
      }
    });

    const copyChildrenForMultiParent = (parentMenu: any) => {
      if (parentMenu.children) {
        parentMenu.children.forEach((child: any) => {
          if (child.parentIds && child.parentIds.length > 0) {
            const originalMenu = menus.find(m => m._id === child._id);
            if (originalMenu) {
              const childrenOfThisMenu = menus.filter(m => 
                m.parentIds && m.parentIds.some((pid: any) => {
                  const actualPid = typeof pid === 'object' ? pid._id : pid;
                  return actualPid === child._id;
                })
              );
              
              child.children = childrenOfThisMenu.map(childMenu => ({
                ...childMenu,
                children: [],
                isMultiParent: child.parentIds?.length > 1,
                currentParentId: child._id
              }));
              
              copyChildrenForMultiParent(child);
            }
          }
        });
      }
    };

    rootMenus.forEach(rootMenu => {
      copyChildrenForMultiParent(rootMenu);
    });

    return rootMenus.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  };

  const expandAll = () => {
    const getAllIds = (menus: any[]): string[] => {
      let ids: string[] = [];
      menus.forEach(menu => {
        ids.push(menu._id);
        if (menu.children && menu.children.length > 0) {
          ids.push(...getAllIds(menu.children));
        }
      });
      return ids;
    };

    if (data?.data) {
      const hierarchy = buildHierarchy(data.data);
      setExpandedIds(new Set(getAllIds(hierarchy)));
    }
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  useEffect(() => {
    refetch();
  }, [currentPage, search, orderFilter]);

  const menus = data?.data || [];
  const pagination = data?.pagination;
  const hierarchy = showHierarchy ? buildHierarchy(menus) : menus;

  // Statistics
  const rootMenusCount = menus.filter((m: any) => !m.parentIds || m.parentIds.length === 0).length;
  const multipleParentsCount = menus.filter((m: any) => m.parentIds && m.parentIds.length > 1).length;
  const highPriorityCount = menus.filter((m: any) => m.order === 0).length;

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your application's navigation structure ({menus.length} total items)
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Root: {rootMenusCount}</span>
            <span>Multiple Parents: {multipleParentsCount}</span>
            {/* <span>High Priority: {highPriorityCount}</span> */}
          </div>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={() => navigate('/menu/create')}
        >
          <Plus size={18} /> Create Menu
        </button>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search menus by name or slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-[#14b8a6] rounded-lg"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </form>

        {/* Order Filter */}
        {/* <select
          value={orderFilter}
          onChange={(e) => handleOrderFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="0">Main Menu (0)</option>
          <option value="1">Sub Menu (1)</option>
        </select> */}

        <div className="flex gap-2">
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            className={`px-3 py-2 rounded-lg transition ${
              showHierarchy 
                ? 'bg-[#284084] text-white' 
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            {showHierarchy ? 'Flat View' : 'Tree View'}
          </button>
          
          {showHierarchy && (
            <>
              <button
                onClick={expandAll}
                className="px-3 py-2 text-white rounded-lg hover:bg-[#00d9b0] transition bg-[#00bebb]"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-white bg-[#05332a] rounded-lg hover:bg-gray-100 transition hover:bg-[#2f645a]"
              >
                Collapse All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Menu List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-[#129990]">
          <div className="flex items-center gap-3 font-medium uppercase text-[#FFF] text-sm">
            {showHierarchy && <div className="w-4"></div>} {/* Expand button space */}
            <div className="w-5"></div> {/* Icon space */}
            <div className="flex-1">Menu Information</div>
            <div className="w-24 text-center">Priority</div>
            <div className="w-20 text-center">Status</div>
            <div className="w-20 text-center">Actions</div>
          </div>
        </div>

        {/* Menu Items */}
        <div>
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading menus...</p>
              </div>
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No menus found.</p>
              <p className="text-gray-400 text-sm">
                {search ? 'Try adjusting your search criteria.' : 'Create your first menu item to get started.'}
              </p>
            </div>
          ) : showHierarchy ? (
            // Hierarchical view
            hierarchy.map((menu: any) => (
              <MenuItem
                key={menu._id}
                menu={menu}
                level={0}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleExpand={toggleExpanded}
                expandedIds={expandedIds}
                allMenus={menus}
              />
            ))
          ) : (
            // Flat view
            menus.map((menu: any) => (
              <div key={menu._id} className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                <div className="w-4"></div> {/* Space for consistency */}
                <div className="flex-shrink-0">
                  {React.createElement(ICON_MAP[menu.icon] || Folder, { size: 18, className: "text-gray-600" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{menu.name}</span>
                    {menu.parentIds && menu.parentIds.length > 1 && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
                        <Link2 size={12} />
                        {menu.parentIds.length} parents
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>/{menu.slug}</span>
                    <span>Level: {menu.level}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      Parents: {
                        menu.parentIds && menu.parentIds.length > 0
                          ? menu.parentIds.map((p: any) => typeof p === 'object' ? p.name : 'Unknown').join(', ')
                          : 'Root Level'
                      }
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    menu.order === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {menu.order === 0 ? 'Main Menu' : 'Sub menu'}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    menu.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {menu.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(menu._id)}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(menu._id, menu.name)}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_records} total menus)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded">
              {pagination.current_page}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-sm text-gray-500">
        <p>💡 Tree View shows hierarchical structure. Menus with multiple parents appear under ALL their parent menus. Use Flat View to see all parent relationships without duplication.</p>
      </div>
    </div>
  );
};

export default MenuList;