import { useState, useEffect, useCallback, useMemo } from 'react'
import ExpandableRow from '../common/ExpandableRow.jsx'
import DataTable from '../common/DataTable.jsx'
import RAGBadge from '../common/RAGBadge.jsx'
import EditableCell from '../common/EditableCell.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import FilterBar from '../common/FilterBar.jsx'
import { getDSRByDomain, updateDSRField } from '../../services/DSRService.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatDate, formatPercentage, formatNumber, truncateText } from '../../utils/formatters.js'
import { DOMAINS } from '../../constants/filters.js'

export default function DSRDomainView() {
  const { currentUser, hasPermission } = useAuth()
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const canEditRAG = useMemo(() => hasPermission('edit_rag'), [hasPermission])
  const canEditDSR = useMemo(() => hasPermission('edit_dsr'), [hasPermission])
  const canEditComments = useMemo(() => hasPermission('edit_comments'), [hasPermission])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const selectedDomain = filters.selectedDomain || 'All'
      const selectedRelease = filters.selectedRelease || 'All'

      let result

      if (selectedDomain !== 'All') {
        result = await getDSRByDomain(selectedDomain, selectedRelease !== 'All' ? selectedRelease : undefined)
      } else {
        const allResults = []
        for (const domain of DOMAINS) {
          const domainData = await getDSRByDomain(domain, selectedRelease !== 'All' ? selectedRelease : undefined)
          if (Array.isArray(domainData)) {
            allResults.push(...domainData)
          }
        }
        result = allResults
      }

      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[DSRDomainView] Error fetching domain DSR data:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const groupedByDomain = useMemo(() => {
    if (!data || data.length === 0) return {}

    const groups = {}

    data.forEach((row) => {
      const domain = row.domain || 'Unknown'
      if (!groups[domain]) {
        groups[domain] = []
      }
      groups[domain].push(row)
    })

    return groups
  }, [data])

  const domainKeys = useMemo(() => {
    return Object.keys(groupedByDomain).sort((a, b) => a.localeCompare(b))
  }, [groupedByDomain])

  const domainSummary = useMemo(() => {
    const summary = {}

    domainKeys.forEach((domain) => {
      const rows = groupedByDomain[domain]
      let green = 0
      let yellow = 0
      let red = 0
      let totalTests = 0
      let passedTests = 0
      let defectsOpen = 0

      rows.forEach((row) => {
        if (row.ragStatus === 'Green') green += 1
        else if (row.ragStatus === 'Yellow') yellow += 1
        else if (row.ragStatus === 'Red') red += 1

        totalTests += row.totalTests || 0
        passedTests += row.passedTests || 0
        defectsOpen += row.defectsOpen || 0
      })

      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 1000) / 10 : 0

      summary[domain] = {
        total: rows.length,
        green,
        yellow,
        red,
        passRate,
        defectsOpen,
      }
    })

    return summary
  }, [domainKeys, groupedByDomain])

  const handleRAGChange = useCallback(
    async (row, newStatus) => {
      if (!canEditRAG) return

      const id = `${row.release}|${row.wrNumber}|${row.domain}`
      const userId = currentUser ? currentUser.id : null

      const result = await updateDSRField(id, 'ragStatus', newStatus, userId)

      if (result.success) {
        setData((prev) =>
          prev.map((item) =>
            item.release === row.release && item.wrNumber === row.wrNumber && item.domain === row.domain
              ? { ...item, ragStatus: newStatus }
              : item
          )
        )
      } else {
        console.error('[DSRDomainView] Failed to update RAG status:', result.error)
      }
    },
    [canEditRAG, currentUser]
  )

  const handleFieldUpdate = useCallback(
    async (row, field, newValue) => {
      const id = `${row.release}|${row.wrNumber}|${row.domain}`
      const userId = currentUser ? currentUser.id : null

      let processedValue = newValue

      if (field === 'performanceTesting' || field === 'dastTesting') {
        processedValue = newValue === 'true' || newValue === true
      }

      const result = await updateDSRField(id, field, processedValue, userId)

      if (result.success) {
        setData((prev) =>
          prev.map((item) =>
            item.release === row.release && item.wrNumber === row.wrNumber && item.domain === row.domain
              ? { ...item, [field]: processedValue }
              : item
          )
        )
      } else {
        console.error(`[DSRDomainView] Failed to update ${field}:`, result.error)
      }
    },
    [currentUser]
  )

  const renderDomainRAGSummary = useCallback((summary) => {
    return (
      <div className="flex items-center gap-2">
        {summary.green > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1" />
            {summary.green}
          </span>
        )}
        {summary.yellow > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-500 mr-1" />
            {summary.yellow}
          </span>
        )}
        {summary.red > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700">
            <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mr-1" />
            {summary.red}
          </span>
        )}
      </div>
    )
  }, [])

  const renderDomainDetail = useCallback(
    (domain, rows) => {
      const columns = [
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
          key: 'applications',
          label: 'Applications',
          editable: false,
          render: (value) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
              return <span className="text-enterprise-muted">N/A</span>
            }
            const apps = Array.isArray(value) ? value : [value]
            return (
              <div className="flex flex-wrap gap-1">
                {apps.map((app, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700"
                  >
                    {app}
                  </span>
                ))}
              </div>
            )
          },
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
          key: 'sitSignOffDate',
          label: 'SIT Sign Off',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value ? formatDate(value) : null}
              editable={canEditDSR}
              type="date"
              onSave={(newValue) => handleFieldUpdate(row, 'sitSignOffDate', newValue)}
              placeholder="N/A"
              ariaLabel="SIT Sign Off Date"
            />
          ),
        },
        {
          key: 'brdDouDate',
          label: 'BRD/DOU Date',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value ? formatDate(value) : null}
              editable={canEditDSR}
              type="date"
              onSave={(newValue) => handleFieldUpdate(row, 'brdDouDate', newValue)}
              placeholder="N/A"
              ariaLabel="BRD/DOU Date"
            />
          ),
        },
        {
          key: 'trdDate',
          label: 'TRD Date',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value ? formatDate(value) : null}
              editable={canEditDSR}
              type="date"
              onSave={(newValue) => handleFieldUpdate(row, 'trdDate', newValue)}
              placeholder="N/A"
              ariaLabel="TRD Date"
            />
          ),
        },
        {
          key: 'codeDropDate',
          label: 'Code Drop',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value ? formatDate(value) : null}
              editable={canEditDSR}
              type="date"
              onSave={(newValue) => handleFieldUpdate(row, 'codeDropDate', newValue)}
              placeholder="N/A"
              ariaLabel="Code Drop Date"
            />
          ),
        },
        {
          key: 'tdmRequestNumber',
          label: 'TDM Request#',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value}
              editable={canEditDSR}
              type="text"
              onSave={(newValue) => handleFieldUpdate(row, 'tdmRequestNumber', newValue)}
              placeholder="N/A"
              ariaLabel="TDM Request Number"
            />
          ),
        },
        {
          key: 'dependencies',
          label: 'Dependencies',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value}
              editable={canEditComments}
              type="text"
              onSave={(newValue) => handleFieldUpdate(row, 'dependencies', newValue)}
              placeholder="N/A"
              ariaLabel="Dependencies"
              maxLength={500}
            />
          ),
        },
        {
          key: 'risks',
          label: 'Risks',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value}
              editable={canEditComments}
              type="text"
              onSave={(newValue) => handleFieldUpdate(row, 'risks', newValue)}
              placeholder="N/A"
              ariaLabel="Risks"
              maxLength={500}
            />
          ),
        },
        {
          key: 'comments',
          label: 'Comments',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value}
              editable={canEditComments}
              type="text"
              onSave={(newValue) => handleFieldUpdate(row, 'comments', newValue)}
              placeholder="N/A"
              ariaLabel="Comments"
              maxLength={500}
            />
          ),
        },
        {
          key: 'performanceTesting',
          label: 'Perf Testing',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value !== null && value !== undefined ? (value ? 'Yes' : 'No') : null}
              editable={canEditDSR}
              type="select"
              options={[
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
              onSave={(newValue) => handleFieldUpdate(row, 'performanceTesting', newValue)}
              placeholder="N/A"
              ariaLabel="Performance Testing"
            />
          ),
        },
        {
          key: 'perfSignOffDate',
          label: 'Perf Sign Off',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value ? formatDate(value) : null}
              editable={canEditDSR}
              type="date"
              onSave={(newValue) => handleFieldUpdate(row, 'perfSignOffDate', newValue)}
              placeholder="N/A"
              ariaLabel="Performance Sign Off Date"
            />
          ),
        },
        {
          key: 'dastTesting',
          label: 'DAST Testing',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value !== null && value !== undefined ? (value ? 'Yes' : 'No') : null}
              editable={canEditDSR}
              type="select"
              options={[
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
              onSave={(newValue) => handleFieldUpdate(row, 'dastTesting', newValue)}
              placeholder="N/A"
              ariaLabel="DAST Testing"
            />
          ),
        },
        {
          key: 'dastSignOffDate',
          label: 'DAST Sign Off',
          editable: false,
          render: (value, row) => (
            <EditableCell
              value={value ? formatDate(value) : null}
              editable={canEditDSR}
              type="date"
              onSave={(newValue) => handleFieldUpdate(row, 'dastSignOffDate', newValue)}
              placeholder="N/A"
              ariaLabel="DAST Sign Off Date"
            />
          ),
        },
        {
          key: 'testCoverage',
          label: 'Coverage',
          editable: false,
          render: (value) => {
            if (value === null || value === undefined) {
              return <span className="text-enterprise-muted">N/A</span>
            }
            const num = Number(value)
            let colorClass = 'text-enterprise-dark'
            if (num >= 90) colorClass = 'text-success-700'
            else if (num >= 75) colorClass = 'text-warning-700'
            else colorClass = 'text-danger-700'
            return <span className={`font-medium ${colorClass}`}>{formatPercentage(num)}</span>
          },
        },
        {
          key: 'executionPct',
          label: 'Execution %',
          editable: false,
          render: (value) => {
            if (value === null || value === undefined) {
              return <span className="text-enterprise-muted">N/A</span>
            }
            const num = Number(value)
            let colorClass = 'text-enterprise-dark'
            if (num >= 90) colorClass = 'text-success-700'
            else if (num >= 75) colorClass = 'text-warning-700'
            else colorClass = 'text-danger-700'
            return <span className={`font-medium ${colorClass}`}>{formatPercentage(num)}</span>
          },
        },
        {
          key: 'defectsOpen',
          label: 'Open Defects',
          editable: false,
          render: (value) => {
            if (value === null || value === undefined) {
              return <span className="text-enterprise-muted">N/A</span>
            }
            const num = Number(value)
            let colorClass = 'text-enterprise-dark'
            if (num > 10) colorClass = 'text-danger-700 font-semibold'
            else if (num > 5) colorClass = 'text-warning-700 font-medium'
            return <span className={colorClass}>{formatNumber(num)}</span>
          },
        },
      ]

      return (
        <DataTable
          columns={columns}
          data={rows}
          pageSize={10}
          sortable={true}
          emptyMessage={`No DSR data available for ${domain}`}
        />
      )
    },
    [canEditRAG, canEditDSR, canEditComments, handleRAGChange, handleFieldUpdate]
  )

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading domain DSR data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <FilterBar
          visibleFilters={['release', 'domain', 'program']}
        />
        <EmptyState
          title="No Domain DSR Data"
          message="No domain DSR data is available for the selected filters. Try adjusting your filter criteria."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <FilterBar
        visibleFilters={['release', 'domain', 'program']}
      />

      {/* Domain Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">Total Domains</p>
          <p className="mt-1 text-2xl font-bold text-enterprise-dark">
            {formatNumber(domainKeys.length)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">Total WRs</p>
          <p className="mt-1 text-2xl font-bold text-enterprise-dark">
            {formatNumber(data.length)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">At Risk</p>
          <p className="mt-1 text-2xl font-bold text-danger-700">
            {formatNumber(data.filter((d) => d.ragStatus === 'Red').length)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">On Track</p>
          <p className="mt-1 text-2xl font-bold text-success-700">
            {formatNumber(data.filter((d) => d.ragStatus === 'Green').length)}
          </p>
        </div>
      </div>

      {/* Domain Expandable Rows */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Domain Wise DSR</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Expand each domain to view WR-level DSR details with editable fields
          </p>
        </div>

        <div className="table-container">
          <table className="w-full min-w-full divide-y divide-enterprise-border">
            <thead>
              <tr>
                <th className="table-header w-10" />
                <th className="table-header">Domain</th>
                <th className="table-header">WRs</th>
                <th className="table-header">RAG Summary</th>
                <th className="table-header">Pass Rate</th>
                <th className="table-header">Open Defects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border bg-enterprise-surface">
              {domainKeys.map((domain) => {
                const summary = domainSummary[domain]
                const rows = groupedByDomain[domain]

                return (
                  <ExpandableRow
                    key={domain}
                    colSpan={6}
                    defaultExpanded={false}
                    summary={({ isExpanded, chevron }) => (
                      <>
                        <td className="table-cell w-10">
                          <div className="flex items-center justify-center">
                            {chevron}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="font-semibold text-enterprise-dark">{domain}</span>
                        </td>
                        <td className="table-cell">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                            {summary.total}
                          </span>
                        </td>
                        <td className="table-cell">
                          {renderDomainRAGSummary(summary)}
                        </td>
                        <td className="table-cell">
                          {(() => {
                            const rate = summary.passRate
                            let colorClass = 'text-enterprise-dark'
                            if (rate >= 90) colorClass = 'text-success-700'
                            else if (rate >= 75) colorClass = 'text-warning-700'
                            else colorClass = 'text-danger-700'
                            return (
                              <span className={`font-medium ${colorClass}`}>
                                {formatPercentage(rate)}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="table-cell">
                          {(() => {
                            const num = summary.defectsOpen
                            let colorClass = 'text-enterprise-dark'
                            if (num > 10) colorClass = 'text-danger-700 font-semibold'
                            else if (num > 5) colorClass = 'text-warning-700 font-medium'
                            return <span className={colorClass}>{formatNumber(num)}</span>
                          })()}
                        </td>
                      </>
                    )}
                  >
                    <div className="py-2">
                      {renderDomainDetail(domain, rows)}
                    </div>
                  </ExpandableRow>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}