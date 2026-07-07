import { useState, useCallback, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAVIGATION_ITEMS } from '../../constants/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

const ROLE_BADGE_CONFIG = {
  ADMIN: {
    label: 'Admin',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
  },
  TEST_LEAD: {
    label: 'Test Lead',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
  },
  VIEW_ONLY: {
    label: 'View Only',
    bg: 'bg-info-50',
    text: 'text-info-700',
  },
}

export default function Sidebar({ isCollapsed = false, onToggleCollapse }) {
  const { currentUser, role } = useAuth()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpand = useCallback((itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }, [])

  const isPathActive = useCallback(
    (path) => {
      if (!path) return false
      if (path === '/') return location.pathname === '/'
      return location.pathname.startsWith(path)
    },
    [location.pathname]
  )

  const isParentActive = useCallback(
    (item) => {
      if (!item.children || !Array.isArray(item.children)) return false
      return item.children.some((child) => isPathActive(child.path))
    },
    [isPathActive]
  )

  const visibleNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter((item) => {
      if (item.requiredRole && item.requiredRole === 'ADMIN' && role !== 'ADMIN') {
        return false
      }
      return true
    })
  }, [role])

  const roleBadge = useMemo(() => {
    if (!role) return null
    return ROLE_BADGE_CONFIG[role] || null
  }, [role])

  const renderIcon = useCallback((iconName) => {
    switch (iconName) {
      case 'HomeIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        )
      case 'ChartBarIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        )
      case 'ClipboardDocumentCheckIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
            />
          </svg>
        )
      case 'ArrowTrendingUpIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
        )
      case 'WindowIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z"
            />
          </svg>
        )
      case 'BookOpenIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        )
      case 'Cog6ToothIcon':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )
    }
  }, [])

  const renderNavItem = useCallback(
    (item) => {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0
      const isExpanded = expandedItems[item.id] || isParentActive(item)
      const parentActive = isParentActive(item)

      if (hasChildren) {
        return (
          <li key={item.id} className="animate-fade-in">
            <button
              type="button"
              onClick={() => toggleExpand(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${parentActive
                ? 'text-primary-700 bg-primary-50'
                : 'text-enterprise-dark hover:bg-enterprise-background'
                }`}
              aria-expanded={isExpanded}
              aria-label={`${item.label} menu`}
            >
              <span
                className={`flex-shrink-0 ${parentActive ? 'text-primary-600' : 'text-enterprise-muted'
                  }`}
              >
                {renderIcon(item.icon)}
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 text-enterprise-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>

            {isExpanded && !isCollapsed && (
              <ul className="mt-1 ml-4 pl-4 border-l border-enterprise-border space-y-0.5 animate-fade-in">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <NavLink
                      to={child.path}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-sm transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${isActive
                          ? 'text-primary-700 bg-primary-50 font-medium'
                          : 'text-enterprise-muted hover:text-enterprise-dark hover:bg-enterprise-background'
                        }`
                      }
                      aria-label={child.label}
                    >
                      {child.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      }

      return (
        <li key={item.id} className="animate-fade-in">
          <NavLink
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${isActive
                ? 'text-primary-700 bg-primary-50'
                : 'text-enterprise-dark hover:bg-enterprise-background'
              }`
            }
            aria-label={item.label}
          >
            <span className="flex-shrink-0">
              {renderIcon(item.icon)}
            </span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        </li>
      )
    },
    [expandedItems, isCollapsed, isParentActive, renderIcon, toggleExpand]
  )

  const sidebarClasses = useMemo(() => {
    const base =
      'flex flex-col h-full bg-enterprise-surface border-r border-enterprise-border shadow-sidebar transition-all duration-200 overflow-hidden'
    if (isCollapsed) {
      return `${base} w-18`
    }
    return `${base} w-72`
  }, [isCollapsed])

  return (
    <aside className={sidebarClasses} aria-label="Sidebar navigation">
      <div className={`flex items-center px-4 py-4 border-b border-enterprise-border ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <span
            className="font-semibold uppercase tracking-wider text-enterprise-muted truncate mr-2"
            style={{ fontSize: '0.85rem' }}
          >
            Quality Engineering Hub
          </span>
        )}

        {typeof onToggleCollapse === 'function' && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-enterprise-muted hover:text-enterprise-dark hover:bg-enterprise-background transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${isCollapsed ? 'mx-auto' : ''
              }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        <ul className="space-y-1" role="list">
          {visibleNavItems.map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {currentUser && (
        <div className="border-t border-enterprise-border px-4 py-4">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div
              className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold"
              aria-hidden="true"
            >
              {currentUser.avatar || currentUser.name?.charAt(0) || '?'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-enterprise-dark truncate">
                  {currentUser.name}
                </p>
                {roleBadge && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-medium mt-0.5 ${roleBadge.bg} ${roleBadge.text}`}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}