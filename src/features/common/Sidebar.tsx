import React, { useState, useEffect } from 'react';
import logo from '../../images/logo.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getIconComponent } from '../../utils/getIconComponent';
import { Sun, Moon, ChevronDown, ChevronRight } from 'lucide-react';
import { useUser } from "../dashboard/context/DashboardContext";
import './sidebar.css';

const Sidebar = (): React.ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { user } = useUser();

  const getActiveMenuItem = (slug: string): boolean => {
    return location.pathname === slug || location.pathname.startsWith(slug + '/');
  };

  // Check if any submenu is active
  const isParentActive = (item: any): boolean => {
    if (getActiveMenuItem(item.slug)) return true;

    if (item.submenu && Array.isArray(item.submenu)) {
      return item.submenu.some((subItem: any) => getActiveMenuItem(subItem.slug));
    }

    return false;
  };

  // Check if menu item is settings related
  const isSettingsMenu = (item: any): boolean => {
    const settingsKeywords = ['settings', 'setting', 'config', 'configuration', 'preferences'];
    return settingsKeywords.some(keyword =>
      item.name?.toLowerCase().includes(keyword) ||
      item.slug?.toLowerCase().includes(keyword)
    );
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const handleMenuClick = (item: any) => {
    // If it's a settings menu and has a slug, navigate directly
    if (isSettingsMenu(item) && item.slug) {
      navigate(item.slug);
    } else {
      // For non-settings menus with submenus, toggle the menu
      toggleMenu(item.name);
    }
  };

  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    if (user?.role?.menulist && Array.isArray(user.role.menulist)) {
      setMenuItems(user.role.menulist);

      // Auto-expand menus that have active submenus (except settings menus)
      const menusToExpand = new Set<string>();
      user.role.menulist.forEach((item: any) => {
        if (item.submenu && Array.isArray(item.submenu) && !isSettingsMenu(item)) {
          const hasActiveSubmenu = item.submenu.some((subItem: any) =>
            getActiveMenuItem(subItem.slug)
          );
          if (hasActiveSubmenu) {
            menusToExpand.add(item.name);
          }
        }
      });

      setExpandedMenus(prev => {
        return new Set(prev);
      })
    } else {
      setMenuItems([]);
    }
  }, [user?.role?.menulist, location.pathname]);

  const renderMenuItem = (item: any) => {
    const IconComponent = getIconComponent(item.icon);
    const isActive = getActiveMenuItem(item.slug);
    const hasSubmenu = item.submenu && Array.isArray(item.submenu) && item.submenu.length > 0;
    const isExpanded = expandedMenus.has(item.name);
    const isParentActiveMenu = isParentActive(item);
    const isSettings = isSettingsMenu(item);

    return (
      <li key={`${item.name}-${item.slug}`} className="menu-item overflow-x-hidden">
        {hasSubmenu && !isSettings ? (
          <>
            {/* Parent menu with submenu (non-settings) */}
            <div
              className={`menu-link parent-menu ${isParentActiveMenu ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleMenuClick(item);
                }
              }}
            >
              <span className="menu-content">
                <span className="icon" aria-hidden="true">
                  <IconComponent className="w-5 h-5" />
                </span>
                <span className="menu-text">{item.name}</span>
              </span>
              <span className="expand-icon" aria-hidden="true">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            </div>

            {/* Submenu */}
            {isExpanded && (
              <ul className="submenu">
                {item.submenu.map((subItem: any) => {
                  const SubIconComponent = getIconComponent(subItem.icon);
                  const isSubActive = getActiveMenuItem(subItem.slug);

                  return (
                    <li key={`${subItem.name}-${subItem.slug}`} className="submenu-item">
                      <Link
                        to={subItem.slug}
                        className={`menu-link submenu-link ${isSubActive ? 'active' : ''}`}
                        aria-current={isSubActive ? 'page' : undefined}
                      >
                        <span className="icon" aria-hidden="true">
                          <SubIconComponent className="w-4 h-4" />
                        </span>
                        <span className="menu-text">{subItem.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          /* Single menu item or settings menu (always navigate directly) */
          <Link
            to={item.slug}
            className={`menu-link ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="menu-content">
              <span className="icon" aria-hidden="true">
                <IconComponent className="w-5 h-5" />
              </span>
              <span className="menu-text">{item.name}</span>
            </span>
          </Link>
        )}
      </li>
    );
  };

  const newLocal = <nav className="nav" role="navigation">
    <ul className="menu-list">
      {menuItems.map((item) => renderMenuItem(item))}
    </ul>
  </nav>;
  return (
    <div className="sidebar" data-theme={theme}>
      <div className="logo">
        <img
          src={logo}
          alt="Hashtag Biz Logo"
          style={{ width: '90%', height: 'auto' }}
          loading="lazy"
        />
      </div>

      {newLocal}

      {/* <div className="theme-toggle" role="group" aria-label="Theme selection">
        <button
          type="button"
          className={`theme-btn light ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeToggle('light')}
          aria-pressed={theme === 'light'}
          aria-label="Switch to light theme"
        >
          <Sun className="w-4 h-4" aria-hidden="true" />
          <span>Light</span>
        </button>
        <button
          type="button"
          className={`theme-btn dark ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeToggle('dark')}
          aria-pressed={theme === 'dark'}
          aria-label="Switch to dark theme"
        >
          <Moon className="w-4 h-4" aria-hidden="true" />
          <span>Dark</span>
        </button>
      </div> */}
    </div>
  );
};

export default Sidebar;