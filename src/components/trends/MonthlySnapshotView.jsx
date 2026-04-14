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
import StatCard from '../common/StatCard.jsx'
import DataTable from '../common/DataTable.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getMonthlySnapshot } from '../../services/DashboardService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatNumber, formatPercentage } from '../../utils/formatters.js'
import { getChartColors } from '../../utils/chartHelpers.js'

export default function MonthlySnapshotView() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getMonthlySnapshot(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[MonthlySnapshotView] Error fetching monthly snapshot data:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const monthOrder = [
      'Oct 2025',
      'Nov 2025',
      'Dec 2025',
      'Jan 2026',
      'Feb 2026',
      'Mar 2026',
      'Apr 2026',
      'May 2026',
    ]

    return [...data].sort((a, b) => {
      const aIdx = monthOrder.indexOf(a.month)
      const bIdx = monthOrder.indexOf(b.month)
      if (aIdx === -1 && bIdx === -1) return a.month.localeCompare(b.month)
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })
  }, [data])

  const latestMonth = useMemo(() => {
    if (sortedData.length === 0) return null
    return sortedData[sortedData.length - 1]
  }, [sortedData])

  const previousMonth = useMemo(() => {
    if (sortedData.length < 2) return null
    return sortedData[sortedData.length - 2]
  }, [sortedData])

  const passRateTrend = useMemo(() => {
    if (!latestMonth || !previousMonth) return 'neutral'
    if (latestMonth.passRate > previousMonth.passRate) return 'up'
    if (latestMonth.passRate < previousMonth.passRate) return 'down'
    return 'neutral'
  }, [latestMonth, previousMonth])

  const defectTrend = useMemo(() => {
    if (!latestMonth || !previousMonth) return 'neutral'
    if (latestMonth.defectsOpened < previousMonth.defectsOpened) return 'up'
    if (latestMonth.defectsOpened > previousMonth.defectsOpened) return 'down'
    return 'neutral'
  }, [latestMonth, previousMonth])

  const defectClosureTrend = useMemo(() => {
    if (!latestMonth || !previousMonth) return 'neutral'
    if (latestMonth.defectsClosed > previousMonth.defectsClosed) return 'up'
    if (latestMonth.defectsClosed < previousMonth.defectsClosed) return 'down'
    return 'neutral'
  }, [latestMonth, previousMonth])

  const avgAgingTrend = useMemo(() => {
    if (!latestMonth || !previousMonth) return 'neutral'
    if (latestMonth.avgDefectAge < previousMonth.avgDefectAge) return 'up'
    if (latestMonth.avgDefectAge > previousMonth.avgDefectAge) return 'down'
    return 'neutral'
  }, [latestMonth, previousMonth])

  const executionTrendData = useMemo(() => {
    if (sortedData.length === 0) return []

    return sortedData.map((row) => ({
      month: row.month,
      totalTestCases: row.totalTestCases || 0,
      executed: row.executed || 0,
      passed: row.passed || 0,
      failed: row.failed || 0,
      blocked: row.blocked || 0,
    }))
  }, [sortedData])

  const passRateTrendData = useMemo(() => {
    if (sortedData.length === 0) return []

    return sortedData.map((row) => ({
      month: row.month,
      passRate: row.passRate || 0,
    }))
  }, [sortedData])

  const defectTrendData = useMemo(() => {
    if (sortedData.length === 0) return []

    return sortedData.map((row) => ({
      month: row.month,
      opened: row.defectsOpened || 0,
      closed: row.defectsClosed || 0,
      deferred: row.defectsDeferred || 0,
    }))
  }, [sortedData])

  const releaseRiskData = useMemo(() => {
    if (sortedData.length === 0) return []

    return sortedData.map((row) => ({
      month: row.month,
      onTrack: row.releasesOnTrack || 0,
      atRisk: row.releasesAtRisk || 0,
      total: row.releaseCount || 0,
    }))
  }, [sortedData])

  const latestTestResultsPie = useMemo(() => {
    if (!latestMonth) return []

    const results = [
      { name: 'Passed', value: latestMonth.passed || 0, color: '#22c55e' },
      { name: 'Failed', value: latestMonth.failed || 0, color: '#ef4444' },
      { name: 'Blocked', value: latestMonth.blocked || 0, color: '#f59e0b' },
    ].filter((item) => item.value > 0)

    return results
  }, [latestMonth])

  const defectAgingTrendData = useMemo(() => {
    if (sortedData.length === 0) return []

    return sortedData.map((row) => ({
      month: row.month,
      avgAge: row.avgDefectAge || 0,
    }))
  }, [sortedData])

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
        key: 'totalTestCases',
        label: 'Total Tests',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'executed',
        label: 'Executed',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'passed',
        label: 'Passed',
        editable: false,
        render: (value) => (
          <span className="text-success-700 font-medium">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'failed',
        label: 'Failed',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-danger-700 font-medium">{formatNumber(num)}</span>
        },
      },
      {
        key: 'blocked',
        label: 'Blocked',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-warning-700 font-medium">{formatNumber(num)}</span>
        },
      },
      {
        key: 'passRate',
        label: 'Pass Rate',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num >= 95) colorClass = 'text-success-700'
          else if (num >= 90) colorClass = 'text-warning-700'
          else colorClass = 'text-danger-700'
          return <span className={`font-medium ${colorClass}`}>{formatPercentage(num)}</span>
        },
      },
      {
        key: 'defectsOpened',
        label: 'Defects Opened',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          let colorClass = 'text-enterprise-dark'
          if (num > 60) colorClass = 'text-danger-700 font-semibold'
          else if (num > 40) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{formatNumber(num)}</span>
        },
      },
      {
        key: 'defectsClosed',
        label: 'Defects Closed',
        editable: false,
        render: (value) => (
          <span className="text-success-700 font-medium">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'defectsDeferred',
        label: 'Deferred',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-enterprise-muted font-medium">{formatNumber(num)}</span>
        },
      },
      {
        key: 'avgDefectAge',
        label: 'Avg Aging (days)',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num > 11) colorClass = 'text-danger-700 font-semibold'
          else if (num > 9) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{num.toFixed(1)}</span>
        },
      },
      {
        key: 'releaseCount',
        label: 'Releases',
        editable: false,
        render: (value) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
            {formatNumber(value)}
          </span>
        ),
      },
      {
        key: 'releasesOnTrack',
        label: 'On Track',
        editable: false,
        render: (value) => (
          <span className="text-success-700 font-medium">{formatNumber(value)}</span>
        ),
      },
      {
        key: 'releasesAtRisk',
        label: 'At Risk',
        editable: false,
        render: (value) => {
          const num = Number(value || 0)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return <span className="text-danger-700 font-semibold">{formatNumber(num)}</span>
        },
      },
    ]
  }, [])

  const defaultColors = useMemo(() => getChartColors(), [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading monthly snapshot data..." />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Monthly Snapshot Data"
        message="No monthly snapshot data is available for the selected filters. Try adjusting your filter criteria."
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Monthly QE Delivery Snapshot</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly trends and key quality engineering metrics across releases, test execution, and defect management
        </p>
      </div>

      {/* Latest Month Summary Stats */}
      {latestMonth && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Test Cases"
            value={formatNumber(latestMonth.totalTestCases)}
            subtitle={latestMonth.month}
            color="primary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
              </svg>
            }
          />
          <StatCard
            title="Pass Rate"
            value={formatPercentage(latestMonth.passRate)}
            subtitle={latestMonth.month}
            color={latestMonth.passRate >= 95 ? 'success' : latestMonth.passRate >= 90 ? 'warning' : 'danger'}
            trend={passRateTrend}
            trendValue={previousMonth ? `${latestMonth.passRate > previousMonth.passRate ? '+' : ''}${(latestMonth.passRate - previousMonth.passRate).toFixed(1)}%` : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Defects Opened"
            value={formatNumber(latestMonth.defectsOpened)}
            subtitle={latestMonth.month}
            color={latestMonth.defectsOpened > 60 ? 'danger' : latestMonth.defectsOpened > 40 ? 'warning' : 'success'}
            trend={defectTrend}
            trendValue={previousMonth ? `${latestMonth.defectsOpened - previousMonth.defectsOpened > 0 ? '+' : ''}${latestMonth.defectsOpened - previousMonth.defectsOpened}` : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
          <StatCard
            title="Defects Closed"
            value={formatNumber(latestMonth.defectsClosed)}
            subtitle={latestMonth.month}
            color="success"
            trend={defectClosureTrend}
            trendValue={previousMonth ? `${latestMonth.defectsClosed - previousMonth.defectsClosed > 0 ? '+' : ''}${latestMonth.defectsClosed - previousMonth.defectsClosed}` : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Avg Defect Age"
            value={`${latestMonth.avgDefectAge} days`}
            subtitle={latestMonth.month}
            color={latestMonth.avgDefectAge > 11 ? 'danger' : latestMonth.avgDefectAge > 9 ? 'warning' : 'success'}
            trend={avgAgingTrend}
            trendValue={previousMonth ? `${latestMonth.avgDefectAge - previousMonth.avgDefectAge > 0 ? '+' : ''}${(latestMonth.avgDefectAge - previousMonth.avgDefectAge).toFixed(1)} days` : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Releases"
            value={formatNumber(latestMonth.releaseCount)}
            subtitle={`${formatNumber(latestMonth.releasesOnTrack)} on track, ${formatNumber(latestMonth.releasesAtRisk)} at risk`}
            color={latestMonth.releasesAtRisk === 0 ? 'success' : 'danger'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts Row 1: Test Execution Trend & Pass Rate Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Test Execution Trend"
          subtitle="Monthly test case execution breakdown (passed, failed, blocked)"
        >
          {executionTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={executionTrendData}
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
                <Bar dataKey="passed" fill="#22c55e" stackId="execution" name="passed" />
                <Bar dataKey="failed" fill="#ef4444" stackId="execution" name="failed" />
                <Bar dataKey="blocked" fill="#f59e0b" stackId="execution" radius={[4, 4, 0, 0]} name="blocked" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Pass Rate Trend"
          subtitle="Monthly test pass rate percentage over time"
        >
          {passRateTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={passRateTrendData}
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
                  domain={[85, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value) => [formatPercentage(value), 'Pass Rate']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={() => (
                    <span className="text-xs text-enterprise-muted">Pass Rate</span>
                  )}
                />
                <defs>
                  <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="passRate"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#passRateGradient)"
                  name="passRate"
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Charts Row 2: Defect Trend & Latest Month Test Results Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Defect Trend"
          subtitle="Monthly defects opened, closed, and deferred"
        >
          {defectTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={defectTrendData}
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
          title={`Test Results — ${latestMonth ? latestMonth.month : 'Latest'}`}
          subtitle="Passed, failed, and blocked test distribution for the latest month"
        >
          {latestTestResultsPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={latestTestResultsPie}
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
                  {latestTestResultsPie.map((entry, index) => (
                    <Cell key={`result-${index}`} fill={entry.color} />
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

      {/* Charts Row 3: Release Risk Trend & Defect Aging Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Release Risk Trend"
          subtitle="Monthly releases on track vs at risk"
        >
          {releaseRiskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={releaseRiskData}
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
                    const labels = { onTrack: 'On Track', atRisk: 'At Risk' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { onTrack: 'On Track', atRisk: 'At Risk' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <Bar dataKey="onTrack" fill="#22c55e" stackId="releases" name="onTrack" />
                <Bar dataKey="atRisk" fill="#ef4444" stackId="releases" radius={[4, 4, 0, 0]} name="atRisk" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Avg Defect Aging Trend"
          subtitle="Average defect age in days over time"
        >
          {defectAgingTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={defectAgingTrendData}
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
                  tickFormatter={(value) => `${value}d`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value) => [`${value} days`, 'Avg Age']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={() => (
                    <span className="text-xs text-enterprise-muted">Avg Defect Age</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="avgAge"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="avgAge"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Monthly Data Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly Snapshot Data</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Detailed monthly breakdown of test execution, defect metrics, and release status
          </p>
        </div>
        <DataTable
          columns={tableColumns}
          data={sortedData}
          pageSize={10}
          sortable={true}
          emptyMessage="No monthly snapshot data available"
        />
      </div>
    </div>
  )
}