import { useState, useEffect, useCallback, useMemo } from 'react'
import DataTable from '../components/common/DataTable.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Modal from '../components/common/Modal.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getAuditLog, clearAuditLog } from '../utils/auditLogger.js'
import { initializeData, getItem, setItem } from '../utils/storage.js'
import { formatDate, formatNumber, truncateText } from '../utils/formatters.js'

const EDITABLE_FIELDS_KEY = 'admin_editable_fields'
const CONFLUENCE_LINKS_KEY = 'admin_confluence_links'

const DEFAULT_EDITABLE_FIELDS = [
  { id: 'ragStatus', label: 'RAG Status', entity: 'DSR / Readiness', enabled: true },
  { id: 'releaseConfidenceIndex', label: 'Release Confidence Index', entity: 'Readiness', enabled: true },
  { id: 'comments', label: 'Comments', entity: 'DSR / Readiness', enabled: true },
  { id: 'risks', label: 'Risks', entity: 'DSR', enabled: true },
  { id: 'dependencies', label: 'Dependencies', entity: 'DSR', enabled: true },
  { id: 'sitSignOffDate', label: 'SIT Sign Off Date', entity: 'DSR', enabled: true },
  { id: 'perfSignOffDate', label: 'Perf Sign Off Date', entity: 'DSR', enabled: true },
  { id: 'dastSignOffDate', label: 'DAST Sign Off Date', entity: 'DSR', enabled: true },
  { id: 'performanceTesting', label: 'Performance Testing', entity: 'DSR', enabled: true },
  { id: 'dastTesting', label: 'DAST Testing', entity: 'DSR', enabled: true },
  { id: 'tdmRequestNumber', label: 'TDM Request Number', entity: 'DSR', enabled: true },
  { id: 'deferralComment', label: 'Deferral Comment', entity: 'Defects', enabled: true },
]

const DEFAULT_CONFLUENCE_LINKS = [
  { id: 'quality-management-process', title: 'QE Quality Management Process', path: '/spaces/QE/pages/quality-management-process', enabled: true },
  { id: 'tools-framework-hub', title: 'QE Tools & Framework Hub', path: '/spaces/QE/pages/tools-framework-hub', enabled: true },
  { id: 'defect-triage-guidelines', title: 'Defect Triage Guidelines', path: '/spaces/QE/pages/defect-triage-guidelines', enabled: true },
  { id: 'environment-onboarding', title: 'Environment Onboarding Guide', path: '/spaces/QE/pages/environment-onboarding', enabled: true },
  { id: 'release-calendar', title: 'Release Calendar & Milestones', path: '/spaces/QE/pages/release-calendar', enabled: true },
  { id: 'test-metrics-glossary', title: 'Test Metrics & KPI Glossary', path: '/spaces/QE/pages/test-metrics-glossary', enabled: true },
]

const TABS = [
  { id: 'editable-fields', label: 'Editable Fields' },
  { id: 'confluence-links', label: 'Confluence Links' },
  { id: 'audit-log', label: 'Audit Log' },
  { id: 'data-management', label: 'Data Management' },
]

export default function AdminSettingsPage() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('editable-fields')
  const [editableFields, setEditableFields] = useState([])
  const [confluenceLinks, setConfluenceLinks] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isClearAuditModalOpen, setIsClearAuditModalOpen] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [clearAuditSuccess, setClearAuditSuccess] = useState(false)

  const canManage = useMemo(() => hasPermission('manage_dashboards'), [hasPermission])

  const fetchData = useCallback(() => {
    setIsLoading(true)
    try {
      const storedFields = getItem(EDITABLE_FIELDS_KEY, null)
      if (storedFields && Array.isArray(storedFields)) {
        setEditableFields(storedFields)
      } else {
        setEditableFields([...DEFAULT_EDITABLE_FIELDS])
        setItem(EDITABLE_FIELDS_KEY, DEFAULT_EDITABLE_FIELDS)
      }

      const storedLinks = getItem(CONFLUENCE_LINKS_KEY, null)
      if (storedLinks && Array.isArray(storedLinks)) {
        setConfluenceLinks(storedLinks)
      } else {
        setConfluenceLinks([...DEFAULT_CONFLUENCE_LINKS])
        setItem(CONFLUENCE_LINKS_KEY, DEFAULT_CONFLUENCE_LINKS)
      }

      const entries = getAuditLog({})
      setAuditLog(Array.isArray(entries) ? entries : [])
    } catch (err) {
      console.error('[AdminSettingsPage] Error fetching data:', err)
      setEditableFields([...DEFAULT_EDITABLE_FIELDS])
      setConfluenceLinks([...DEFAULT_CONFLUENCE_LINKS])
      setAuditLog([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleToggleField = useCallback(
    (fieldId) => {
      if (!canManage) return

      setEditableFields((prev) => {
        const updated = prev.map((field) =>
          field.id === fieldId ? { ...field, enabled: !field.enabled } : field
        )
        setItem(EDITABLE_FIELDS_KEY, updated)
        return updated
      })
    },
    [canManage]
  )

  const handleToggleLink = useCallback(
    (linkId) => {
      if (!canManage) return

      setConfluenceLinks((prev) => {
        const updated = prev.map((link) =>
          link.id === linkId ? { ...link, enabled: !link.enabled } : link
        )
        setItem(CONFLUENCE_LINKS_KEY, updated)
        return updated
      })
    },
    [canManage]
  )

  const handleResetData = useCallback(() => {
    if (!canManage) return

    try {
      initializeData(true)
      setItem(EDITABLE_FIELDS_KEY, DEFAULT_EDITABLE_FIELDS)
      setItem(CONFLUENCE_LINKS_KEY, DEFAULT_CONFLUENCE_LINKS)
      setEditableFields([...DEFAULT_EDITABLE_FIELDS])
      setConfluenceLinks([...DEFAULT_CONFLUENCE_LINKS])
      setResetSuccess(true)
      setIsResetModalOpen(false)

      setTimeout(() => {
        setResetSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('[AdminSettingsPage] Error resetting data:', err)
    }
  }, [canManage])

  const handleClearAuditLog = useCallback(() => {
    if (!canManage) return

    try {
      clearAuditLog()
      setAuditLog([])
      setClearAuditSuccess(true)
      setIsClearAuditModalOpen(false)

      setTimeout(() => {
        setClearAuditSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('[AdminSettingsPage] Error clearing audit log:', err)
    }
  }, [canManage])

  const handleRefreshAuditLog = useCallback(() => {
    const entries = getAuditLog({})
    setAuditLog(Array.isArray(entries) ? entries : [])
  }, [])

  const enabledFieldsCount = useMemo(() => {
    return editableFields.filter((f) => f.enabled).length
  }, [editableFields])

  const enabledLinksCount = useMemo(() => {
    return confluenceLinks.filter((l) => l.enabled).length
  }, [confluenceLinks])

  const formatFieldDisplay = useCallback((fieldName) => {
    if (!fieldName) return 'Unknown'
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }, [])

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

  const auditLogColumns = useMemo(() => {
    return [
      {
        key: 'timestamp',
        label: 'Timestamp',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark text-xs">{formatDate(value)}</span>
        ),
      },
      {
        key: 'userId',
        label: 'User',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'entityType',
        label: 'Entity',
        editable: false,
        render: (value) => {
          if (!value) return <span className="text-enterprise-muted">N/A</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
              {value}
            </span>
          )
        },
      },
      {
        key: 'entityId',
        label: 'Entity ID',
        editable: false,
        render: (value) => {
          if (!value) return <span className="text-enterprise-muted">N/A</span>
          const truncated = truncateText(String(value), 40)
          return (
            <span className="font-mono text-xs text-enterprise-dark" title={String(value)}>
              {truncated}
            </span>
          )
        },
      },
      {
        key: 'fieldName',
        label: 'Field',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{formatFieldDisplay(value)}</span>
        ),
      },
      {
        key: 'oldValue',
        label: 'Old Value',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const truncated = truncateText(String(value), 30)
          return (
            <span className="text-enterprise-muted line-through text-xs" title={String(value)}>
              {truncated}
            </span>
          )
        },
      },
      {
        key: 'newValue',
        label: 'New Value',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const truncated = truncateText(String(value), 30)
          return (
            <span className="text-success-700 font-medium text-xs" title={String(value)}>
              {truncated}
            </span>
          )
        },
      },
    ]
  }, [formatFieldDisplay])

  const auditLogSummary = useMemo(() => {
    if (!auditLog || auditLog.length === 0) {
      return { total: 0, uniqueUsers: 0, uniqueEntities: 0, latestTimestamp: null }
    }

    const userSet = new Set()
    const entitySet = new Set()

    auditLog.forEach((entry) => {
      if (entry.userId) userSet.add(entry.userId)
      if (entry.entityType) entitySet.add(entry.entityType)
    })

    return {
      total: auditLog.length,
      uniqueUsers: userSet.size,
      uniqueEntities: entitySet.size,
      latestTimestamp: auditLog.length > 0 ? auditLog[0].timestamp : null,
    }
  }, [auditLog])

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-16 px-4 animate-fade-in">
        <div className="card max-w-md w-full text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-50 text-danger-700 mx-auto mb-4">
            <svg
              className="w-6 h-6"
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-enterprise-dark mb-1">
            Access Denied
          </h2>
          <p className="text-sm text-enterprise-muted mb-6">
            You do not have permission to access admin settings. Please contact your administrator.
          </p>
          <a
            href="/"
            className="btn-outline inline-flex"
            aria-label="Return to home page"
          >
            <svg
              className="w-4 h-4 mr-1.5"
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
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            Return Home
          </a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading admin settings..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Admin Settings</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Configure editable fields, manage Confluence links, view the audit log, and reset mock data
        </p>
      </div>

      {/* Success Banners */}
      {resetSuccess && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-success-50 border border-success-500/20 animate-fade-in">
          <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-success-50 text-success-700">
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
                strokeWidth={2}
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-success-700">
              Mock data has been reset successfully
            </p>
            <p className="mt-0.5 text-xs text-enterprise-muted">
              All data has been restored to the default mock values.
            </p>
          </div>
        </div>
      )}

      {clearAuditSuccess && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-success-50 border border-success-500/20 animate-fade-in">
          <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-success-50 text-success-700">
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
                strokeWidth={2}
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-success-700">
              Audit log has been cleared successfully
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-enterprise-border pb-4 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-card'
                  : 'bg-enterprise-background text-enterprise-dark hover:bg-enterprise-border border border-enterprise-border'
              }`}
              aria-label={`Switch to ${tab.label} tab`}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
              {tab.id === 'audit-log' && auditLog.length > 0 && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-700'
                }`}>
                  {formatNumber(auditLog.length)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Editable Fields Tab */}
        {activeTab === 'editable-fields' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h3 className="section-title">Editable Fields Configuration</h3>
              <p className="mt-1 text-sm text-enterprise-muted">
                Enable or disable editable fields across DSR, Readiness, and Defect views. Disabled fields will be read-only for all users.
              </p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-enterprise-background border border-enterprise-border">
                <p className="text-xs font-medium text-enterprise-muted">Total Fields</p>
                <p className="mt-1 text-lg font-bold text-enterprise-dark">
                  {formatNumber(editableFields.length)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success-50/30 border border-success-500/20">
                <p className="text-xs font-medium text-enterprise-muted">Enabled</p>
                <p className="mt-1 text-lg font-bold text-success-700">
                  {formatNumber(enabledFieldsCount)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-danger-50/30 border border-danger-500/20">
                <p className="text-xs font-medium text-enterprise-muted">Disabled</p>
                <p className="mt-1 text-lg font-bold text-danger-700">
                  {formatNumber(editableFields.length - enabledFieldsCount)}
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="w-full min-w-full divide-y divide-enterprise-border">
                <thead>
                  <tr>
                    <th className="table-header">Field</th>
                    <th className="table-header">Entity</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enterprise-border bg-enterprise-surface">
                  {editableFields.map((field) => (
                    <tr key={field.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-medium text-enterprise-dark">{field.label}</span>
                        <p className="text-xs text-enterprise-muted font-mono mt-0.5">{field.id}</p>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
                          {field.entity}
                        </span>
                      </td>
                      <td className="table-cell">
                        {field.enabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mr-1.5" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          onClick={() => handleToggleField(field.id)}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                            field.enabled
                              ? 'text-danger-700 bg-danger-50 hover:bg-danger-50/80'
                              : 'text-success-700 bg-success-50 hover:bg-success-50/80'
                          }`}
                          aria-label={field.enabled ? `Disable ${field.label}` : `Enable ${field.label}`}
                        >
                          {field.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confluence Links Tab */}
        {activeTab === 'confluence-links' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h3 className="section-title">Confluence Links Management</h3>
              <p className="mt-1 text-sm text-enterprise-muted">
                Enable or disable Confluence resource links displayed on the Resources page. Disabled links will be hidden from all users.
              </p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-enterprise-background border border-enterprise-border">
                <p className="text-xs font-medium text-enterprise-muted">Total Links</p>
                <p className="mt-1 text-lg font-bold text-enterprise-dark">
                  {formatNumber(confluenceLinks.length)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success-50/30 border border-success-500/20">
                <p className="text-xs font-medium text-enterprise-muted">Visible</p>
                <p className="mt-1 text-lg font-bold text-success-700">
                  {formatNumber(enabledLinksCount)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-danger-50/30 border border-danger-500/20">
                <p className="text-xs font-medium text-enterprise-muted">Hidden</p>
                <p className="mt-1 text-lg font-bold text-danger-700">
                  {formatNumber(confluenceLinks.length - enabledLinksCount)}
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="w-full min-w-full divide-y divide-enterprise-border">
                <thead>
                  <tr>
                    <th className="table-header">Title</th>
                    <th className="table-header">Path</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enterprise-border bg-enterprise-surface">
                  {confluenceLinks.map((link) => (
                    <tr key={link.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-medium text-enterprise-dark">{link.title}</span>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-enterprise-muted">{link.path}</span>
                      </td>
                      <td className="table-cell">
                        {link.enabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5" />
                            Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mr-1.5" />
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          onClick={() => handleToggleLink(link.id)}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                            link.enabled
                              ? 'text-danger-700 bg-danger-50 hover:bg-danger-50/80'
                              : 'text-success-700 bg-success-50 hover:bg-success-50/80'
                          }`}
                          aria-label={link.enabled ? `Hide ${link.title}` : `Show ${link.title}`}
                        >
                          {link.enabled ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit-log' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-title">Audit Log</h3>
                <p className="mt-1 text-sm text-enterprise-muted">
                  Track all field edits across the portal with user, timestamp, entity, and value change details
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshAuditLog}
                  className="btn-outline text-xs px-3 py-1.5"
                  aria-label="Refresh audit log"
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1.5"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
                {auditLog.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsClearAuditModalOpen(true)}
                    className="btn-outline text-xs px-3 py-1.5 text-danger-700 border-danger-500/30 hover:bg-danger-50"
                    aria-label="Clear audit log"
                  >
                    <svg
                      className="w-3.5 h-3.5 mr-1.5"
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
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                    Clear Log
                  </button>
                )}
              </div>
            </div>

            {/* Audit Log Summary */}
            {auditLog.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-enterprise-background border border-enterprise-border">
                  <p className="text-xs font-medium text-enterprise-muted">Total Entries</p>
                  <p className="mt-1 text-lg font-bold text-enterprise-dark">
                    {formatNumber(auditLogSummary.total)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary-50/30 border border-primary-500/20">
                  <p className="text-xs font-medium text-enterprise-muted">Unique Users</p>
                  <p className="mt-1 text-lg font-bold text-primary-700">
                    {formatNumber(auditLogSummary.uniqueUsers)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-info-50/30 border border-info-500/20">
                  <p className="text-xs font-medium text-enterprise-muted">Entity Types</p>
                  <p className="mt-1 text-lg font-bold text-info-700">
                    {formatNumber(auditLogSummary.uniqueEntities)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning-50/30 border border-warning-500/20">
                  <p className="text-xs font-medium text-enterprise-muted">Latest Edit</p>
                  <p className="mt-1 text-sm font-bold text-warning-700">
                    {formatActivityTimestamp(auditLogSummary.latestTimestamp)}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Log Table */}
            {auditLog.length === 0 ? (
              <EmptyState
                title="No Audit Log Entries"
                message="No edits have been recorded yet. Field edits across DSR, Readiness, and Defect views will appear here."
                icon={
                  <svg
                    className="w-12 h-12 text-enterprise-muted opacity-40"
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
                }
              />
            ) : (
              <DataTable
                columns={auditLogColumns}
                data={auditLog}
                pageSize={10}
                sortable={true}
                emptyMessage="No audit log entries available"
              />
            )}
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data-management' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h3 className="section-title">Data Management</h3>
              <p className="mt-1 text-sm text-enterprise-muted">
                Reset all portal data to default mock values. This will overwrite any edits, uploads, and configuration changes.
              </p>
            </div>

            <div className="space-y-6">
              {/* Reset Mock Data */}
              <div className="p-6 rounded-xl border-2 border-dashed border-danger-500/30 bg-danger-50/10">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-danger-50 text-danger-700">
                    <svg
                      className="w-6 h-6"
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
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-enterprise-dark">
                      Reset All Data to Defaults
                    </h4>
                    <p className="mt-1 text-sm text-enterprise-muted">
                      This action will reset all portal data including DSR records, readiness data, showstopper defects,
                      deferred defects, monthly snapshots, defect trends, severity distribution, environment defects,
                      RCA data, editable field configuration, and Confluence link settings back to their default mock values.
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-enterprise-muted">
                      <li className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                        All user edits (RAG status, comments, dates, etc.) will be lost
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                        All uploaded data will be replaced with mock data
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                        Field and link configurations will be reset to defaults
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0" />
                        Audit log and upload history will NOT be affected
                      </li>
                    </ul>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="btn-danger"
                        aria-label="Reset all data to defaults"
                      >
                        <svg
                          className="w-4 h-4 mr-1.5"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Reset All Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Info */}
              <div className="p-6 rounded-xl bg-enterprise-background border border-enterprise-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-info-50 text-info-700">
                    <svg
                      className="w-6 h-6"
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
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-enterprise-dark">
                      Storage Information
                    </h4>
                    <p className="mt-1 text-sm text-enterprise-muted">
                      All portal data is stored in your browser&apos;s localStorage. Data persists across page refreshes
                      but is specific to this browser and device. Clearing browser data will remove all portal data.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        localStorage
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
                        Browser-specific
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                        Persists on refresh
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Data Reset"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-danger-50 border border-danger-500/20">
            <svg
              className="w-5 h-5 text-danger-700 flex-shrink-0 mt-0.5"
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-danger-700">
                This action cannot be undone
              </p>
              <p className="mt-1 text-sm text-enterprise-muted">
                All DSR data, readiness data, defect data, trend data, and configuration settings will be
                replaced with the default mock values. Any edits or uploads will be permanently lost.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="btn-outline"
              aria-label="Cancel reset"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetData}
              className="btn-danger"
              aria-label="Confirm reset all data"
            >
              <svg
                className="w-4 h-4 mr-1.5"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset All Data
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear Audit Log Confirmation Modal */}
      <Modal
        isOpen={isClearAuditModalOpen}
        onClose={() => setIsClearAuditModalOpen(false)}
        title="Clear Audit Log"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning-50 border border-warning-500/20">
            <svg
              className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5"
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warning-700">
                Are you sure you want to clear the audit log?
              </p>
              <p className="mt-1 text-sm text-enterprise-muted">
                All {formatNumber(auditLog.length)} audit log entries will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsClearAuditModalOpen(false)}
              className="btn-outline"
              aria-label="Cancel clear audit log"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAuditLog}
              className="btn-danger"
              aria-label="Confirm clear audit log"
            >
              <svg
                className="w-4 h-4 mr-1.5"
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Clear Log
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}