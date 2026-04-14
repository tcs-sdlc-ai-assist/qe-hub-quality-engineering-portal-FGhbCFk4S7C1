import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import ChartCard from '../common/ChartCard.jsx'
import DataTable from '../common/DataTable.jsx'
import StatCard from '../common/StatCard.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import FilterBar from '../common/FilterBar.jsx'
import { getDefectTrends } from '../../services/DefectService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatNumber, formatPercentage } from '../../utils/formatters.js'
import { transformToLineData, transformToBarData, getChartColors } from '../../utils/chartHelpers.js'

export default function DefectTrendsChart() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDefectTrends(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[DefectTrendsChart] Error fetching defect trends:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const monthOrder = useMemo(() => {
    return [
      'Oct 2025',
      'Nov 2025',
      'Dec 2025',
      'Jan 2026',
      'Feb 2026',
      'Mar 2026',
      'Apr 2026',
      'May 2026',
    ]
  }, [])

  const sortByMonth = useCallback(
    (a, b) => {
      const aIdx = monthOrder.indexOf(a)
      const bIdx = monthOrder.indexOf(b)
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    },
    [monthOrder]
  )

  const applications = useMemo(() => {
    if (!data || data.length === 0) return []

    const appSet = new Set()
    data.forEach((row) => {
      if (row.application) {
        appSet.add(row.application)
      }
    })

    return Array.from(appSet).sort((a, b) => a.localeCompare(b))
  }, [data])

  const months = useMemo(() => {
    if (!data || data.length === 0) return []

    const monthSet = new Set()
    data.forEach((row) => {
      if (row.month) {
        monthSet.add(row.month)
      }
    })

    return Array.from(monthSet).sort(sortByMonth)
  }, [data, sortByMonth])

  // Auto-select first application if none selected
  useEffect(() => {
    if (applications.length > 0 && !selectedApplication) {
      setSelectedApplication(applications[0])
    }
    if (applications.length > 0 && selectedApplication && !applications.includes(selectedApplication)) {
      setSelectedApplication(applications[0])
    }
  }, [applications, selectedApplication])

  // Aggregate defect trends across all applications by month
  const aggregatedTrendData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = {}

    data.forEach((row) => {
      const month = row.month
      if (!month) return

      if (!grouped[month]) {
        grouped[month] = { month, opened: 0, closed: 0, deferred: 0, netOpen: 0 }
      }

      grouped[month].opened += row.opened || 0
      grouped[month].closed += row.closed || 0
      grouped[month].deferred += row.deferred || 0
      grouped[month].netOpen += row.netOpen || 0
    })

    return months.map((month) => grouped[month] || { month, opened: 0, closed: 0, deferred: 0, netOpen: 0 })
  }, [data, months])

  // Defect trends for selected application
  const applicationTrendData = useMemo(() => {
    if (!data || data.length === 0 || !selectedApplication) return []

    const appData = data.filter((row) => row.application === selectedApplication)

    const grouped = {}

    appData.forEach((row) => {
      const month = row.month
      if (!month) return

      if (!grouped[month]) {
        grouped[month] = { month, opened: 0, closed: 0, deferred: 0, netOpen: 0 }
      }

      grouped[month].opened += row.opened || 0
      grouped[month].closed += row.closed || 0
      grouped[month].deferred += row.deferred || 0
      grouped[month].netOpen += row.netOpen || 0
    })

    return months.map((month) => grouped[month] || { month, opened: 0, closed: 0, deferred: 0, netOpen: 0 })
  }, [data, months, selectedApplication])

  // Opened vs Closed by application (bar chart)
  const openedClosedByApp = useMemo(() => {
    if (!data || data.length === 0) return []

    const appMap = {}

    data.forEach((row) => {
      const app = row.application || 'Unknown'
      if (!appMap[app]) {
        appMap[app] = { application: app, opened: 0, closed: 0, deferred: 0, netOpen: 0 }
      }
      appMap[app].opened += row.opened || 0
      appMap[app].closed += row.closed || 0
      appMap[app].deferred += row.deferred || 0
      appMap[app].netOpen += row.netOpen || 0
    })

    return Object.values(appMap).sort((a, b) => b.opened - a.opened)
  }, [data])

  // Net open trend (area chart)
  const netOpenTrendData = useMemo(() => {
    if (!aggregatedTrendData || aggregatedTrendData.length === 0) return []

    let cumulative = 0
    return aggregatedTrendData.map((row) => {
      cumulative += row.netOpen
      return {
        month: row.month,
        netOpen: row.netOpen,
        cumulative,
      }
    })
  }, [aggregatedTrendData])

  // Application summary for selected app
  const applicationSummary = useMemo(() => {
    if (!applicationTrendData || applicationTrendData.length === 0) return null

    let totalOpened = 0
    let totalClosed = 0
    let totalDeferred = 0
    let totalNetOpen = 0

    applicationTrendData.forEach((row) => {
      totalOpened += row.opened || 0
      totalClosed += row.closed || 0
      totalDeferred += row.deferred || 0
      totalNetOpen += row.netOpen || 0
    })

    const closureRate = totalOpened > 0 ? Math.round((totalClosed / totalOpened) * 1000) / 10 : 0

    return {
      totalOpened,
      totalClosed,
      totalDeferred,
      totalNetOpen,
      closureRate,
    }
  }, [applicationTrendData])

  // Overall summary stats
  const overallSummary = useMemo(() => {
    if (!aggregatedTrendData || aggregatedTrendData.length === 0) return null

    let totalOpened = 0
    let totalClosed = 0
    let totalDeferred = 0
    let totalNetOpen = 0

    aggregatedTrendData.forEach((row) => {
      totalOpened += row.opened || 0
      totalClosed += row.closed || 0
      totalDeferred += row.deferred || 0
      totalNetOpen += row.netOpen || 0
    })

    const closureRate = totalOpened > 0 ? Math.round((totalClosed / totalOpened) * 1000) / 10 : 0

    const latestMonth = aggregatedTrendData[aggregatedTrendData.length - 1]
    const previousMonth = aggregatedTrendData.length >= 2 ? aggregatedTrendData[aggregatedTrendData.length - 2] : null

    let openedTrend = 'neutral'
    if (latestMonth && previousMonth) {
      if (latestMonth.opened < previousMonth.opened) openedTrend = 'up'
      else if (latestMonth.opened > previousMonth.opened) openedTrend = 'down'
    }

    let closedTrend = 'neutral'
    if (latestMonth && previousMonth) {
      if (latestMonth.closed > previousMonth.closed) closedTrend = 'up'
      else if (latestMonth.closed < previousMonth.closed) closedTrend = 'down'
    }

    return {
      totalOpened,
      totalClosed,
      totalDeferred,
      totalNetOpen,
      closureRate,
      openedTrend,
      closedTrend,
      latestMonth,
      previousMonth,
    }
  }, [aggregatedTrendData])

  // Table data: per-application summary
  const tableData = useMemo(() => {
    return openedClosedByApp
  }, [openedClosedByApp])

  const tableColumns = useMemo(() => {
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
        key: 'opened',
        label: 'Total Opened',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          let colorClass = 'text-enterprise-dark'
          if (num > 80) colorClass = 'text-danger-700 font-semibold'
          else if (num > 50) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{formatNumber(num)}</span>
        },
      },
      {
        key: 'closed',
        label: 'Total Closed',
        editable: false,
        render: (value) => (
          <span className="text-success-700 font-medium">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'deferred',
        label: 'Total Deferred',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-enterprise-muted font-medium">{formatNumber(num)}</span>
        },
      },
      {
        key: 'netOpen',
        label: 'Net Open',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          let colorClass = 'text-enterprise-dark'
          if (num > 5) colorClass = 'text-danger-700 font-semibold'
          else if (num > 0) colorClass = 'text-warning-700 font-medium'
          else if (num < 0) colorClass = 'text-success-700 font-medium'
          return <span className={colorClass}>{formatNumber(num)}</span>
        },
      },
    ]
  }, [])

  const defaultColors = useMemo(() => getChartColors(), [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading defect trends..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <FilterBar visibleFilters={['release', 'application']} />
        <EmptyState
          title="No Defect Trend Data"
          message="No defect trend data is available for the selected filters. Try adjusting your filter criteria."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Application QE Defect Trends</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly defect trends by application showing opened, closed, deferred, and net open defects over time
        </p>
      </div>

      <FilterBar visibleFilters={['release', 'application']} />

      {/* Overall Summary Stats */}
      {overallSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Opened"
            value={formatNumber(overallSummary.totalOpened)}
            color={overallSummary.totalOpened > 400 ? 'danger' : overallSummary.totalOpened > 250 ? 'warning' : 'primary'}
            trend={overallSummary.openedTrend}
            trendValue={
              overallSummary.latestMonth
                ? `${formatNumber(overallSummary.latestMonth.opened)} this month`
                : undefined
            }
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
          <StatCard
            title="Total Closed"
            value={formatNumber(overallSummary.totalClosed)}
            color="success"
            trend={overallSummary.closedTrend}
            trendValue={
              overallSummary.latestMonth
                ? `${formatNumber(overallSummary.latestMonth.closed)} this month`
                : undefined
            }
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Deferred"
            value={formatNumber(overallSummary.totalDeferred)}
            color="secondary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Net Open"
            value={formatNumber(overallSummary.totalNetOpen)}
            color={overallSummary.totalNetOpen > 10 ? 'danger' : overallSummary.totalNetOpen > 0 ? 'warning' : 'success'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.22-2.058-1.907-3.555-3.97-3.555H8.916c-2.064 0-3.75 1.497-3.97 3.555a23.91 23.91 0 01-1.153 6.135A24.073 24.073 0 0112 12.75z" />
              </svg>
            }
          />
          <StatCard
            title="Closure Rate"
            value={formatPercentage(overallSummary.closureRate)}
            color={overallSummary.closureRate >= 90 ? 'success' : overallSummary.closureRate >= 75 ? 'warning' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts Row 1: Overall Defect Trend & Net Open Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Overall Defect Trend"
          subtitle="Monthly defects opened, closed, and deferred across all applications"
        >
          {aggregatedTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={aggregatedTrendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  angle={-25}
                  textAnchor="end"
                  height={50}
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
                    const labels = { opened: 'Opened', closed: 'Closed', deferred: 'Deferred' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { opened: 'Opened', closed: 'Closed', deferred: 'Deferred' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="opened"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="opened"
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="closed"
                />
                <Line
                  type="monotone"
                  dataKey="deferred"
                  stroke="#6c757d"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#6c757d', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                  name="deferred"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Net Open Defect Trend"
          subtitle="Monthly net open defects and cumulative trend"
        >
          {netOpenTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={netOpenTrendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  angle={-25}
                  textAnchor="end"
                  height={50}
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
                    const labels = { netOpen: 'Net Open', cumulative: 'Cumulative' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { netOpen: 'Net Open', cumulative: 'Cumulative' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#cumulativeGradient)"
                  name="cumulative"
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                />
                <Line
                  type="monotone"
                  dataKey="netOpen"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="netOpen"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Opened vs Closed by Application - Bar Chart */}
      <ChartCard
        title="Defects Opened vs Closed by Application"
        subtitle="Total defects opened and closed per application across all months"
        fullWidth
      >
        {openedClosedByApp.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={openedClosedByApp}
              margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
              <XAxis
                dataKey="application"
                tick={{ fontSize: 11, fill: '#6c757d' }}
                angle={-35}
                textAnchor="end"
                height={70}
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
                  const labels = { opened: 'Opened', closed: 'Closed', deferred: 'Deferred' }
                  return [formatNumber(value), labels[name] || name]
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  const labels = { opened: 'Opened', closed: 'Closed', deferred: 'Deferred' }
                  return (
                    <span className="text-xs text-enterprise-muted">
                      {labels[value] || value}
                    </span>
                  )
                }}
              />
              <Bar dataKey="opened" fill="#ef4444" radius={[4, 4, 0, 0]} name="opened" />
              <Bar dataKey="closed" fill="#22c55e" radius={[4, 4, 0, 0]} name="closed" />
              <Bar dataKey="deferred" fill="#6c757d" radius={[4, 4, 0, 0]} name="deferred" />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </ChartCard>

      {/* Application Selector & Drilldown */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Application Defect Trend Drilldown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Select an application to view its monthly defect trend in detail
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {applications.map((app) => {
            const isActive = selectedApplication === app
            const appData = openedClosedByApp.find((d) => d.application === app)
            const appNetOpen = appData ? appData.netOpen : 0

            return (
              <button
                key={app}
                type="button"
                onClick={() => setSelectedApplication(app)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-card'
                    : 'bg-enterprise-background text-enterprise-dark hover:bg-enterprise-border border border-enterprise-border'
                }`}
                aria-label={`Select application ${app}`}
                aria-pressed={isActive}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive
                      ? 'bg-white'
                      : appNetOpen > 5
                        ? 'bg-danger-500'
                        : appNetOpen > 0
                          ? 'bg-warning-500'
                          : 'bg-success-500'
                  }`}
                />
                <span className="truncate max-w-[160px]">{app}</span>
              </button>
            )
          })}
        </div>

        {/* Selected Application Summary */}
        {applicationSummary && selectedApplication && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Opened</p>
              <p className="mt-1 text-2xl font-bold text-enterprise-dark">
                {formatNumber(applicationSummary.totalOpened)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Closed</p>
              <p className="mt-1 text-2xl font-bold text-success-700">
                {formatNumber(applicationSummary.totalClosed)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Deferred</p>
              <p className="mt-1 text-2xl font-bold text-enterprise-muted">
                {formatNumber(applicationSummary.totalDeferred)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Net Open</p>
              <p className={`mt-1 text-2xl font-bold ${
                applicationSummary.totalNetOpen > 5
                  ? 'text-danger-700'
                  : applicationSummary.totalNetOpen > 0
                    ? 'text-warning-700'
                    : 'text-success-700'
              }`}>
                {formatNumber(applicationSummary.totalNetOpen)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Closure Rate</p>
              <p className={`mt-1 text-2xl font-bold ${
                applicationSummary.closureRate >= 90
                  ? 'text-success-700'
                  : applicationSummary.closureRate >= 75
                    ? 'text-warning-700'
                    : 'text-danger-700'
              }`}>
                {formatPercentage(applicationSummary.closureRate)}
              </p>
            </div>
          </div>
        )}

        {/* Selected Application Trend Chart */}
        {applicationTrendData.length > 0 && selectedApplication && (
          <ChartCard
            title={`Defect Trend — ${selectedApplication}`}
            subtitle={`Monthly opened, closed, and deferred defects for ${selectedApplication}`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={applicationTrendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  angle={-25}
                  textAnchor="end"
                  height={50}
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
                    const labels = { opened: 'Opened', closed: 'Closed', deferred: 'Deferred', netOpen: 'Net Open' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { opened: 'Opened', closed: 'Closed', deferred: 'Deferred', netOpen: 'Net Open' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="opened"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="opened"
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="closed"
                />
                <Line
                  type="monotone"
                  dataKey="deferred"
                  stroke="#6c757d"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#6c757d', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                  name="deferred"
                />
                <Line
                  type="monotone"
                  dataKey="netOpen"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                  name="netOpen"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Application Summary Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Application Defect Summary</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Aggregated defect counts per application across all months
          </p>
        </div>
        <DataTable
          columns={tableColumns}
          data={tableData}
          pageSize={10}
          sortable={true}
          emptyMessage="No defect trend data available"
        />
      </div>
    </div>
  )
}