import { useMemo, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { NAVIGATION_ITEMS } from '../../constants/navigation.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import logo from '../../assets/logo.png'

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

export default function Header() {
  const { currentUser, role, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: 'QE Hub', path: '/' }]

    if (location.pathname === '/') {
      return crumbs
    }

    const segments = location.pathname.split('/').filter(Boolean)

    let currentPath = ''

    segments.forEach((segment) => {
      currentPath += `/${segment}`

      let label = null

      for (const item of NAVIGATION_ITEMS) {
        if (item.path === currentPath) {
          label = item.label
          break
        }

        if (Array.isArray(item.children)) {
          for (const child of item.children) {
            if (child.path === currentPath) {
              label = child.label
              break
            }
          }

          if (!label) {
            const childMatch = item.children.some((child) =>
              child.path && child.path.startsWith(currentPath)
            )
            if (childMatch || (item.children.some((child) => child.path && child.path.startsWith(`/${segment}`)) === false && currentPath === `/${segment}`)) {
              const parentMatch = NAVIGATION_ITEMS.find((nav) =>
                Array.isArray(nav.children) &&
                nav.children.some((c) => c.path && c.path.startsWith(currentPath + '/'))
              )
              if (parentMatch) {
                label = parentMatch.label
              }
            }
          }

          if (label) break
        }
      }

      if (!label) {
        for (const item of NAVIGATION_ITEMS) {
          if (Array.isArray(item.children)) {
            const hasChildUnderPath = item.children.some((child) =>
              child.path && child.path.startsWith(currentPath + '/')
            )
            if (hasChildUnderPath) {
              label = item.label
              break
            }
          }
        }
      }

      if (!label) {
        label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }

      crumbs.push({ label, path: currentPath })
    })

    return crumbs
  }, [location.pathname])

  const roleBadge = useMemo(() => {
    if (!role) return null
    return ROLE_BADGE_CONFIG[role] || null
  }, [role])

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-enterprise-surface border-b border-enterprise-border shadow-card animate-fade-in">
      <div className="flex items-center gap-4 min-w-0">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img
            src={logo}
            alt="QE Hub"
            className="rounded-md"
            style={{ width: '190px', height: '55px', objectFit: 'cover' }}
          />
        </Link>

        {breadcrumbs.length > 1 && (
          <nav className="flex items-center min-w-0" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1

                return (
                  <li key={crumb.path} className="flex items-center gap-1.5 min-w-0">
                    {index > 0 && (
                      <svg
                        className="w-3.5 h-3.5 text-enterprise-muted flex-shrink-0"
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
                    )}
                    {isLast ? (
                      <span
                        className="text-enterprise-dark font-medium truncate max-w-[200px]"
                        aria-current="page"
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="text-enterprise-muted hover:text-primary-600 transition-colors duration-100 truncate max-w-[150px]"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && currentUser && (
          <>
            <div className="flex items-center gap-2.5">
              <div
                className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold"
                aria-hidden="true"
              >
                {currentUser.avatar || currentUser.name?.charAt(0) || '?'}
              </div>
              <div className="hidden md:flex flex-col min-w-0">
                <span className="text-sm font-medium text-enterprise-dark truncate max-w-[150px]">
                  {currentUser.name}
                </span>
                {roleBadge && (
                  <span
                    className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-xxs font-medium ${roleBadge.bg} ${roleBadge.text}`}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>
            </div>

            <div className="w-px h-6 bg-enterprise-border hidden sm:block" aria-hidden="true" />

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 text-enterprise-muted hover:text-enterprise-dark hover:bg-enterprise-background rounded-lg transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="w-px h-6 bg-enterprise-border hidden sm:block" aria-hidden="true" />

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-enterprise-muted hover:text-enterprise-dark hover:bg-enterprise-background rounded-lg transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label="Logout"
            >
              <svg
                className="w-4 h-4"
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
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}