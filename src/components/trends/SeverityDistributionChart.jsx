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
  AreaChart,
  Area,
} from 'recharts'
import ChartCard from '../common/ChartCard.jsx'
import DataTable from '../common/DataTable.jsx'
import StatCard from '../common/StatCard.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import FilterBar from '../common/FilterBar.jsx'
import { getSeverityDistribution } from '../../services/DefectService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatNumber, formatPercentage } from '../../utils/formatters.js'
import { getChartColors, transformToPieData, buildStackedBarData } from '../../utils/chartHelpers.js'

export default function SeverityDistributionChart() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getSeverityDistribution(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[SeverityDistributionChart] Error fetching severity distribution:', err)
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

  // Auto-select latest month if none selected
  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1])
    }
    if (months.length > 0 && selectedMonth && !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1])
    }
  }, [months, selectedMonth])

  const severityColors = useMemo(() => getChartColors('severity'), [])

  // Overall severity totals across all months
  const overallSeverityTotals = useMemo(() => {
    if (!data || data.length === 0) return { Critical: 0, Major: 0, Minor: 0, Trivial: 0, total: 0 }

    let critical = 0
    let major = 0
    let minor = 0
    let trivial = 0

    data.forEach((row) => {
      switch (row.severity) {
        case 'Critical':
          critical += row.count || 0
          break
        case 'Major':
          major += row.count || 0
          break
        case 'Minor':
          minor += row.count || 0
          break
        case 'Trivial':
          trivial += row.count || 0
          break
        default:
          break
      }
    })

    return {
      Critical: critical,
      Major: major,
      Minor: minor,
      Trivial: trivial,
      total: critical + major + minor + trivial,
    }
  }, [data])

  // Pie chart data for selected month
  const selectedMonthPieData = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return []

    const monthData = data.filter((row) => row.month === selectedMonth)

    return transformToPieData(monthData, {
      categoryField: 'severity',
      valueField: 'count',
      colorCategory: 'severity',
    })
  }, [data, selectedMonth])

  // Overall pie chart data (all months aggregated)
  const overallPieData = useMemo(() => {
    if (!data || data.length === 0) return []

    const severityMap = {}

    data.forEach((row) => {
      const sev = row.severity
      if (!sev) return
      if (!severityMap[sev]) {
        severityMap[sev] = 0
      }
      severityMap[sev] += row.count || 0
    })

    const entries = Object.entries(severityMap)
    const colorMap = getChartColors('severity')

    return entries.map(([name, value], index) => {
      const color = colorMap[name] || '#6c757d'
      return { name, value, color }
    })
  }, [data])

  // Stacked bar chart: severity by month
  const severityByMonth = useMemo(() => {
    if (!data || data.length === 0) return { data: [], stackKeys: [] }

    return buildStackedBarData(data, {
      categoryField: 'month',
      stackField: 'severity',
      valueField: 'count',
      stackOrder: ['Critical', 'Major', 'Minor', 'Trivial'],
    })
  }, [data])

  // Sort stacked bar data by month order
  const sortedStackedData = useMemo(() => {
    if (!severityByMonth.data || severityByMonth.data.length === 0) return { data: [], stackKeys: severityByMonth.stackKeys }

    const sorted = [...severityByMonth.data].sort((a, b) => sortByMonth(a.month, b.month))

    return { data: sorted, stackKeys: severityByMonth.stackKeys }
  }, [severityByMonth, sortByMonth])

  // Severity trend line chart data
  const severityTrendData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = {}

    data.forEach((row) => {
      const month = row.month
      if (!month) return

      if (!grouped[month]) {
        grouped[month] = { month, Critical: 0, Major: 0, Minor: 0, Trivial: 0 }
      }

      const sev = row.severity
      if (sev && grouped[month][sev] !== undefined) {
        grouped[month][sev] += row.count || 0
      }
    })

    return months.map((month) => grouped[month] || { month, Critical: 0, Major: 0, Minor: 0, Trivial: 0 })
  }, [data, months])

  // Critical defect trend (area chart)
  const criticalTrendData = useMemo(() => {
    if (!severityTrendData || severityTrendData.length === 0) return []

    let cumulative = 0
    return severityTrendData.map((row) => {
      cumulative += row.Critical
      return {
        month: row.month,
        critical: row.Critical,
        cumulative,
      }
    })
  }, [severityTrendData])

  // Selected month summary
  const selectedMonthSummary = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return null

    const monthData = data.filter((row) => row.month === selectedMonth)

    let critical = 0
    let major = 0
    let minor = 0
    let trivial = 0

    monthData.forEach((row) => {
      switch (row.severity) {
        case 'Critical':
          critical += row.count || 0
          break
        case 'Major':
          major += row.count || 0
          break
        case 'Minor':
          minor += row.count || 0
          break
        case 'Trivial':
          trivial += row.count || 0
          break
        default:
          break
      }
    })

    const total = critical + major + minor + trivial

    return { critical, major, minor, trivial, total }
  }, [data, selectedMonth])

  // Trend comparison (latest vs previous month)
  const trendComparison = useMemo(() => {
    if (severityTrendData.length < 2) return null

    const latest = severityTrendData[severityTrendData.length - 1]
    const previous = severityTrendData[severityTrendData.length - 2]

    const latestTotal = latest.Critical + latest.Major + latest.Minor + latest.Trivial
    const previousTotal = previous.Critical + previous.Major + previous.Minor + previous.Trivial

    let totalTrend = 'neutral'
    if (latestTotal < previousTotal) totalTrend = 'up'
    else if (latestTotal > previousTotal) totalTrend = 'down'

    let criticalTrend = 'neutral'
    if (latest.Critical < previous.Critical) criticalTrend = 'up'
    else if (latest.Critical > previous.Critical) criticalTrend = 'down'

    return {
      latestTotal,
      previousTotal,
      totalTrend,
      criticalTrend,
      latestCritical: latest.Critical,
      previousCritical: previous.Critical,
      latestMonth: latest.month,
      previousMonth: previous.month,
    }
  }, [severityTrendData])

  // Table data: monthly severity breakdown
  const tableData = useMemo(() => {
    return severityTrendData.map((row) => ({
      month: row.month,
      critical: row.Critical,
      major: row.Major,
      minor: row.Minor,
      trivial: row.Trivial,
      total: row.Critical + row.Major + row.Minor + row.Trivial,
      criticalPct:
        row.Critical + row.Major + row.Minor + row.Trivial > 0
          ? Math.round(
              (row.Critical / (row.Critical + row.Major + row.Minor + row.Trivial)) * 1000
            ) / 10
          : 0,
    }))
  }, [severityTrendData])

  const tableColumns = useMemo(() => {
    return [
      {
        key: 'month',
        label: 'Month',
        editable: false,
        render: (value) => (
          <span className="font-medium text-enterprise-dark">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'critical',
        label: 'Critical',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700">
              {formatNumber(num)}
            </span>
          )
        },
      },
      {
        key: 'major',
        label: 'Major',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
              {formatNumber(num)}
            </span>
          )
        },
      },
      {
        key: 'minor',
        label: 'Minor',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
              {formatNumber(num)}
            </span>
          )
        },
      },
      {
        key: 'trivial',
        label: 'Trivial',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="text-enterprise-muted font-medium">{formatNumber(num)}</span>
          )
        },
      },
      {
        key: 'total',
        label: 'Total',
        editable: false,
        render: (value) => (
          <span className="font-semibold text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'criticalPct',
        label: 'Critical %',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num > 25) colorClass = 'text-danger-700 font-semibold'
          else if (num > 15) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{formatPercentage(num)}</span>
        },
      },
    ]
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading severity distribution data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <FilterBar visibleFilters={['release', 'severity']} />
        <EmptyState
          title="No Severity Distribution Data"
          message="No severity distribution data is available for the selected filters. Try adjusting your filter criteria."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">QE Defects by Severity</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly defect distribution by severity level showing Critical, Major, Minor, and Trivial trends over time
        </p>
      </div>

      <FilterBar visibleFilters={['release', 'severity']} />

      {/* Overall Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Defects"
          value={formatNumber(overallSeverityTotals.total)}
          color="primary"
          trend={trendComparison ? trendComparison.totalTrend : 'neutral'}
          trendValue={
            trendComparison
              ? `${formatNumber(trendComparison.latestTotal)} in ${trendComparison.latestMonth}`
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="Critical"
          value={formatNumber(overallSeverityTotals.Critical)}
          color={overallSeverityTotals.Critical > 50 ? 'danger' : overallSeverityTotals.Critical > 30 ? 'warning' : 'success'}
          trend={trendComparison ? trendComparison.criticalTrend : 'neutral'}
          trendValue={
            trendComparison
              ? `${formatNumber(trendComparison.latestCritical)} in ${trendComparison.latestMonth}`
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="Major"
          value={formatNumber(overallSeverityTotals.Major)}
          color="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="Minor"
          value={formatNumber(overallSeverityTotals.Minor)}
          color="info"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          }
        />
        <StatCard
          title="Trivial"
          value={formatNumber(overallSeverityTotals.Trivial)}
          color="secondary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" />
            </svg>
          }
        />
      </div>

      {/* Charts Row 1: Overall Pie & Stacked Bar by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Overall Severity Distribution"
          subtitle="Aggregated defect distribution across all months by severity"
        >
          {overallPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={overallPieData}
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
                  {overallPieData.map((entry, index) => (
                    <Cell key={`overall-${index}`} fill={entry.color} />
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

        <ChartCard
          title="Severity Distribution by Month"
          subtitle="Monthly breakdown of defects by severity level"
        >
          {sortedStackedData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sortedStackedData.data}
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
                {sortedStackedData.stackKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="severity"
                    fill={severityColors[key] || '#6c757d'}
                    radius={
                      idx === sortedStackedData.stackKeys.length - 1
                        ? [4, 4, 0, 0]
                        : [0, 0, 0, 0]
                    }
                    name={key}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Charts Row 2: Severity Trend Line & Critical Trend Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Severity Trend Over Time"
          subtitle="Monthly defect count trend by severity level"
        >
          {severityTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={severityTrendData}
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
                <Line
                  type="monotone"
                  dataKey="Critical"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="Critical"
                />
                <Line
                  type="monotone"
                  dataKey="Major"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="Major"
                />
                <Line
                  type="monotone"
                  dataKey="Minor"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="Minor"
                />
                <Line
                  type="monotone"
                  dataKey="Trivial"
                  stroke="#6c757d"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#6c757d', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                  name="Trivial"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Critical Defect Trend"
          subtitle="Monthly critical defects and cumulative trend"
        >
          {criticalTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={criticalTrendData}
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
                    const labels = { critical: 'Critical', cumulative: 'Cumulative' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { critical: 'Critical', cumulative: 'Cumulative' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <defs>
                  <linearGradient id="criticalCumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#criticalCumulativeGradient)"
                  name="cumulative"
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="critical"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Month Selector & Monthly Drilldown */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly Severity Drilldown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Select a month to view its severity distribution breakdown
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {months.map((month) => {
            const isActive = selectedMonth === month
            const monthData = severityTrendData.find((d) => d.month === month)
            const monthCritical = monthData ? monthData.Critical : 0

            return (
              <button
                key={month}
                type="button"
                onClick={() => setSelectedMonth(month)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-card'
                    : 'bg-enterprise-background text-enterprise-dark hover:bg-enterprise-border border border-enterprise-border'
                }`}
                aria-label={`Select month ${month}`}
                aria-pressed={isActive}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive
                      ? 'bg-white'
                      : monthCritical > 10
                        ? 'bg-danger-500'
                        : monthCritical > 5
                          ? 'bg-warning-500'
                          : 'bg-success-500'
                  }`}
                />
                <span className="truncate max-w-[120px]">{month}</span>
              </button>
            )
          })}
        </div>

        {/* Selected Month Summary */}
        {selectedMonthSummary && selectedMonth && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Total</p>
              <p className="mt-1 text-2xl font-bold text-enterprise-dark">
                {formatNumber(selectedMonthSummary.total)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Critical</p>
              <p className="mt-1 text-2xl font-bold text-danger-700">
                {formatNumber(selectedMonthSummary.critical)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Major</p>
              <p className="mt-1 text-2xl font-bold text-warning-700">
                {formatNumber(selectedMonthSummary.major)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Minor</p>
              <p className="mt-1 text-2xl font-bold text-info-700">
                {formatNumber(selectedMonthSummary.minor)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Trivial</p>
              <p className="mt-1 text-2xl font-bold text-enterprise-muted">
                {formatNumber(selectedMonthSummary.trivial)}
              </p>
            </div>
          </div>
        )}

        {/* Selected Month Pie Chart */}
        {selectedMonthPieData.length > 0 && selectedMonth && (
          <ChartCard
            title={`Severity Distribution — ${selectedMonth}`}
            subtitle={`Defect severity breakdown for ${selectedMonth}`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={selectedMonthPieData}
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
                  {selectedMonthPieData.map((entry, index) => (
                    <Cell key={`month-${index}`} fill={entry.color} />
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
          </ChartCard>
        )}
      </div>

      {/* Monthly Severity Data Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly Severity Breakdown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Detailed monthly defect counts by severity level with critical percentage
          </p>
        </div>
        <DataTable
          columns={tableColumns}
          data={tableData}
          pageSize={10}
          sortable={true}
          emptyMessage="No severity distribution data available"
        />
      </div>
    </div>
  )
}