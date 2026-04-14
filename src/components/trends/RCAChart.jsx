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
import { getRCAData } from '../../services/DefectService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatNumber, formatPercentage } from '../../utils/formatters.js'
import { getChartColors, transformToPieData, buildStackedBarData } from '../../utils/chartHelpers.js'

const RCA_COLORS = {
  'Code Defect': '#ef4444',
  'Requirements Gap': '#f59e0b',
  'Environment Issue': '#8b5cf6',
  'Data Issue': '#3b82f6',
  'Integration Defect': '#ec4899',
  'Configuration Error': '#06b6d4',
  'Third Party': '#6c757d',
}

export default function RCAChart() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getRCAData(filters)
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('[RCAChart] Error fetching RCA data:', err)
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

  const categories = useMemo(() => {
    if (!data || data.length === 0) return []

    const catSet = new Set()
    data.forEach((row) => {
      if (row.category) {
        catSet.add(row.category)
      }
    })

    return Array.from(catSet).sort((a, b) => a.localeCompare(b))
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

  // Overall RCA totals across all months
  const overallRCATotals = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, byCategory: {} }

    const byCategory = {}
    let total = 0

    data.forEach((row) => {
      const cat = row.category || 'Unknown'
      const count = row.count || 0
      if (!byCategory[cat]) {
        byCategory[cat] = 0
      }
      byCategory[cat] += count
      total += count
    })

    return { total, byCategory }
  }, [data])

  // Overall pie chart data (all months aggregated)
  const overallPieData = useMemo(() => {
    if (!data || data.length === 0) return []

    const catMap = {}

    data.forEach((row) => {
      const cat = row.category || 'Unknown'
      if (!catMap[cat]) {
        catMap[cat] = 0
      }
      catMap[cat] += row.count || 0
    })

    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value,
        color: RCA_COLORS[name] || '#6c757d',
      }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  // Stacked bar chart: RCA category by month
  const stackedByMonthAndCategory = useMemo(() => {
    if (!data || data.length === 0) return { data: [], stackKeys: [] }

    return buildStackedBarData(data, {
      categoryField: 'month',
      stackField: 'category',
      valueField: 'count',
      stackOrder: [
        'Code Defect',
        'Requirements Gap',
        'Environment Issue',
        'Data Issue',
        'Integration Defect',
        'Configuration Error',
        'Third Party',
      ],
    })
  }, [data])

  // Sort stacked bar data by month order
  const sortedMonthStackedData = useMemo(() => {
    if (!stackedByMonthAndCategory.data || stackedByMonthAndCategory.data.length === 0) {
      return { data: [], stackKeys: stackedByMonthAndCategory.stackKeys }
    }

    const sorted = [...stackedByMonthAndCategory.data].sort((a, b) => sortByMonth(a.month, b.month))

    return { data: sorted, stackKeys: stackedByMonthAndCategory.stackKeys }
  }, [stackedByMonthAndCategory, sortByMonth])

  // RCA trend line chart data
  const rcaTrendData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = {}

    data.forEach((row) => {
      const month = row.month
      if (!month) return

      if (!grouped[month]) {
        grouped[month] = { month }
      }

      const cat = row.category || 'Unknown'
      if (grouped[month][cat] === undefined) {
        grouped[month][cat] = 0
      }
      grouped[month][cat] += row.count || 0
    })

    return months.map((month) => {
      const row = grouped[month] || { month }
      categories.forEach((cat) => {
        if (row[cat] === undefined) {
          row[cat] = 0
        }
      })
      return row
    })
  }, [data, months, categories])

  // Code Defect trend (area chart) - most common RCA
  const codeDefectTrendData = useMemo(() => {
    if (!rcaTrendData || rcaTrendData.length === 0) return []

    let cumulative = 0
    return rcaTrendData.map((row) => {
      const codeDefect = row['Code Defect'] || 0
      cumulative += codeDefect
      return {
        month: row.month,
        codeDefect,
        cumulative,
      }
    })
  }, [rcaTrendData])

  // Selected month pie data
  const selectedMonthPieData = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return []

    const monthData = data.filter((row) => row.month === selectedMonth)

    return monthData
      .map((row) => ({
        name: row.category || 'Unknown',
        value: row.count || 0,
        color: RCA_COLORS[row.category] || '#6c757d',
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data, selectedMonth])

  // Selected month summary
  const selectedMonthSummary = useMemo(() => {
    if (!data || data.length === 0 || !selectedMonth) return null

    const monthData = data.filter((row) => row.month === selectedMonth)

    const catCounts = {}
    let total = 0

    monthData.forEach((row) => {
      const cat = row.category || 'Unknown'
      if (!catCounts[cat]) {
        catCounts[cat] = 0
      }
      catCounts[cat] += row.count || 0
      total += row.count || 0
    })

    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      catCounts,
      total,
      topCategory: topCategory ? topCategory[0] : 'N/A',
      topCategoryCount: topCategory ? topCategory[1] : 0,
      topCategoryPct: topCategory && total > 0
        ? Math.round((topCategory[1] / total) * 1000) / 10
        : 0,
    }
  }, [data, selectedMonth])

  // Trend comparison (latest vs previous month)
  const trendComparison = useMemo(() => {
    if (rcaTrendData.length < 2) return null

    const latest = rcaTrendData[rcaTrendData.length - 1]
    const previous = rcaTrendData[rcaTrendData.length - 2]

    let latestTotal = 0
    let previousTotal = 0

    categories.forEach((cat) => {
      latestTotal += latest[cat] || 0
      previousTotal += previous[cat] || 0
    })

    let totalTrend = 'neutral'
    if (latestTotal < previousTotal) totalTrend = 'up'
    else if (latestTotal > previousTotal) totalTrend = 'down'

    // Code Defect trend
    const latestCodeDefect = latest['Code Defect'] || 0
    const previousCodeDefect = previous['Code Defect'] || 0
    let codeDefectTrend = 'neutral'
    if (latestCodeDefect < previousCodeDefect) codeDefectTrend = 'up'
    else if (latestCodeDefect > previousCodeDefect) codeDefectTrend = 'down'

    // Requirements Gap trend
    const latestReqGap = latest['Requirements Gap'] || 0
    const previousReqGap = previous['Requirements Gap'] || 0
    let reqGapTrend = 'neutral'
    if (latestReqGap < previousReqGap) reqGapTrend = 'up'
    else if (latestReqGap > previousReqGap) reqGapTrend = 'down'

    return {
      latestTotal,
      previousTotal,
      totalTrend,
      codeDefectTrend,
      reqGapTrend,
      latestCodeDefect,
      previousCodeDefect,
      latestReqGap,
      previousReqGap,
      latestMonth: latest.month,
      previousMonth: previous.month,
    }
  }, [rcaTrendData, categories])

  // Top RCA categories overall
  const topCategories = useMemo(() => {
    if (!overallRCATotals.byCategory || Object.keys(overallRCATotals.byCategory).length === 0) return []

    return Object.entries(overallRCATotals.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        count,
        pct: overallRCATotals.total > 0
          ? Math.round((count / overallRCATotals.total) * 1000) / 10
          : 0,
      }))
  }, [overallRCATotals])

  // Table data: monthly RCA breakdown
  const tableData = useMemo(() => {
    return rcaTrendData.map((row) => {
      let total = 0
      categories.forEach((cat) => {
        total += row[cat] || 0
      })

      const codeDefect = row['Code Defect'] || 0
      const codeDefectPct = total > 0
        ? Math.round((codeDefect / total) * 1000) / 10
        : 0

      return {
        month: row.month,
        'Code Defect': codeDefect,
        'Requirements Gap': row['Requirements Gap'] || 0,
        'Environment Issue': row['Environment Issue'] || 0,
        'Data Issue': row['Data Issue'] || 0,
        'Integration Defect': row['Integration Defect'] || 0,
        'Configuration Error': row['Configuration Error'] || 0,
        'Third Party': row['Third Party'] || 0,
        total,
        codeDefectPct,
      }
    })
  }, [rcaTrendData, categories])

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
        key: 'Code Defect',
        label: 'Code Defect',
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
        key: 'Requirements Gap',
        label: 'Req Gap',
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
        key: 'Environment Issue',
        label: 'Env Issue',
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
        key: 'Data Issue',
        label: 'Data Issue',
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
        key: 'Integration Defect',
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
        key: 'Configuration Error',
        label: 'Config Error',
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
        key: 'Third Party',
        label: 'Third Party',
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
        key: 'codeDefectPct',
        label: 'Code Defect %',
        editable: false,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span className="text-enterprise-muted">N/A</span>
          }
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num > 35) colorClass = 'text-danger-700 font-semibold'
          else if (num > 25) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{formatPercentage(num)}</span>
        },
      },
    ]
  }, [])

  // Compute individual category totals for summary cards
  const codeDefectTotal = useMemo(() => {
    return overallRCATotals.byCategory['Code Defect'] || 0
  }, [overallRCATotals])

  const reqGapTotal = useMemo(() => {
    return overallRCATotals.byCategory['Requirements Gap'] || 0
  }, [overallRCATotals])

  const envIssueTotal = useMemo(() => {
    return overallRCATotals.byCategory['Environment Issue'] || 0
  }, [overallRCATotals])

  const dataIssueTotal = useMemo(() => {
    return overallRCATotals.byCategory['Data Issue'] || 0
  }, [overallRCATotals])

  const integrationTotal = useMemo(() => {
    return overallRCATotals.byCategory['Integration Defect'] || 0
  }, [overallRCATotals])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading RCA data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <FilterBar visibleFilters={['release']} />
        <EmptyState
          title="No RCA Data"
          message="No Root Cause Analysis data is available for the selected filters. Try adjusting your filter criteria."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Root Cause Analysis (RCA)</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly defect root cause categorization showing Code Defect, Requirements Gap, Environment Issue, Data Issue, Integration Defect, Configuration Error, and Third Party trends
        </p>
      </div>

      <FilterBar visibleFilters={['release']} />

      {/* Overall Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Defects"
          value={formatNumber(overallRCATotals.total)}
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
          title="Code Defect"
          value={formatNumber(codeDefectTotal)}
          color={codeDefectTotal > 100 ? 'danger' : codeDefectTotal > 60 ? 'warning' : 'success'}
          trend={trendComparison ? trendComparison.codeDefectTrend : 'neutral'}
          trendValue={
            trendComparison
              ? `${formatNumber(trendComparison.latestCodeDefect)} in ${trendComparison.latestMonth}`
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          }
        />
        <StatCard
          title="Req Gap"
          value={formatNumber(reqGapTotal)}
          color="warning"
          trend={trendComparison ? trendComparison.reqGapTrend : 'neutral'}
          trendValue={
            trendComparison
              ? `${formatNumber(trendComparison.latestReqGap)} in ${trendComparison.latestMonth}`
              : undefined
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <StatCard
          title="Env Issue"
          value={formatNumber(envIssueTotal)}
          color="secondary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="Data Issue"
          value={formatNumber(dataIssueTotal)}
          color="info"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
        />
        <StatCard
          title="Integration"
          value={formatNumber(integrationTotal)}
          color="primary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-6.364-6.364L4.5 8.257a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
        />
      </div>

      {/* Top RCA Categories Banner */}
      {topCategories.length > 0 && (
        <div className="card">
          <div className="mb-4">
            <h3 className="section-title">Top Root Causes</h3>
            <p className="mt-1 text-sm text-enterprise-muted">
              Most frequent root cause categories across all months
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {topCategories.map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-enterprise-background text-enterprise-dark text-sm font-bold">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: RCA_COLORS[cat.name] || '#6c757d' }}
                    />
                    <span className="text-sm font-medium text-enterprise-dark">{cat.name}</span>
                  </div>
                  <span className="text-xs text-enterprise-muted">
                    {formatNumber(cat.count)} defects ({formatPercentage(cat.pct)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1: Overall Pie & Stacked Bar by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Overall RCA Distribution"
          subtitle="Aggregated root cause distribution across all months"
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
          title="RCA Distribution by Month"
          subtitle="Monthly breakdown of defects by root cause category"
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
                    stackId="rca"
                    fill={RCA_COLORS[key] || '#6c757d'}
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

      {/* Charts Row 2: RCA Trend Line & Code Defect Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="RCA Trend Over Time"
          subtitle="Monthly defect count trend by root cause category"
        >
          {rcaTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={rcaTrendData}
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
                {categories.map((cat) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={RCA_COLORS[cat] || '#6c757d'}
                    strokeWidth={2}
                    dot={{ r: 4, fill: RCA_COLORS[cat] || '#6c757d', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                    name={cat}
                    strokeDasharray={cat === 'Third Party' || cat === 'Configuration Error' ? '5 5' : undefined}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        <ChartCard
          title="Code Defect Trend"
          subtitle="Monthly code defects and cumulative trend"
        >
          {codeDefectTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={codeDefectTrendData}
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
                    const labels = { codeDefect: 'Code Defect', cumulative: 'Cumulative' }
                    return [formatNumber(value), labels[name] || name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const labels = { codeDefect: 'Code Defect', cumulative: 'Cumulative' }
                    return (
                      <span className="text-xs text-enterprise-muted">
                        {labels[value] || value}
                      </span>
                    )
                  }}
                />
                <defs>
                  <linearGradient id="codeDefectCumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#codeDefectCumulativeGradient)"
                  name="cumulative"
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                />
                <Line
                  type="monotone"
                  dataKey="codeDefect"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="codeDefect"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>
      </div>

      {/* Month Selector & Monthly Drilldown */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly RCA Drilldown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Select a month to view its root cause distribution breakdown
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {months.map((month) => {
            const isActive = selectedMonth === month
            const monthData = rcaTrendData.find((d) => d.month === month)
            const monthCodeDefect = monthData ? monthData['Code Defect'] || 0 : 0

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
                      : monthCodeDefect > 20
                        ? 'bg-danger-500'
                        : monthCodeDefect > 10
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
              <p className="text-sm font-medium text-enterprise-muted">Total Defects</p>
              <p className="mt-1 text-2xl font-bold text-enterprise-dark">
                {formatNumber(selectedMonthSummary.total)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Top Category</p>
              <p className="mt-1 text-lg font-bold text-enterprise-dark truncate" title={selectedMonthSummary.topCategory}>
                {selectedMonthSummary.topCategory}
              </p>
              <p className="text-xs text-enterprise-muted">
                {formatNumber(selectedMonthSummary.topCategoryCount)} ({formatPercentage(selectedMonthSummary.topCategoryPct)})
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Code Defect</p>
              <p className="mt-1 text-2xl font-bold text-danger-700">
                {formatNumber(selectedMonthSummary.catCounts['Code Defect'] || 0)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-enterprise-muted">Req Gap</p>
              <p className="mt-1 text-2xl font-bold text-warning-700">
                {formatNumber(selectedMonthSummary.catCounts['Requirements Gap'] || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Selected Month Pie Chart */}
        {selectedMonthPieData.length > 0 && selectedMonth && (
          <ChartCard
            title={`RCA Distribution — ${selectedMonth}`}
            subtitle={`Root cause breakdown for ${selectedMonth}`}
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

      {/* Monthly RCA Data Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly RCA Breakdown</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Detailed monthly defect counts by root cause category with code defect percentage
          </p>
        </div>
        <DataTable
          columns={tableColumns}
          data={tableData}
          pageSize={10}
          sortable={true}
          emptyMessage="No RCA data available"
        />
      </div>
    </div>
  )
}