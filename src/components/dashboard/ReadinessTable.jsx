import { useState, useEffect, useCallback, useMemo } from 'react'
import DataTable from '../common/DataTable.jsx'
import RAGBadge from '../common/RAGBadge.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getReadinessDashboard, updateReadinessField } from '../../services/DashboardService.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatPercentage, formatNumber, getConfidenceColor, truncateText } from '../../utils/formatters.js'

export default function ReadinessTable() {
  const { currentUser, hasPermission } = useAuth()
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const canEditRAG = useMemo(() => hasPermission('edit_rag'), [hasPermission])
  const canEditConfidence = useMemo(() => hasPermission('edit_confidence'), [hasPermission])
  const canEditComments = useMemo(() => hasPermission('edit_comments'), [hasPermission])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getReadinessDashboard(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[ReadinessTable] Error fetching readiness data:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRAGChange = useCallback(
    async (row, newStatus) => {
      if (!canEditRAG) return

      const id = `${row.release}|${row.wrNumber}`
      const userId = currentUser ? currentUser.id : null

      const result = await updateReadinessField(id, 'ragStatus', newStatus, userId)

      if (result.success) {
        setData((prev) =>
          prev.map((item) =>
            item.release === row.release && item.wrNumber === row.wrNumber
              ? { ...item, ragStatus: newStatus }
              : item
          )
        )
      } else {
        console.error('[ReadinessTable] Failed to update RAG status:', result.error)
      }
    },
    [canEditRAG, currentUser]
  )

  const handleEdit = useCallback(
    async (rowIndex, columnKey, newValue, row) => {
      if (!row) return

      const allowedFields = []
      if (canEditConfidence) allowedFields.push('releaseConfidenceIndex')
      if (canEditComments) allowedFields.push('comments')

      if (!allowedFields.includes(columnKey)) return

      let processedValue = newValue

      if (columnKey === 'releaseConfidenceIndex') {
        const num = Number(newValue)
        if (isNaN(num) || num < 0 || num > 5) {
          console.error('[ReadinessTable] Invalid confidence index value:', newValue)
          return
        }
        processedValue = Math.round(num * 10) / 10
      }

      const id = `${row.release}|${row.wrNumber}`
      const userId = currentUser ? currentUser.id : null

      const result = await updateReadinessField(id, columnKey, processedValue, userId)

      if (result.success) {
        setData((prev) =>
          prev.map((item) =>
            item.release === row.release && item.wrNumber === row.wrNumber
              ? { ...item, [columnKey]: processedValue }
              : item
          )
        )
      } else {
        console.error(`[ReadinessTable] Failed to update ${columnKey}:`, result.error)
      }
    },
    [canEditConfidence, canEditComments, currentUser]
  )

  const columns = useMemo(() => {
    return [
      {
        key: 'release',
        label: 'Release',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'program',
        label: 'Program',
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
        key: 'ragStatus',
        label: 'RAG Status',
        editable: false,
        render: (value, row) => (
          <RAGBadge
            status={value}
            editable={canEditRAG}
            onChange={(newStatus) => handleRAGChange(row, newStatus)}
          />
        ),
      },
      {
        key: 'testExecutionPassPct',
        label: 'Pass %',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num >= 90) {
            colorClass = 'text-success-700'
          } else if (num >= 75) {
            colorClass = 'text-warning-700'
          } else {
            colorClass = 'text-danger-700'
          }
          return <span className={`font-medium ${colorClass}`}>{formatPercentage(num)}</span>
        },
      },
      {
        key: 'totalDefects',
        label: 'Total Defects',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'openDefects',
        label: 'Open Defects',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num > 10) {
            colorClass = 'text-danger-700 font-semibold'
          } else if (num > 5) {
            colorClass = 'text-warning-700 font-medium'
          }
          return <span className={colorClass}>{formatNumber(num)}</span>
        },
      },
      {
        key: 'releaseConfidenceIndex',
        label: 'Confidence',
        editable: canEditConfidence,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          const conf = getConfidenceColor(num)
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conf.bg} ${conf.text}`}
            >
              {num.toFixed(1)} — {conf.label}
            </span>
          )
        },
      },
      {
        key: 'comments',
        label: 'Comments',
        editable: canEditComments,
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
    ]
  }, [canEditRAG, canEditConfidence, canEditComments, handleRAGChange])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading release readiness data..." />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Readiness Data"
        message="No release readiness data is available for the selected filters. Try adjusting your filter criteria."
      />
    )
  }

  return (
    <div className="animate-fade-in">
      <DataTable
        columns={columns}
        data={data}
        onEdit={canEditConfidence || canEditComments ? handleEdit : undefined}
        pageSize={10}
        sortable={true}
        emptyMessage="No release readiness data available"
      />
    </div>
  )
}