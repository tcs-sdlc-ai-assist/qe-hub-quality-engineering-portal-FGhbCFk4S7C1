import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import ChartCard from '../common/ChartCard.jsx'
import DataTable from '../common/DataTable.jsx'
import RAGBadge from '../common/RAGBadge.jsx'
import EditableCell from '../common/EditableCell.jsx'
import StatCard from '../common/StatCard.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import FilterBar from '../common/FilterBar.jsx'
import { getDSRByProgram, updateDSRField } from '../../services/DSRService.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatDate, formatPercentage, formatNumber, getRAGColor, truncateText } from '../../utils/formatters.js'
import { transformToBarData, transformToPieData, getChartColors } from '../../utils/chartHelpers.js'
import { PROGRAMS } from '../../constants/filters.js'

export default function ProgramDrilldownView() {
  const { currentUser, hasPermission } = useAuth()
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)

  const canEditRAG = useMemo(() => hasPermission('edit_rag'), [hasPermission])
  const canEditDSR = useMemo(() => hasPermission('edit_dsr'), [hasPermission])
  const canEditComments = useMemo(() => hasPermission('edit_comments'), [hasPermission])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const filterProgram = filters.selectedProgram || 'All'
      const filterRelease = filters.selectedRelease || 'All'

      let result

      if (filterProgram !== 'All') {
        result = await getDSRByProgram(filterProgram, filterRelease !== 'All' ? filterRelease : undefined)
      } else {
        const allResults = []
        for (const program of PROGRAMS) {
          const programData = await getDSRByProgram(program, filterRelease !== 'All' ? filterRelease : undefined)
          if (Array.isArray(programData)) {
            allResults.push(...programData)
          }
        }
        result = allResults
      }

      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[ProgramDrilldownView] Error fetching program drilldown data:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const groupedByProgram = useMemo(() => {
    if (!data || data.length === 0) return {}

    const groups = {}

    data.forEach((row) => {
      const program = row.program || 'Unknown'
      if (!groups[program]) {
        groups[program] = []
      }
      groups[program].push(row)
    })

    return groups
  }, [data])

  const programKeys = useMemo(() => {
    return Object.keys(groupedByProgram).sort((a, b) => a.localeCompare(b))
  }, [groupedByProgram])

  const programSummaries = useMemo(() => {
    const summaries = {}

    programKeys.forEach((program) => {
      const rows = groupedByProgram[program]
      let green = 0
      let yellow = 0
      let red = 0
      let totalTests = 0
      let passedTests = 0
      let failedTests = 0
      let blockedTests = 0
      let defectsOpen = 0
      let defectsClosed = 0
      let totalCoverage = 0
      let totalExecution = 0
      let coverageCount = 0
      let executionCount = 0

      rows.forEach((row) => {
        if (row.ragStatus === 'Green') green += 1
        else if (row.ragStatus === 'Yellow') yellow += 1
        else if (row.ragStatus === 'Red') red += 1

        totalTests += row.totalTests || 0
        passedTests += row.passedTests || 0
        failedTests += row.failedTests || 0
        blockedTests += row.blockedTests || 0
        defectsOpen += row.defectsOpen || 0
        defectsClosed += row.defectsClosed || 0

        if (row.testCoverage !== null && row.testCoverage !== undefined) {
          totalCoverage += row.testCoverage
          coverageCount += 1
        }

        if (row.executionPct !== null && row.executionPct !== undefined) {
          totalExecution += row.executionPct
          executionCount += 1
        }
      })

      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 1000) / 10 : 0
      const avgCoverage = coverageCount > 0 ? Math.round((totalCoverage / coverageCount) * 10) / 10 : 0
      const avgExecution = executionCount > 0 ? Math.round((totalExecution / executionCount) * 10) / 10 : 0

      summaries[program] = {
        total: rows.length,
        green,
        yellow,
        red,
        totalTests,
        passedTests,
        failedTests,
        blockedTests,
        passRate,
        avgCoverage,
        avgExecution,
        defectsOpen,
        defectsClosed,
        totalDefects: defectsOpen + defectsClosed,
      }
    })

    return summaries
  }, [programKeys, groupedByProgram])

  // Auto-select first program if none selected
  useEffect(() => {
    if (programKeys.length > 0 && !selectedProgram) {
      setSelectedProgram(programKeys[0])
    }
    if (programKeys.length > 0 && selectedProgram && !programKeys.includes(selectedProgram)) {
      setSelectedProgram(programKeys[0])
    }
  }, [programKeys, selectedProgram])

  const activeProgramData = useMemo(() => {
    if (!selectedProgram || !groupedByProgram[selectedProgram]) return []
    return groupedByProgram[selectedProgram]
  }, [selectedProgram, groupedByProgram])

  const activeProgramSummary = useMemo(() => {
    if (!selectedProgram || !programSummaries[selectedProgram]) return null
    return programSummaries[selectedProgram]
  }, [selectedProgram, programSummaries])

  // Chart data for selected program
  const coverageByWR = useMemo(() => {
    if (!activeProgramData || activeProgramData.length === 0) return []

    return activeProgramData.map((row) => ({
      name: row.wrNumber || 'N/A',
      coverage: row.testCoverage !== null && row.testCoverage !== undefined ? Number(row.testCoverage) : 0,
      execution: row.executionPct !== null && row.executionPct !== undefined ? Number(row.executionPct) : 0,
    }))
  }, [activeProgramData])

  const defectsByWR = useMemo(() => {
    if (!activeProgramData || activeProgramData.length === 0) return []

    return activeProgramData.map((row) => ({
      name: row.wrNumber || 'N/A',
      open: row.defectsOpen || 0,
      closed: row.defectsClosed || 0,
    }))
  }, [activeProgramData])

  const testResultsByWR = useMemo(() => {
    if (!activeProgramData || activeProgramData.length === 0) return []

    return activeProgramData.map((row) => ({
      name: row.wrNumber || 'N/A',
      passed: row.passedTests || 0,
      failed: row.failedTests || 0,
      blocked: row.blockedTests || 0,
    }))
  }, [activeProgramData])

  const ragDistribution = useMemo(() => {
    if (!activeProgramData || activeProgramData.length === 0) return []

    return transformToPieData(activeProgramData, {
      categoryField: 'ragStatus',
      colorCategory: 'rag',
    })
  }, [activeProgramData])

  const applicationBreakdown = useMemo(() => {
    if (!activeProgramData || activeProgramData.length === 0) return []

    const appMap = {}

    activeProgramData.forEach((row) => {
      const apps = Array.isArray(row.applications) ? row.applications : row.applications ? [row.applications] : []
      apps.forEach((app) => {
        if (!appMap[app]) {
          appMap[app] = { application: app, totalTests: 0, passedTests: 0, defectsOpen: 0, wrCount: 0 }
        }
        appMap[app].totalTests += row.totalTests || 0
        appMap[app].passedTests += row.passedTests || 0
        appMap[app].defectsOpen += row.defectsOpen || 0
        appMap[app].wrCount += 1
      })
    })

    return Object.values(appMap).sort((a, b) => b.totalTests - a.totalTests)
  }, [activeProgramData])

  const ragColors = useMemo(() => getChartColors('rag'), [])

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
        console.error('[ProgramDrilldownView] Failed to update RAG status:', result.error)
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
        console.error(`[ProgramDrilldownView] Failed to update ${field}:`, result.error)
      }
    },
    [currentUser]
  )

  const wrColumns = useMemo(() => {
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
        key: 'domain',
        label: 'Domain',
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
        key: 'totalTests',
        label: 'Total Tests',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'passedTests',
        label: 'Passed',
        editable: false,
        render: (value) => (
          <span className="text-success-700 font-medium">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'failedTests',
        label: 'Failed',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-danger-700 font-medium">{formatNumber(num)}</span>
        },
      },
      {
        key: 'blockedTests',
        label: 'Blocked',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-warning-700 font-medium">{formatNumber(num)}</span>
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
    ]
  }, [canEditRAG, canEditDSR, canEditComments, handleRAGChange, handleFieldUpdate])

  const applicationColumns = useMemo(() => {
    return [
      {
        key: 'application',
        label: 'Application',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'wrCount',
        label: 'WRs',
        editable: false,
        render: (value) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
            {formatNumber(value)}
          </span>
        ),
      },
      {
        key: 'totalTests',
        label: 'Total Tests',
        editable: false,
        render: (value) => (
          <span className="font-semibold text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'passedTests',
        label: 'Passed',
        editable: false,
        render: (value) => (
          <span className="text-success-700 font-medium">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'defectsOpen',
        label: 'Open Defects',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          let colorClass = 'text-enterprise-dark'
          if (num > 10) colorClass = 'text-danger-700 font-semibold'
          else if (num > 5) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{formatNumber(num)}</span>
        },
      },
    ]
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading program drilldown data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <FilterBar
          visibleFilters={['release', 'program', 'domain']}
        />
        <EmptyState
          title="No Program Drilldown Data"
          message="No program data is available for the selected filters. Try adjusting your filter criteria."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <FilterBar
        visibleFilters={['release', 'program', 'domain']}
      />

      {/* Program Selector */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Program Status Drilldown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Select a program to view detailed WR status, test coverage, execution metrics, and defect analysis
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {programKeys.map((program) => {
            const summary = programSummaries[program]
            const isActive = selectedProgram === program

            let overallRAG = 'Green'
            if (summary.red > 0) overallRAG = 'Red'
            else if (summary.yellow > 0) overallRAG = 'Yellow'

            const ragColor = getRAGColor(overallRAG)

            return (
              <button
                key={program}
                type="button"
                onClick={() => setSelectedProgram(program)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-card'
                    : 'bg-enterprise-background text-enterprise-dark hover:bg-enterprise-border border border-enterprise-border'
                }`}
                aria-label={`Select program ${program}`}
                aria-pressed={isActive}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : ragColor.dot}`} />
                <span className="truncate max-w-[180px]">{program}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-700'
                }`}>
                  {summary.total}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Program Summary Stats */}
      {activeProgramSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total WRs"
            value={formatNumber(activeProgramSummary.total)}
            color="primary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            }
          />
          <StatCard
            title="Pass Rate"
            value={formatPercentage(activeProgramSummary.passRate)}
            color={activeProgramSummary.passRate >= 90 ? 'success' : activeProgramSummary.passRate >= 75 ? 'warning' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Avg Coverage"
            value={formatPercentage(activeProgramSummary.avgCoverage)}
            color={activeProgramSummary.avgCoverage >= 90 ? 'success' : activeProgramSummary.avgCoverage >= 75 ? 'warning' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />
          <StatCard
            title="Avg Execution"
            value={formatPercentage(activeProgramSummary.avgExecution)}
            color={activeProgramSummary.avgExecution >= 90 ? 'success' : activeProgramSummary.avgExecution >= 75 ? 'warning' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
          <StatCard
            title="Open Defects"
            value={formatNumber(activeProgramSummary.defectsOpen)}
            color={activeProgramSummary.defectsOpen > 10 ? 'danger' : activeProgramSummary.defectsOpen > 5 ? 'warning' : 'success'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
          <StatCard
            title="Total Tests"
            value={formatNumber(activeProgramSummary.totalTests)}
            color="info"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage & Execution by WR - Line/Bar Chart */}
        <ChartCard
          title="Test Coverage & Execution by WR"
          subtitle={`Coverage and execution percentage per WR in ${selectedProgram || 'selected program'}`}
        >
          {coverageByWR.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={coverageByWR}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value, name) => [formatPercentage(value), name === 'coverage' ? 'Coverage' : 'Execution']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-enterprise-muted">
                      {value === 'coverage' ? 'Coverage' : 'Execution'}
                    </span>
                  )}
                />
                <Bar dataKey="coverage" fill="#4f46e5" radius={[4, 4, 0, 0]} name="coverage" />
                <Bar dataKey="execution" fill="#14b8a6" radius={[4, 4, 0, 0]} name="execution" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        {/* RAG Distribution - Pie Chart */}
        <ChartCard
          title="RAG Status Distribution"
          subtitle={`RAG status breakdown for ${selectedProgram || 'selected program'}`}
        >
          {ragDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ragDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${formatPercentage(percent * 100, 0)}`
                  }
                  labelLine={{ stroke: '#6c757d', strokeWidth: 1 }}
                >
                  {ragDistribution.map((entry, index) => (
                    <Cell key={`rag-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value, name) => [formatNumber(value), name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-enterprise-muted">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defects by WR - Bar Chart */}
        <ChartCard
          title="Defects by WR"
          subtitle={`Open vs closed defects per WR in ${selectedProgram || 'selected program'}`}
        >
          {defectsByWR.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={defectsByWR}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value, name) => [formatNumber(value), name === 'open' ? 'Open' : 'Closed']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-enterprise-muted">
                      {value === 'open' ? 'Open' : 'Closed'}
                    </span>
                  )}
                />
                <Bar dataKey="open" fill="#ef4444" radius={[4, 4, 0, 0]} name="open" stackId="defects" />
                <Bar dataKey="closed" fill="#22c55e" radius={[4, 4, 0, 0]} name="closed" stackId="defects" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        {/* Test Results by WR - Stacked Bar Chart */}
        <ChartCard
          title="Test Results by WR"
          subtitle={`Passed, failed, and blocked tests per WR in ${selectedProgram || 'selected program'}`}
        >
          {testResultsByWR.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={testResultsByWR}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value, name) => {
                    const labels = { passed: 'Passed', failed: 'Failed', blocked: 'Blocked' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { passed: 'Passed', failed: 'Failed', blocked: 'Blocked' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <Bar dataKey="passed" fill="#22c55e" stackId="tests" name="passed" />
                <Bar dataKey="failed" fill="#ef4444" stackId="tests" name="failed" />
                <Bar dataKey="blocked" fill="#f59e0b" stackId="tests" radius={[4, 4, 0, 0]} name="blocked" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Application Breakdown Table */}
      {applicationBreakdown.length > 0 && (
        <div className="card">
          <div className="mb-4">
            <h3 className="section-title">Application Breakdown — {selectedProgram}</h3>
            <p className="mt-1 text-sm text-enterprise-muted">
              Test and defect summary per application within the selected program
            </p>
          </div>
          <DataTable
            columns={applicationColumns}
            data={applicationBreakdown}
            pageSize={10}
            sortable={true}
            emptyMessage={`No application data available for ${selectedProgram}`}
          />
        </div>
      )}

      {/* WR Detail Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">WR Detail — {selectedProgram}</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Detailed WR-level status including timelines, test metrics, defects, and editable fields
          </p>
        </div>
        <DataTable
          columns={wrColumns}
          data={activeProgramData}
          pageSize={10}
          sortable={true}
          emptyMessage={`No WR data available for ${selectedProgram}`}
        />
      </div>
    </div>
  )
}