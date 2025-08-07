import React, { useState, useEffect } from 'react';
import logo from '../../images/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { getIconComponent } from '../../utils/getIconComponent';
import { Sun, Moon, ChevronDown, ChevronRight } from 'lucide-react';
import { useUser } from "../dashboard/context/DashboardContext";
import './sidebar.css'; 

const Sidebar = (): React.ReactElement => {
  const location = useLocation();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
      // console.log("Loading menu items:", user.role.menulist);
      setMenuItems(user.role.menulist);
      
      // Auto-expand menus that have active submenus
      const menusToExpand = new Set<string>();
      user.role.menulist.forEach((item: any) => {
        if (item.submenu && Array.isArray(item.submenu)) {
          const hasActiveSubmenu = item.submenu.some((subItem: any) => 
            getActiveMenuItem(subItem.slug)
          );
          if (hasActiveSubmenu) {
            menusToExpand.add(item.name);
          }
        }
      });
      //setExpandedMenus(menusToExpand);
      setExpandedMenus(prev => {
        //console.log("prev===",prev);
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
    // {console.log("item===",item)}
    return (
      
      <li key={`${item.name}-${item.slug}`} className="menu-item">
        {hasSubmenu ? (
          <>
            {/* Parent menu with submenu */}
            <div 
              className={`menu-link parent-menu ${isParentActiveMenu ? 'active' : ''}`}
              onClick={() => toggleMenu(item.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleMenu(item.name);
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

      <nav className="nav" role="navigation">
        <ul className="menu-list">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </nav>

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