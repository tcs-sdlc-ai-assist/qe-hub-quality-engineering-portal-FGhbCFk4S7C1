import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/common/StatCard.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useFilters } from '../contexts/FilterContext.jsx'
import { getQualityMetrics } from '../services/DashboardService.js'
import { getAuditLog } from '../utils/auditLogger.js'
import { formatNumber, formatPercentage, formatDate } from '../utils/formatters.js'
import { NAVIGATION_ITEMS } from '../constants/navigation.js'

const QUICK_LINKS = [
  {
    label: 'Release Readiness',
    path: '/execution/release-readiness',
    description: 'View release readiness status across all programs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'success',
  },
  {
    label: 'Showstopper Defects',
    path: '/execution/showstopper-defects',
    description: 'Track critical and showstopper defects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: 'danger',
  },
  {
    label: 'Quality Metrics',
    path: '/quality-metrics',
    description: 'Overall quality engineering metrics and KPIs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'primary',
  },
  {
    label: 'Defect Trends',
    path: '/trends/defect-trends',
    description: 'Monthly defect trends by application',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    color: 'warning',
  },
  {
    label: 'Domain DSR',
    path: '/execution/domain-dsr',
    description: 'Domain-wise daily status report',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
      </svg>
    ),
    color: 'info',
  },
  {
    label: 'Program Drilldown',
    path: '/execution/program-drilldown',
    description: 'Detailed program-level status and charts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    color: 'secondary',
  },
]

const ADMIN_SHORTCUTS = [
  {
    label: 'Upload Data',
    path: '/admin/upload',
    description: 'Upload DSR, defect, or readiness data files',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    description: 'Manage portal configuration and preferences',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const COLOR_CONFIG = {
  primary: {
    iconBg: 'bg-primary-50',
    iconText: 'text-primary-600',
    hoverBorder: 'hover:border-primary-300',
  },
  success: {
    iconBg: 'bg-success-50',
    iconText: 'text-success-700',
    hoverBorder: 'hover:border-success-500/30',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconText: 'text-warning-700',
    hoverBorder: 'hover:border-warning-500/30',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconText: 'text-danger-700',
    hoverBorder: 'hover:border-danger-500/30',
  },
  info: {
    iconBg: 'bg-info-50',
    iconText: 'text-info-700',
    hoverBorder: 'hover:border-info-500/30',
  },
  secondary: {
    iconBg: 'bg-secondary-50',
    iconText: 'text-secondary-600',
    hoverBorder: 'hover:border-secondary-500/30',
  },
}

export default function WelcomePage() {
  const { currentUser, role, hasPermission } = useAuth()
  const { filters } = useFilters()
  const [metrics, setMetrics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = useMemo(() => role === 'ADMIN', [role])
  const canUpload = useMemo(() => hasPermission('upload_data'), [hasPermission])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getQualityMetrics(filters)
      setMetrics(result)

      const auditEntries = getAuditLog({})
      setRecentActivity(Array.isArray(auditEntries) ? auditEntries.slice(0, 8) : [])
    } catch (err) {
      console.error('[WelcomePage] Error fetching data:', err)
      setMetrics(null)
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const userName = useMemo(() => {
    if (!currentUser) return 'User'
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User'
    return firstName
  }, [currentUser])

  const roleLabel = useMemo(() => {
    if (!role) return ''
    switch (role) {
      case 'ADMIN':
        return 'Admin'
      case 'TEST_LEAD':
        return 'Test Lead'
      case 'VIEW_ONLY':
        return 'View Only'
      default:
        return role
    }
  }, [role])

  const roleBadgeClasses = useMemo(() => {
    switch (role) {
      case 'ADMIN':
        return 'bg-danger-50 text-danger-700'
      case 'TEST_LEAD':
        return 'bg-warning-50 text-warning-700'
      case 'VIEW_ONLY':
        return 'bg-info-50 text-info-700'
      default:
        return 'bg-enterprise-background text-enterprise-muted'
    }
  }, [role])

  const formatActivityTimestamp = useCallback((timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'N/A'
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return formatDate(timestamp)
    } catch {
      return 'N/A'
    }
  }, [])

  const formatFieldDisplay = useCallback((fieldName) => {
    if (!fieldName) return 'Unknown'
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading dashboard..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white">
              <svg
                className="w-7 h-7"
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
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-enterprise-dark">
                {greeting}, {userName}!
              </h1>
              <p className="mt-1 text-sm text-enterprise-muted">
                Welcome to the QE Hub Portal — your central quality engineering dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5">
                <div
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold"
                  aria-hidden="true"
                >
                  {currentUser.avatar || currentUser.name?.charAt(0) || '?'}
                </div>
                <div className="hidden sm:flex flex-col min-w-0">
                  <span className="text-sm font-medium text-enterprise-dark truncate max-w-[150px]">
                    {currentUser.name}
                  </span>
                  <span
                    className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-xxs font-medium ${roleBadgeClasses}`}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {metrics && metrics.totalPrograms > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Programs"
            value={formatNumber(metrics.totalPrograms)}
            color="primary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            }
          />
          <StatCard
            title="Pass Rate"
            value={formatPercentage(metrics.passRate)}
            color={metrics.passRate >= 90 ? 'success' : metrics.passRate >= 75 ? 'warning' : 'danger'}
            trend={metrics.passRate >= 90 ? 'up' : metrics.passRate >= 75 ? 'neutral' : 'down'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Open Defects"
            value={formatNumber(metrics.defectsOpen)}
            color={metrics.defectsOpen <= 5 ? 'success' : metrics.defectsOpen <= 15 ? 'warning' : 'danger'}
            trend={metrics.defectsOpen <= 5 ? 'up' : metrics.defectsOpen <= 15 ? 'neutral' : 'down'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
          <StatCard
            title="Showstoppers"
            value={formatNumber(metrics.showstopperCount)}
            color={metrics.showstopperCount === 0 ? 'success' : metrics.showstopperCount <= 5 ? 'warning' : 'danger'}
            trend={metrics.showstopperCount === 0 ? 'up' : metrics.showstopperCount <= 5 ? 'neutral' : 'down'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
        </div>
      )}

      {/* RAG Summary Banner */}
      {metrics && metrics.ragSummary && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="section-title">RAG Status Overview</h3>
              <p className="mt-1 text-sm text-enterprise-muted">
                Current status distribution across all programs
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-success-50 text-success-700">
                <span className="w-2 h-2 rounded-full bg-success-500 mr-2" />
                Green: {formatNumber(metrics.ragSummary.Green || 0)}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-warning-50 text-warning-700">
                <span className="w-2 h-2 rounded-full bg-warning-500 mr-2" />
                Amber: {formatNumber(metrics.ragSummary.Yellow || 0)}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-danger-50 text-danger-700">
                <span className="w-2 h-2 rounded-full bg-danger-500 mr-2" />
                Red: {formatNumber(metrics.ragSummary.Red || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <div className="mb-4">
          <h2 className="section-title">Quick Links</h2>
          <p className="mt-1 text-sm text-enterprise-muted">
            Jump to key dashboards and reports
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const colorClasses = COLOR_CONFIG[link.color] || COLOR_CONFIG.primary

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`card flex items-start gap-4 border border-transparent ${colorClasses.hoverBorder} transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`}
                aria-label={link.label}
              >
                <div
                  className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorClasses.iconBg} ${colorClasses.iconText}`}
                  aria-hidden="true"
                >
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-enterprise-dark">
                    {link.label}
                  </p>
                  <p className="mt-0.5 text-xs text-enterprise-muted">
                    {link.description}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-enterprise-muted flex-shrink-0 mt-1"
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
              </Link>
            )
          })}
        </div>
      </div>

      {/* Admin Shortcuts */}
      {isAdmin && (
        <div>
          <div className="mb-4">
            <h2 className="section-title">Admin Shortcuts</h2>
            <p className="mt-1 text-sm text-enterprise-muted">
              Quick access to admin tools and configuration
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADMIN_SHORTCUTS.map((shortcut) => (
              <Link
                key={shortcut.path}
                to={shortcut.path}
                className="card flex items-start gap-4 border border-transparent hover:border-primary-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label={shortcut.label}
              >
                <div
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-danger-50 text-danger-700"
                  aria-hidden="true"
                >
                  {shortcut.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-enterprise-dark">
                    {shortcut.label}
                  </p>
                  <p className="mt-0.5 text-xs text-enterprise-muted">
                    {shortcut.description}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-enterprise-muted flex-shrink-0 mt-1"
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
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Test Lead Shortcuts */}
      {!isAdmin && canUpload && (
        <div>
          <div className="mb-4">
            <h2 className="section-title">Your Tools</h2>
            <p className="mt-1 text-sm text-enterprise-muted">
              Quick access to tools available for your role
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/upload"
              className="card flex items-start gap-4 border border-transparent hover:border-primary-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label="Upload Data"
            >
              <div
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warning-50 text-warning-700"
                aria-hidden="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-enterprise-dark">
                  Upload Data
                </p>
                <p className="mt-0.5 text-xs text-enterprise-muted">
                  Upload DSR, defect, or readiness data files
                </p>
              </div>
              <svg
                className="w-4 h-4 text-enterprise-muted flex-shrink-0 mt-1"
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
            </Link>
            <Link
              to="/execution/deferred-defects"
              className="card flex items-start gap-4 border border-transparent hover:border-primary-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label="Deferred Defects"
            >
              <div
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-info-50 text-info-700"
                aria-hidden="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-enterprise-dark">
                  Deferred Defects
                </p>
                <p className="mt-0.5 text-xs text-enterprise-muted">
                  Review and update deferred defect comments
                </p>
              </div>
              <svg
                className="w-4 h-4 text-enterprise-muted flex-shrink-0 mt-1"
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
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Recent Activity</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Latest edits and updates across the portal
          </p>
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-enterprise-muted">
            <svg
              className="w-10 h-10 opacity-40 mb-3"
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
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs mt-1">Edits and updates will appear here</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-enterprise-border">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600">
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
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-enterprise-dark">
                    <span className="font-medium">{formatFieldDisplay(entry.fieldName)}</span>
                    {' updated on '}
                    <span className="font-mono text-xs text-primary-700">{entry.entityType}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.oldValue !== null && entry.oldValue !== undefined && (
                      <span className="text-xs text-enterprise-muted line-through">
                        {String(entry.oldValue).length > 30
                          ? `${String(entry.oldValue).slice(0, 30)}…`
                          : String(entry.oldValue)}
                      </span>
                    )}
                    {entry.oldValue !== null && entry.oldValue !== undefined && (
                      <svg
                        className="w-3 h-3 text-enterprise-muted flex-shrink-0"
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
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    )}
                    {entry.newValue !== null && entry.newValue !== undefined && (
                      <span className="text-xs font-medium text-success-700">
                        {String(entry.newValue).length > 30
                          ? `${String(entry.newValue).slice(0, 30)}…`
                          : String(entry.newValue)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs text-enterprise-muted whitespace-nowrap">
                    {formatActivityTimestamp(entry.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Metrics Row */}
      {metrics && metrics.totalPrograms > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Avg Coverage"
            value={formatPercentage(metrics.avgTestCoverage)}
            color={metrics.avgTestCoverage >= 90 ? 'success' : metrics.avgTestCoverage >= 75 ? 'warning' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />
          <StatCard
            title="Avg Execution"
            value={formatPercentage(metrics.avgExecutionPct)}
            color={metrics.avgExecutionPct >= 90 ? 'success' : metrics.avgExecutionPct >= 75 ? 'warning' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
          <StatCard
            title="On Track"
            value={formatNumber(metrics.programsOnTrack)}
            color="success"
            subtitle={`of ${formatNumber(metrics.totalPrograms)} programs`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Deferred"
            value={formatNumber(metrics.deferredCount)}
            color="secondary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center py-4">
        <p className="text-xs text-enterprise-muted">
          QE Hub Portal — Quality Engineering Hub • Data refreshed from local storage
        </p>
      </div>
    </div>
  )
}