import React, { useState, useEffect } from 'react';
import {
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useGetMenuByIdQuery,
  useGetMenusQuery,
} from '../../../services/menuServices';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Users, Mail, Phone, MessageCircle, Calendar, CheckSquare, Clipboard,
  DollarSign, BarChart2, Activity, Briefcase, Tag, ShoppingCart, Settings,
  Globe, Bell, FileText, MapPin, CreditCard, Star, Truck, Plus, Save,
  ArrowLeft, Building, Home, Folder, X,LayoutDashboard ,Layers 
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Home', Icon: Home },
  { name: 'Building', Icon: Building },
  { name: 'Folder', Icon: Folder },
  { name: 'User', Icon: User },
  { name: 'Users', Icon: Users },
  { name: 'Mail', Icon: Mail },
  { name: 'Phone', Icon: Phone },
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'Calendar', Icon: Calendar },
  { name: 'CheckSquare', Icon: CheckSquare },
  { name: 'Clipboard', Icon: Clipboard },
  { name: 'DollarSign', Icon: DollarSign },
  { name: 'BarChart2', Icon: BarChart2 },
  { name: 'Activity', Icon: Activity },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'Tag', Icon: Tag },
  { name: 'ShoppingCart', Icon: ShoppingCart },
  { name: 'Settings', Icon: Settings },
  { name: 'Globe', Icon: Globe },
  { name: 'Bell', Icon: Bell },
  { name: 'FileText', Icon: FileText },
  { name: 'MapPin', Icon: MapPin },
  { name: 'CreditCard', Icon: CreditCard },
  { name: 'Star', Icon: Star },
  { name: 'Truck', Icon: Truck },
  { name: 'LayoutDashboard', Icon: LayoutDashboard  },
  { name: 'Layers', Icon: Layers  },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'text-green-600' },
  { value: 'inactive', label: 'Inactive', color: 'text-red-600' },
];

interface MenuForm {
  name: string;
  slug: string;
  icon: string;
  status: string;
  parentIds: string[]; 
  order: number;
}

interface MenuItem {
  _id: string;
  name: string;
  level?: number;
}

const MenuCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [form, setForm] = useState<MenuForm>({
    name: '',
    slug: '',
    icon: 'Folder',
    status: 'active',
    parentIds: [], 
    order: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(!isEditMode);
  const [originalData, setOriginalData] = useState<MenuForm | null>(null);

  const { data: menuData, isLoading: isLoadingMenu } = useGetMenuByIdQuery(id!, {
    skip: !isEditMode
  });

  const { data: menusResponse } = useGetMenusQuery({ 
    page: 1,
    limit: 100,
    search: '',
    parent: 0
  });

  const [createMenu, { isLoading: isCreating }] = useCreateMenuMutation();
  const [updateMenu, { isLoading: isUpdating }] = useUpdateMenuMutation();

  // Handle response structure early - needed throughout component
  const availableMenus: MenuItem[] = Array.isArray(menusResponse) ? menusResponse : (menusResponse?.data || []);
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (isEditMode && menuData?.data) {
      const menu = menuData.data;
      const initialData: MenuForm = {
        name: menu.name || '',
        slug: menu.slug || '',
        icon: menu.icon || 'Folder',
        status: menu.status || 'active',
        parentIds: Array.isArray(menu.parentIds) 
          ? menu.parentIds.map((p: any) => typeof p === 'object' ? p._id : p)
          : menu.parentId 
            ? [typeof menu.parentId === 'object' ? menu.parentId._id : menu.parentId]
            : [],
        order: menu.order || 0
      };
      
      setForm(initialData);
      setOriginalData(initialData);
    }
  }, [menuData, isEditMode]);

  useEffect(() => {
    if (form.name && !isEditMode) {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setForm(prev => ({ ...prev, slug }));
    }
  }, [form.name, isEditMode]);

  useEffect(() => {
    if (isEditMode && originalData) {
      const changed = JSON.stringify(form) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [form, originalData, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Menu name is required';
    }

    if (!form.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
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
      navigate('/menu');
      return;
    }

    try {
      const menuData = {
        name: form.name,
        slug: form.slug,
        icon: form.icon,
        status: form.status,
        parentIds: form.parentIds.length > 0 ? form.parentIds : undefined,
        order: form.order
      };

      if (isEditMode) {
        await updateMenu({ id: id!, data: menuData }).unwrap();
        navigate('/menu', {
          state: { message: 'Menu updated successfully!' }
        });
      } else {
        // console.log(menuData);return false
        await createMenu(menuData).unwrap();
        navigate('/menu', {
          state: { message: 'Menu created successfully!' }
        });
      }
    } catch (err: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} menu:`, err);
      if (err?.data?.message) {
        alert(err.data.message);
      } else {
        alert(`Failed to ${isEditMode ? 'update' : 'create'} menu. Please try again.`);
      }
    }
  };

  const handleInputChange = (field: keyof MenuForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleParentSelection = (parentId: string, isSelected: boolean) => {
    setForm(prev => ({
      ...prev,
      parentIds: isSelected
        ? [...prev.parentIds, parentId]
        : prev.parentIds.filter(id => id !== parentId)
    }));
  };

  const removeParent = (parentId: string) => {
    handleParentSelection(parentId, false);
  };

  const handleCancel = () => {
    const shouldConfirm = isEditMode ? hasChanges : Object.values(form).some(value => 
      (typeof value === 'string' && value.trim() !== '' && value !== 'active' && value !== 'Folder') ||
      (Array.isArray(value) && value.length > 0)
    );
    
    if (shouldConfirm) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        navigate('/menu');
      }
    } else {
      navigate('/menu');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      if (isEditMode && originalData) {
        setForm(originalData);
      } else {
        setForm({
          name: '',
          slug: '',
          icon: 'Folder',
          status: 'active',
          parentIds: [],
          order: 0
        });
      }
      setErrors({});
    }
  };

  const renderParentOptions = (menus: MenuItem[]) => {
    return menus
      .filter((menu: MenuItem) => {
        if (isEditMode && menu._id === id) return false;
        return (menu.level || 0) < 4;
      })
      .map((menu: MenuItem) => (
        <div key={menu._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
          <input
            type="checkbox"
            id={`parent-${menu._id}`}
            checked={form.parentIds.includes(menu._id)}
            onChange={(e) => handleParentSelection(menu._id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label 
            htmlFor={`parent-${menu._id}`}
            className="flex-1 text-sm cursor-pointer"
            style={{ paddingLeft: `${(menu.level || 0) * 20}px` }}
          >
            {menu.name} {(menu.level || 0) >= 4 ? '(Max depth)' : ''}
          </label>
        </div>
      ));
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingMenu) {
    return (
      <div className="mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (isEditMode && !menuData?.data) {
    return (
      <div className="mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Menu not found</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Menus
          </button>
        </div>
      </div>
    );
  }

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
                {isEditMode ? 'Update Menu' : 'Create New Menu'}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? `Editing: ${originalData?.name || 'Menu'}`
                  : 'Add a new menu item with multiple parent support'
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Menu Name *
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter menu name (e.g., Human Resources)"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                id="slug"
                type="text"
                placeholder="menu-slug"
                value={form.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
              <p className="text-xs text-gray-500 mt-1">
                {isEditMode ? 'URL-friendly identifier' : 'Auto-generated from name'}
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hierarchy - Checkbox Multiple Parent Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Menus
              </label>
              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-white">
                <div className="p-2">
                  <div className="flex items-center space-x-2 p-2 border-b border-gray-200 bg-gray-50">
                    <input
                      type="checkbox"
                      id="no-parent"
                      checked={form.parentIds.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm(prev => ({ ...prev, parentIds: [] }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="no-parent" className="text-sm font-medium cursor-pointer">
                      Root Level Menu (No Parent)
                    </label>
                  </div>
                  {renderParentOptions(availableMenus)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select one or more parent menus, or none for a root-level menu
              </p>
              
              {/* Selected Parents Display */}
              {form.parentIds.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected parents:</p>
                  <div className="flex flex-wrap gap-2">
                    {form.parentIds.map(parentId => {
                      const parent = availableMenus.find(m => m._id === parentId);
                      return (
                        <span
                          key={parentId}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                          {parent?.name || 'Unknown'}
                          <button
                            type="button"
                            onClick={() => removeParent(parentId)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                Menu Type
              </label>
              <select
                id="order"
                value={form.order}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>0 - Main Menu</option>
                <option value={1}>1 - Sub Menu</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">0 appears first, 1 appears second</p>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Icon
            </label>
            <div className="grid grid-cols-8 md:grid-cols-12 gap-3">
              {ICON_OPTIONS.map(({ name, Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleInputChange('icon', name)}
                  className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition ${
                    form.icon === name
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  title={name}
                >
                  <Icon
                    size={20}
                    className={form.icon === name ? 'text-blue-600' : 'text-gray-600'}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Selected: <strong>{form.icon}</strong>
            </p>
          </div>

          {/* Change Summary (Edit Mode Only) */}
          {isEditMode && hasChanges && originalData && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-orange-900 mb-2">Changes detected:</h3>
              <ul className="text-xs text-orange-800 space-y-1">
                {form.name !== originalData.name && (
                  <li>• Name: "{originalData.name}" → "{form.name}"</li>
                )}
                {form.slug !== originalData.slug && (
                  <li>• Slug: "{originalData.slug}" → "{form.slug}"</li>
                )}
                {form.icon !== originalData.icon && (
                  <li>• Icon: {originalData.icon} → {form.icon}</li>
                )}
                {form.status !== originalData.status && (
                  <li>• Status: {originalData.status} → {form.status}</li>
                )}
                {JSON.stringify(form.parentIds.sort()) !== JSON.stringify(originalData.parentIds.sort()) && (
                  <li>• Parents: {originalData.parentIds.length} → {form.parentIds.length} selected</li>
                )}
                {form.order !== originalData.order && (
                  <li>• Order: {originalData.order} → {form.order}</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
            <div className="flex items-center gap-3 p-3 bg-white rounded border">
              {React.createElement(
                ICON_OPTIONS.find(opt => opt.name === form.icon)?.Icon || Folder,
                { size: 20, className: "text-gray-600" }
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{form.name || 'Menu Name'}</div>
                <div className="text-sm text-gray-500">
                  Slug: {form.slug || 'slug'}
                </div>
              </div>
              <div className="ml-auto">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  form.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {form.status}
                </span>
              </div>
            </div>
            {form.parentIds.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Will appear under: 
                <div className="mt-1 flex flex-wrap gap-1">
                  {form.parentIds.map((parentId, index) => {
                    const parent = availableMenus.find((m: MenuItem) => m._id === parentId);
                    return (
                      <span key={parentId} className="inline-block">
                        <strong>{parent?.name || 'Unknown Parent'}</strong>
                        {index < form.parentIds.length - 1 && ', '}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

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
            
            {(isEditMode ? hasChanges : (
              Object.values(form).some(value => 
                (typeof value === 'string' && value.trim() !== '' && value !== 'active' && value !== 'Folder') ||
                (Array.isArray(value) && value.length > 0)
              )
            )) && (
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
            disabled={isLoading || (isEditMode && !hasChanges)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditMode ? <Save size={16} /> : <Plus size={16} />}
                {isEditMode 
                  ? (hasChanges ? 'Update Menu' : 'No Changes')
                  : 'Create Menu'
                }
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuCreate;