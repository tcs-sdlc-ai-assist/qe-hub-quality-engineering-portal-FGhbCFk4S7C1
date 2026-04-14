import { useState, useEffect, useCallback, useMemo } from 'react'
import DataTable from '../common/DataTable.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getShowstopperDefects } from '../../services/DefectService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatDate, formatNumber, truncateText } from '../../utils/formatters.js'

export default function ShowstopperDefectTable() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getShowstopperDefects(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[ShowstopperDefectTable] Error fetching showstopper defects:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns = useMemo(() => {
    return [
      {
        key: 'issueId',
        label: 'Issue ID',
        editable: false,
        render: (value) => (
          <span className="font-mono text-sm text-primary-700 font-medium">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'summary',
        label: 'Summary',
        editable: false,
        render: (value) => {
          if (!value || String(value).trim() === '') {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const truncated = truncateText(String(value), 80)
          return (
            <span className="text-enterprise-dark" title={String(value)}>
              {truncated}
            </span>
          )
        },
      },
      {
        key: 'priority',
        label: 'Priority',
        editable: false,
        render: (value) => {
          if (!value) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          let colorClasses = 'bg-enterprise-background text-enterprise-muted'
          switch (value) {
            case 'Critical':
              colorClasses = 'bg-danger-50 text-danger-700'
              break
            case 'Major':
              colorClasses = 'bg-warning-50 text-warning-700'
              break
            case 'Minor':
              colorClasses = 'bg-info-50 text-info-700'
              break
            case 'Trivial':
              colorClasses = 'bg-enterprise-background text-enterprise-muted'
              break
            default:
              break
          }
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
              {value}
            </span>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        editable: false,
        render: (value) => {
          if (!value) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          let colorClasses = 'bg-enterprise-background text-enterprise-muted'
          switch (value) {
            case 'Open':
              colorClasses = 'bg-danger-50 text-danger-700'
              break
            case 'In Progress':
              colorClasses = 'bg-warning-50 text-warning-700'
              break
            case 'Closed':
              colorClasses = 'bg-success-50 text-success-700'
              break
            default:
              break
          }
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
              {value}
            </span>
          )
        },
      },
      {
        key: 'release',
        label: 'Release',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'impactedApplication',
        label: 'Impacted Application',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'createdDate',
        label: 'Created Date',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatDate(value)}</span>
        ),
      },
      {
        key: 'aging',
        label: 'Aging',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num > 30) {
            colorClass = 'text-danger-700 font-semibold'
          } else if (num > 14) {
            colorClass = 'text-warning-700 font-medium'
          }
          return (
            <span className={colorClass}>
              {formatNumber(num)} day{num !== 1 ? 's' : ''}
            </span>
          )
        },
      },
      {
        key: 'assignee',
        label: 'Assignee',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'wrNumber',
        label: 'WR#',
        editable: false,
        render: (value) => (
          <span className="font-mono text-sm text-primary-700">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'wrDescription',
        label: 'WR Description',
        editable: false,
        render: (value) => {
          if (!value || String(value).trim() === '') {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const truncated = truncateText(String(value), 60)
          return (
            <span className="text-enterprise-dark" title={String(value)}>
              {truncated}
            </span>
          )
        },
      },
      {
        key: 'environment',
        label: 'Environment',
        editable: false,
        render: (value) => {
          if (!value) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
              {value}
            </span>
          )
        },
      },
    ]
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading showstopper defects..." />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Showstopper Defects"
        message="No showstopper defects found for the selected filters. Try adjusting your filter criteria."
      />
    )
  }

  return (
    <div className="animate-fade-in">
      <DataTable
        columns={columns}
        data={data}
        pageSize={10}
        sortable={true}
        emptyMessage="No showstopper defects available"
      />
    </div>
  )
}