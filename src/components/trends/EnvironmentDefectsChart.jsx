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
import { getEnvironmentDefects } from '../../services/DefectService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatNumber, formatPercentage } from '../../utils/formatters.js'
import { getChartColors, transformToPieData, buildStackedBarData } from '../../utils/chartHelpers.js'

export default function EnvironmentDefectsChart() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getEnvironmentDefects(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[EnvironmentDefectsChart] Error fetching environment defects:', err)
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

  const environments = useMemo(() => {
    if (!data || data.length === 0) return []

    const envSet = new Set()
    data.forEach((row) => {
      if (row.environment) {
        envSet.add(row.environment)
      }
    })

    return Array.from(envSet).sort((a, b) => a.localeCompare(b))
  }, [data])

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

  // Auto-select latest month if none selected
  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1])
    }
    if (months.length > 0 && selectedMonth && !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1])
    }
  }, [months, selectedMonth])

  const ENV_COLORS = useMemo(() => ({
    SIT: '#4f46e5',
    UAT: '#f59e0b',
    'Pre-Prod': '#8b5cf6',
    Performance: '#06b6d4',
    Integration: '#ec4899',
    Staging: '#84cc16',
    Production: '#ef4444',
  }), [])

  // Overall environment totals across all months
  const overallEnvTotals = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, byEnv: {} }

    const byEnv = {}
    let total = 0

    data.forEach((row) => {
      const env = row.environment || 'Unknown'
      const opened = row.opened || 0
      if (!byEnv[env]) {
        byEnv[env] = { opened: 0, closed: 0 }
      }
      byEnv[env].opened += opened
      byEnv[env].closed += row.closed || 0
      total += opened
    })

    return { total, byEnv }
  }, [data])

  // Stacked bar: defects by application stacked by environment (all months)
  const stackedByAppAndEnv = useMemo(() => {
    if (!data || data.length === 0) return { data: [], stackKeys: [] }

    return buildStackedBarData(data, {
      categoryField: 'application',
      stackField: 'environment',
      valueField: 'opened',
      stackOrder: ['SIT', 'UAT', 'Pre-Prod', 'Performance', 'Integration', 'Staging', 'Production'],
    })
  }, [data])

  // Stacked bar: defects by application stacked by environment for selected month
  const selectedMonthStackedData = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return { data: [], stackKeys: [] }

    const monthData = data.filter((row) => row.month === selectedMonth)

    return buildStackedBarData(monthData, {
      categoryField: 'application',
      stackField: 'environment',
      valueField: 'opened',
      stackOrder: ['SIT', 'UAT', 'Pre-Prod', 'Performance', 'Integration', 'Staging', 'Production'],
    })
  }, [data, selectedMonth])

  // Pie chart: environment distribution for selected month
  const selectedMonthPieData = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return []

    const monthData = data.filter((row) => row.month === selectedMonth)

    const envMap = {}

    monthData.forEach((row) => {
      const env = row.environment || 'Unknown'
      if (!envMap[env]) {
        envMap[env] = 0
      }
      envMap[env] += row.opened || 0
    })

    return Object.entries(envMap).map(([name, value]) => ({
      name,
      value,
      color: ENV_COLORS[name] || '#6c757d',
    }))
  }, [data, selectedMonth, ENV_COLORS])

  // Overall pie chart data (all months aggregated)
  const overallPieData = useMemo(() => {
    if (!data || data.length === 0) return []

    const envMap = {}

    data.forEach((row) => {
      const env = row.environment || 'Unknown'
      if (!envMap[env]) {
        envMap[env] = 0
      }
      envMap[env] += row.opened || 0
    })

    return Object.entries(envMap).map(([name, value]) => ({
      name,
      value,
      color: ENV_COLORS[name] || '#6c757d',
    }))
  }, [data, ENV_COLORS])

  // Environment trend by month (line chart)
  const envTrendData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = {}

    data.forEach((row) => {
      const month = row.month
      if (!month) return

      if (!grouped[month]) {
        grouped[month] = { month }
      }

      const env = row.environment || 'Unknown'
      if (grouped[month][env] === undefined) {
        grouped[month][env] = 0
      }
      grouped[month][env] += row.opened || 0
    })

    return months.map((month) => {
      const row = grouped[month] || { month }
      environments.forEach((env) => {
        if (row[env] === undefined) {
          row[env] = 0
        }
      })
      return row
    })
  }, [data, months, environments])

  // Stacked bar: defects by month stacked by environment
  const stackedByMonthAndEnv = useMemo(() => {
    if (!data || data.length === 0) return { data: [], stackKeys: [] }

    return buildStackedBarData(data, {
      categoryField: 'month',
      stackField: 'environment',
      valueField: 'opened',
      stackOrder: ['SIT', 'UAT', 'Pre-Prod', 'Performance', 'Integration', 'Staging', 'Production'],
    })
  }, [data])

  // Sort stacked by month data
  const sortedMonthStackedData = useMemo(() => {
    if (!stackedByMonthAndEnv.data || stackedByMonthAndEnv.data.length === 0) {
      return { data: [], stackKeys: stackedByMonthAndEnv.stackKeys }
    }

    const sorted = [...stackedByMonthAndEnv.data].sort((a, b) => sortByMonth(a.month, b.month))

    return { data: sorted, stackKeys: stackedByMonthAndEnv.stackKeys }
  }, [stackedByMonthAndEnv, sortByMonth])

  // Selected month summary
  const selectedMonthSummary = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return null

    const monthData = data.filter((row) => row.month === selectedMonth)

    const envCounts = {}
    let totalOpened = 0
    let totalClosed = 0

    monthData.forEach((row) => {
      const env = row.environment || 'Unknown'
      if (!envCounts[env]) {
        envCounts[env] = { opened: 0, closed: 0 }
      }
      envCounts[env].opened += row.opened || 0
      envCounts[env].closed += row.closed || 0
      totalOpened += row.opened || 0
      totalClosed += row.closed || 0
    })

    return { envCounts, totalOpened, totalClosed, total: totalOpened }
  }, [data, selectedMonth])

  // Trend comparison (latest vs previous month)
  const trendComparison = useMemo(() => {
    if (envTrendData.length < 2) return null

    const latest = envTrendData[envTrendData.length - 1]
    const previous = envTrendData[envTrendData.length - 2]

    let latestTotal = 0
    let previousTotal = 0

    environments.forEach((env) => {
      latestTotal += latest[env] || 0
      previousTotal += previous[env] || 0
    })

    let totalTrend = 'neutral'
    if (latestTotal < previousTotal) totalTrend = 'up'
    else if (latestTotal > previousTotal) totalTrend = 'down'

    // SIT trend
    const latestSIT = latest['SIT'] || 0
    const previousSIT = previous['SIT'] || 0
    let sitTrend = 'neutral'
    if (latestSIT < previousSIT) sitTrend = 'up'
    else if (latestSIT > previousSIT) sitTrend = 'down'

    // Production trend
    const latestProd = latest['Production'] || 0
    const previousProd = previous['Production'] || 0
    let prodTrend = 'neutral'
    if (latestProd < previousProd) prodTrend = 'up'
    else if (latestProd > previousProd) prodTrend = 'down'

    return {
      latestTotal,
      previousTotal,
      totalTrend,
      sitTrend,
      prodTrend,
      latestSIT,
      previousSIT,
      latestProd,
      previousProd,
      latestMonth: latest.month,
      previousMonth: previous.month,
    }
  }, [envTrendData, environments])

  // Table data: per-application per-environment summary
  const tableData = useMemo(() => {
    if (!data || data.length === 0) return []

    const appMap = {}

    data.forEach((row) => {
      const app = row.application || 'Unknown'
      if (!appMap[app]) {
        appMap[app] = { application: app, total: 0, SIT: 0, UAT: 0, 'Pre-Prod': 0, Performance: 0, Integration: 0, Staging: 0, Production: 0 }
      }

      const env = row.environment || 'Unknown'
      const opened = row.opened || 0

      appMap[app].total += opened
      if (appMap[app][env] !== undefined) {
        appMap[app][env] += opened
      }
    })

    return Object.values(appMap).sort((a, b) => b.total - a.total)
  }, [data])

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
        key: 'total',
        label: 'Total',
        editable: false,
        render: (value) => (
          <span className="font-semibold text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'SIT',
        label: 'SIT',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
              {formatNumber(num)}
            </span>
          )
        },
      },
      {
        key: 'UAT',
        label: 'UAT',
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
        key: 'Pre-Prod',
        label: 'Pre-Prod',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="text-enterprise-dark font-medium">{formatNumber(num)}</span>
          )
        },
      },
      {
        key: 'Performance',
        label: 'Performance',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="text-enterprise-dark font-medium">{formatNumber(num)}</span>
          )
        },
      },
      {
        key: 'Integration',
        label: 'Integration',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="text-enterprise-dark font-medium">{formatNumber(num)}</span>
          )
        },
      },
      {
        key: 'Production',
        label: 'Production',
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
    ]
  }, [])

  // Compute overall env stat counts for summary cards
  const sitTotal = useMemo(() => {
    return overallEnvTotals.byEnv['SIT'] ? overallEnvTotals.byEnv['SIT'].opened : 0
  }, [overallEnvTotals])

  const uatTotal = useMemo(() => {
    return overallEnvTotals.byEnv['UAT'] ? overallEnvTotals.byEnv['UAT'].opened : 0
  }, [overallEnvTotals])

  const prodTotal = useMemo(() => {
    return overallEnvTotals.byEnv['Production'] ? overallEnvTotals.byEnv['Production'].opened : 0
  }, [overallEnvTotals])

  const preProdTotal = useMemo(() => {
    return overallEnvTotals.byEnv['Pre-Prod'] ? overallEnvTotals.byEnv['Pre-Prod'].opened : 0
  }, [overallEnvTotals])

  const perfTotal = useMemo(() => {
    return overallEnvTotals.byEnv['Performance'] ? overallEnvTotals.byEnv['Performance'].opened : 0
  }, [overallEnvTotals])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading environment defect data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <FilterBar visibleFilters={['release', 'application', 'environment']} />
        <EmptyState
          title="No Environment Defect Data"
          message="No environment defect data is available for the selected filters. Try adjusting your filter criteria."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">SIT, UAT & Prod Defects by Application</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Defect distribution by application across SIT, UAT, Pre-Prod, Performance, Integration, and Production environments
        </p>
      </div>

      <FilterBar visibleFilters={['release', 'application', 'environment']} />

      {/* Overall Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Defects"
          value={formatNumber(overallEnvTotals.total)}
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
          title="SIT"
          value={formatNumber(sitTotal)}
          color="info"
          trend={trendComparison ? trendComparison.sitTrend : 'neutral'}
          trendValue={
            trendComparison
              ? `${formatNumber(trendComparison.latestSIT)} in ${trendComparison.latestMonth}`
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="UAT"
          value={formatNumber(uatTotal)}
          color="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
        />
        <StatCard
          title="Pre-Prod"
          value={formatNumber(preProdTotal)}
          color="secondary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="Performance"
          value={formatNumber(perfTotal)}
          color="primary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          title="Production"
          value={formatNumber(prodTotal)}
          color={prodTotal > 20 ? 'danger' : prodTotal > 10 ? 'warning' : 'success'}
          trend={trendComparison ? trendComparison.prodTrend : 'neutral'}
          trendValue={
            trendComparison
              ? `${formatNumber(trendComparison.latestProd)} in ${trendComparison.latestMonth}`
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          }
        />
      </div>

      {/* Charts Row 1: Overall Stacked Bar by Application & Overall Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Defects by Application & Environment"
          subtitle="Total defects per application stacked by environment across all months"
        >
          {stackedByAppAndEnv.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stackedByAppAndEnv.data}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="application"
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
                {stackedByAppAndEnv.stackKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="env"
                    fill={ENV_COLORS[key] || '#6c757d'}
                    radius={
                      idx === stackedByAppAndEnv.stackKeys.length - 1
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

        <ChartCard
          title="Overall Environment Distribution"
          subtitle="Aggregated defect distribution across all environments"
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
      </div>

      {/* Charts Row 2: Environment Trend by Month & Stacked by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Environment Defect Trend Over Time"
          subtitle="Monthly defect count trend by environment"
        >
          {envTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={envTrendData}
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
                {environments.map((env) => (
                  <Line
                    key={env}
                    type="monotone"
                    dataKey={env}
                    stroke={ENV_COLORS[env] || '#6c757d'}
                    strokeWidth={2}
                    dot={{ r: 4, fill: ENV_COLORS[env] || '#6c757d', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                    name={env}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Monthly Environment Distribution"
          subtitle="Monthly breakdown of defects stacked by environment"
        >
          {sortedMonthStackedData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sortedMonthStackedData.data}
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
                {sortedMonthStackedData.stackKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="env"
                    fill={ENV_COLORS[key] || '#6c757d'}
                    radius={
                      idx === sortedMonthStackedData.stackKeys.length - 1
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

      {/* Month Selector & Monthly Drilldown */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly Environment Drilldown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Select a month to view its environment defect distribution breakdown by application
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {months.map((month) => {
            const isActive = selectedMonth === month
            const monthRow = envTrendData.find((d) => d.month === month)
            let monthProd = 0
            if (monthRow) {
              monthProd = monthRow['Production'] || 0
            }

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
                      : monthProd > 3
                        ? 'bg-danger-500'
                        : monthProd > 0
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Total Opened</p>
              <p className="mt-1 text-2xl font-bold text-enterprise-dark">
                {formatNumber(selectedMonthSummary.totalOpened)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Total Closed</p>
              <p className="mt-1 text-2xl font-bold text-success-700">
                {formatNumber(selectedMonthSummary.totalClosed)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">SIT</p>
              <p className="mt-1 text-2xl font-bold text-primary-700">
                {formatNumber(selectedMonthSummary.envCounts['SIT'] ? selectedMonthSummary.envCounts['SIT'].opened : 0)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Production</p>
              <p className={`mt-1 text-2xl font-bold ${
                (selectedMonthSummary.envCounts['Production'] ? selectedMonthSummary.envCounts['Production'].opened : 0) > 3
                  ? 'text-danger-700'
                  : (selectedMonthSummary.envCounts['Production'] ? selectedMonthSummary.envCounts['Production'].opened : 0) > 0
                    ? 'text-warning-700'
                    : 'text-success-700'
              }`}>
                {formatNumber(selectedMonthSummary.envCounts['Production'] ? selectedMonthSummary.envCounts['Production'].opened : 0)}
              </p>
            </div>
          </div>
        )}

        {/* Selected Month Charts */}
        {selectedMonth && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={`Defects by Application & Environment — ${selectedMonth}`}
              subtitle={`Application defect breakdown stacked by environment for ${selectedMonth}`}
            >
              {selectedMonthStackedData.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={selectedMonthStackedData.data}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                    <XAxis
                      dataKey="application"
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
                    {selectedMonthStackedData.stackKeys.map((key, idx) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="env"
                        fill={ENV_COLORS[key] || '#6c757d'}
                        radius={
                          idx === selectedMonthStackedData.stackKeys.length - 1
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

            <ChartCard
              title={`Environment Distribution — ${selectedMonth}`}
              subtitle={`Defect distribution across environments for ${selectedMonth}`}
            >
              {selectedMonthPieData.length > 0 ? (
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
              ) : null}
            </ChartCard>
          </div>
        )}
      </div>

      {/* Application Environment Summary Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Application Environment Defect Summary</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Aggregated defect counts per application across all environments and months
          </p>
        </div>
        <DataTable
          columns={tableColumns}
          data={tableData}
          pageSize={10}
          sortable={true}
          emptyMessage="No environment defect data available"
        />
      </div>
    </div>
  )
}