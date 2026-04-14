import { useState, useEffect, useCallback, useMemo } from 'react'
import FileUpload from '../components/common/FileUpload.jsx'
import DataTable from '../components/common/DataTable.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { getUploadHistory, clearUploadHistory } from '../services/UploadService.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { formatDate, formatNumber } from '../utils/formatters.js'

const DATA_TYPE_OPTIONS = [
  {
    value: 'dsr',
    label: 'DSR Data',
    description: 'Daily Status Report data including domain, program, WR, RAG status, test metrics, and defect counts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
      </svg>
    ),
    color: 'primary',
  },
  {
    value: 'readiness',
    label: 'Release Readiness',
    description: 'Release readiness data including RAG status, pass percentage, defect counts, and confidence index',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'success',
  },
  {
    value: 'defects_showstopper',
    label: 'Showstopper Defects',
    description: 'Critical and showstopper defect data including issue ID, priority, status, aging, and environment',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: 'danger',
  },
  {
    value: 'defects_deferred',
    label: 'Deferred Defects',
    description: 'Deferred defect data including issue ID, priority, status, deferral comments, and aging',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'warning',
  },
  {
    value: 'monthly_snapshot',
    label: 'Monthly Snapshot',
    description: 'Monthly QE delivery snapshot data including test execution, pass rates, defect counts, and release risk',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: 'info',
  },
  {
    value: 'defect_trends',
    label: 'Defect Trends',
    description: 'Application defect trend data including monthly opened, closed, deferred, and net open counts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    color: 'secondary',
  },
  {
    value: 'severity_distribution',
    label: 'Severity Distribution',
    description: 'Monthly defect severity distribution data (Critical, Major, Minor, Trivial)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'primary',
  },
  {
    value: 'env_defects',
    label: 'Environment Defects',
    description: 'Defect data by application and environment (SIT, UAT, Pre-Prod, Performance, Production)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: 'info',
  },
  {
    value: 'rca_data',
    label: 'RCA Data',
    description: 'Root Cause Analysis data including monthly defect categorization by root cause type',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    color: 'warning',
  },
]

const COLOR_CONFIG = {
  primary: {
    iconBg: 'bg-primary-50',
    iconText: 'text-primary-600',
    selectedBorder: 'border-primary-500',
    selectedBg: 'bg-primary-50',
  },
  success: {
    iconBg: 'bg-success-50',
    iconText: 'text-success-700',
    selectedBorder: 'border-success-500',
    selectedBg: 'bg-success-50/30',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconText: 'text-warning-700',
    selectedBorder: 'border-warning-500',
    selectedBg: 'bg-warning-50/30',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconText: 'text-danger-700',
    selectedBorder: 'border-danger-500',
    selectedBg: 'bg-danger-50/30',
  },
  info: {
    iconBg: 'bg-info-50',
    iconText: 'text-info-700',
    selectedBorder: 'border-info-500',
    selectedBg: 'bg-info-50/30',
  },
  secondary: {
    iconBg: 'bg-secondary-50',
    iconText: 'text-secondary-600',
    selectedBorder: 'border-secondary-500',
    selectedBg: 'bg-secondary-50/30',
  },
}

export default function AdminUploadPage() {
  const { hasPermission } = useAuth()
  const [selectedDataType, setSelectedDataType] = useState('dsr')
  const [uploadHistory, setUploadHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const canUpload = useMemo(() => hasPermission('upload_data'), [hasPermission])

  const fetchUploadHistory = useCallback(() => {
    setIsLoadingHistory(true)
    try {
      const history = getUploadHistory()
      setUploadHistory(Array.isArray(history) ? history : [])
    } catch (err) {
      console.error('[AdminUploadPage] Error fetching upload history:', err)
      setUploadHistory([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchUploadHistory()
  }, [fetchUploadHistory])

  const handleDataTypeSelect = useCallback((dataType) => {
    setSelectedDataType(dataType)
  }, [])

  const handleUploadComplete = useCallback(
    (result) => {
      if (result && result.success) {
        fetchUploadHistory()
      } else {
        fetchUploadHistory()
      }
    },
    [fetchUploadHistory]
  )

  const handleClearHistory = useCallback(() => {
    const cleared = clearUploadHistory()
    if (cleared) {
      setUploadHistory([])
    } else {
      console.error('[AdminUploadPage] Failed to clear upload history')
    }
  }, [])

  const selectedOption = useMemo(() => {
    return DATA_TYPE_OPTIONS.find((opt) => opt.value === selectedDataType) || DATA_TYPE_OPTIONS[0]
  }, [selectedDataType])

  const formatFileSize = useCallback((bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B'
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${bytes} B`
  }, [])

  const historyColumns = useMemo(() => {
    return [
      {
        key: 'timestamp',
        label: 'Date',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatDate(value)}</span>
        ),
      },
      {
        key: 'fileName',
        label: 'File Name',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark truncate max-w-[200px] block" title={value}>
            {value || 'N/A'}
          </span>
        ),
      },
      {
        key: 'dataType',
        label: 'Data Type',
        editable: false,
        render: (value) => {
          const option = DATA_TYPE_OPTIONS.find((opt) => opt.value === value)
          const label = option ? option.label : value || 'N/A'
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
              {label}
            </span>
          )
        },
      },
      {
        key: 'fileSize',
        label: 'Size',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-muted">{formatFileSize(value)}</span>
        ),
      },
      {
        key: 'rowsImported',
        label: 'Rows',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        editable: false,
        render: (value) => {
          if (value === 'success') {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5" />
                Success
              </span>
            )
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700">
              <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mr-1.5" />
              Failed
            </span>
          )
        },
      },
      {
        key: 'errorCount',
        label: 'Errors',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-danger-700 font-medium">{formatNumber(num)}</span>
        },
      },
      {
        key: 'warningCount',
        label: 'Warnings',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-warning-700 font-medium">{formatNumber(num)}</span>
        },
      },
    ]
  }, [formatFileSize])

  const historySummary = useMemo(() => {
    if (!uploadHistory || uploadHistory.length === 0) {
      return { total: 0, success: 0, failed: 0, totalRows: 0 }
    }

    let success = 0
    let failed = 0
    let totalRows = 0

    uploadHistory.forEach((entry) => {
      if (entry.status === 'success') {
        success += 1
        totalRows += entry.rowsImported || 0
      } else {
        failed += 1
      }
    })

    return {
      total: uploadHistory.length,
      success,
      failed,
      totalRows,
    }
  }, [uploadHistory])

  if (!canUpload) {
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
            You do not have permission to upload data. Please contact your administrator.
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Data Upload</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Upload DSR, defect, readiness, trend, and other QE data files in CSV or Excel format. Select a data type below and upload your file.
        </p>
      </div>

      {/* Data Type Selector */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Select Data Type</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Choose the type of data you want to upload. The file will be validated against the selected schema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DATA_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedDataType === option.value
            const colorClasses = COLOR_CONFIG[option.color] || COLOR_CONFIG.primary

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDataTypeSelect(option.value)}
                className={`flex items-start gap-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 border-2 ${
                  isSelected
                    ? `${colorClasses.selectedBorder} ${colorClasses.selectedBg} shadow-card`
                    : 'border-transparent bg-enterprise-background hover:bg-enterprise-border hover:border-enterprise-border'
                }`}
                aria-label={`Select data type: ${option.label}`}
                aria-pressed={isSelected}
              >
                <div
                  className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorClasses.iconBg} ${colorClasses.iconText}`}
                  aria-hidden="true"
                >
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-enterprise-dark' : 'text-enterprise-dark'
                      }`}
                    >
                      {option.label}
                    </p>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-primary-600 flex-shrink-0"
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
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-enterprise-muted line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* File Upload Section */}
      <div className="card">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            {(() => {
              const colorClasses = COLOR_CONFIG[selectedOption.color] || COLOR_CONFIG.primary
              return (
                <div
                  className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorClasses.iconBg} ${colorClasses.iconText}`}
                  aria-hidden="true"
                >
                  {selectedOption.icon}
                </div>
              )
            })()}
            <div>
              <h3 className="section-title">Upload {selectedOption.label}</h3>
              <p className="mt-0.5 text-sm text-enterprise-muted">
                {selectedOption.description}
              </p>
            </div>
          </div>
        </div>

        <FileUpload
          onUpload={handleUploadComplete}
          acceptedTypes={['.csv', '.xlsx', '.xls']}
          maxSize={10 * 1024 * 1024}
          dataType={selectedDataType}
        />

        {/* Upload Guidelines */}
        <div className="mt-6 p-4 rounded-lg bg-enterprise-background border border-enterprise-border">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-info-50 text-info-700">
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
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-enterprise-dark">Upload Guidelines</p>
              <ul className="mt-1.5 space-y-1 text-xs text-enterprise-muted">
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-enterprise-muted mt-1.5 flex-shrink-0" />
                  Supported formats: CSV (.csv), Excel (.xlsx, .xls)
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-enterprise-muted mt-1.5 flex-shrink-0" />
                  Maximum file size: 10MB
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-enterprise-muted mt-1.5 flex-shrink-0" />
                  First row must contain column headers matching the expected schema
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-enterprise-muted mt-1.5 flex-shrink-0" />
                  Uploading new data will replace existing data for the selected type
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-enterprise-muted mt-1.5 flex-shrink-0" />
                  Data is validated against the schema before import — errors will be reported
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Upload History</h3>
            <p className="mt-1 text-sm text-enterprise-muted">
              Recent file uploads with status, row counts, and error details
            </p>
          </div>
          {uploadHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn-outline text-xs px-3 py-1.5"
              aria-label="Clear upload history"
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
              Clear History
            </button>
          )}
        </div>

        {/* History Summary Stats */}
        {uploadHistory.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-enterprise-background border border-enterprise-border">
              <p className="text-xs font-medium text-enterprise-muted">Total Uploads</p>
              <p className="mt-1 text-lg font-bold text-enterprise-dark">
                {formatNumber(historySummary.total)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success-50/30 border border-success-500/20">
              <p className="text-xs font-medium text-enterprise-muted">Successful</p>
              <p className="mt-1 text-lg font-bold text-success-700">
                {formatNumber(historySummary.success)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-danger-50/30 border border-danger-500/20">
              <p className="text-xs font-medium text-enterprise-muted">Failed</p>
              <p className="mt-1 text-lg font-bold text-danger-700">
                {formatNumber(historySummary.failed)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50/30 border border-primary-500/20">
              <p className="text-xs font-medium text-enterprise-muted">Total Rows</p>
              <p className="mt-1 text-lg font-bold text-primary-700">
                {formatNumber(historySummary.totalRows)}
              </p>
            </div>
          </div>
        )}

        {/* History Table */}
        {isLoadingHistory ? (
          <LoadingSpinner size="sm" message="Loading upload history..." />
        ) : uploadHistory.length === 0 ? (
          <EmptyState
            title="No Upload History"
            message="No files have been uploaded yet. Select a data type above and upload a file to get started."
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
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            }
          />
        ) : (
          <DataTable
            columns={historyColumns}
            data={uploadHistory}
            pageSize={10}
            sortable={true}
            emptyMessage="No upload history available"
          />
        )}
      </div>
    </div>
  )
}