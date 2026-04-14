import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
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
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getShowstopperDefects } from '../../services/DefectService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import {
  transformToBarData,
  transformToPieData,
  buildStackedBarData,
  getChartColors,
} from '../../utils/chartHelpers.js'
import { formatNumber, formatPercentage } from '../../utils/formatters.js'

export default function SITDefectCharts() {
  const { filters } = useFilters()
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const allDefects = await getShowstopperDefects(filters)

      const sitDefects = Array.isArray(allDefects)
        ? allDefects.filter((d) => {
            if (!d.environment) return false
            return String(d.environment).toLowerCase() === 'sit'
          })
        : []

      setData(sitDefects)
    } catch (err) {
      console.error('[SITDefectCharts] Error fetching SIT defects:', err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const defectsByApplication = useMemo(() => {
    if (!data || data.length === 0) return []

    return transformToBarData(data, {
      categoryField: 'impactedApplication',
      valueField: 'aging',
      aggregation: 'count',
      sortBy: 'value',
      sortOrder: 'desc',
    })
  }, [data])

  const defectsBySeverity = useMemo(() => {
    if (!data || data.length === 0) return []

    return transformToPieData(data, {
      categoryField: 'priority',
      colorCategory: 'severity',
    })
  }, [data])

  const defectsByStatus = useMemo(() => {
    if (!data || data.length === 0) return []

    return transformToPieData(data, {
      categoryField: 'status',
      colorCategory: 'status',
    })
  }, [data])

  const stackedByAppAndSeverity = useMemo(() => {
    if (!data || data.length === 0) return { data: [], stackKeys: [] }

    return buildStackedBarData(data, {
      categoryField: 'impactedApplication',
      stackField: 'priority',
      stackOrder: ['Critical', 'Major', 'Minor', 'Trivial'],
    })
  }, [data])

  const severityColors = useMemo(() => getChartColors('severity'), [])

  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        critical: 0,
        major: 0,
        minor: 0,
        trivial: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        avgAging: 0,
      }
    }

    let critical = 0
    let major = 0
    let minor = 0
    let trivial = 0
    let open = 0
    let inProgress = 0
    let closed = 0
    let totalAging = 0
    let agingCount = 0

    data.forEach((d) => {
      switch (d.priority) {
        case 'Critical':
          critical += 1
          break
        case 'Major':
          major += 1
          break
        case 'Minor':
          minor += 1
          break
        case 'Trivial':
          trivial += 1
          break
        default:
          break
      }

      switch (d.status) {
        case 'Open':
          open += 1
          break
        case 'In Progress':
          inProgress += 1
          break
        case 'Closed':
          closed += 1
          break
        default:
          break
      }

      if (d.aging !== null && d.aging !== undefined && !isNaN(Number(d.aging))) {
        totalAging += Number(d.aging)
        agingCount += 1
      }
    })

    const avgAging = agingCount > 0 ? Math.round((totalAging / agingCount) * 10) / 10 : 0

    return {
      total: data.length,
      critical,
      major,
      minor,
      trivial,
      open,
      inProgress,
      closed,
      avgAging,
    }
  }, [data])

  const summaryTableData = useMemo(() => {
    if (!data || data.length === 0) return []

    const appMap = {}

    data.forEach((d) => {
      const app = d.impactedApplication || 'Unknown'
      if (!appMap[app]) {
        appMap[app] = {
          application: app,
          total: 0,
          critical: 0,
          major: 0,
          minor: 0,
          open: 0,
          inProgress: 0,
        }
      }

      appMap[app].total += 1

      if (d.priority === 'Critical') appMap[app].critical += 1
      if (d.priority === 'Major') appMap[app].major += 1
      if (d.priority === 'Minor') appMap[app].minor += 1

      if (d.status === 'Open') appMap[app].open += 1
      if (d.status === 'In Progress') appMap[app].inProgress += 1
    })

    return Object.values(appMap).sort((a, b) => b.total - a.total)
  }, [data])

  const summaryTableColumns = useMemo(() => {
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
        key: 'critical',
        label: 'Critical',
        editable: false,
        render: (value) => {
          const num = Number(value)
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
          const num = Number(value)
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
          const num = Number(value)
          if (num === 0) return <span className="text-enterprise-muted">0</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
              {formatNumber(num)}
            </span>
          )
        },
      },
      {
        key: 'open',
        label: 'Open',
        editable: false,
        render: (value) => {
          const num = Number(value)
          let colorClass = 'text-enterprise-dark'
          if (num > 3) colorClass = 'text-danger-700 font-semibold'
          else if (num > 1) colorClass = 'text-warning-700 font-medium'
          return <span className={colorClass}>{formatNumber(num)}</span>
        },
      },
      {
        key: 'inProgress',
        label: 'In Progress',
        editable: false,
        render: (value) => (
          <span className="text-enterprise-dark">{formatNumber(value)}</span>
        ),
      },
    ]
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading SIT defect summary..." />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No SIT Defects"
        message="No SIT defects found for the selected filters. Try adjusting your filter criteria."
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">Total SIT Defects</p>
          <p className="mt-1 text-2xl font-bold text-enterprise-dark">
            {formatNumber(summaryStats.total)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">Critical</p>
          <p className="mt-1 text-2xl font-bold text-danger-700">
            {formatNumber(summaryStats.critical)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">Open</p>
          <p className="mt-1 text-2xl font-bold text-danger-700">
            {formatNumber(summaryStats.open)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-warning-700">
            {formatNumber(summaryStats.inProgress)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-enterprise-muted">Avg Aging</p>
          <p className="mt-1 text-2xl font-bold text-enterprise-dark">
            {summaryStats.avgAging} <span className="text-sm font-normal text-enterprise-muted">days</span>
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defects by Application - Bar Chart */}
        <ChartCard
          title="SIT Defects by Application"
          subtitle="Count of SIT defects per impacted application"
        >
          {defectsByApplication.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={defectsByApplication}
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
                  formatter={(value) => [formatNumber(value), 'Defects']}
                />
                <Bar
                  dataKey="value"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  name="Defects"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartCard>

        {/* Defects by Severity - Pie Chart */}
        <ChartCard
          title="SIT Defects by Severity"
          subtitle="Distribution of SIT defects across severity levels"
        >
          {defectsBySeverity.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={defectsBySeverity}
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
                  {defectsBySeverity.map((entry, index) => (
                    <Cell key={`severity-${index}`} fill={entry.color} />
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

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Bar - Defects by Application and Severity */}
        <ChartCard
          title="SIT Defects by Application & Severity"
          subtitle="Severity breakdown per application"
        >
          {stackedByAppAndSeverity.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stackedByAppAndSeverity.data}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis
                  dataKey="impactedApplication"
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
                {stackedByAppAndSeverity.stackKeys.map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="severity"
                    fill={severityColors[key] || '#6c757d'}
                    radius={
                      key === stackedByAppAndSeverity.stackKeys[stackedByAppAndSeverity.stackKeys.length - 1]
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

        {/* Defects by Status - Pie Chart */}
        <ChartCard
          title="SIT Defects by Status"
          subtitle="Current status distribution of SIT defects"
        >
          {defectsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={defectsByStatus}
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
                  {defectsByStatus.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
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

      {/* Summary Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">SIT Defect Summary by Application</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Breakdown of SIT defects per application with severity and status counts
          </p>
        </div>
        <DataTable
          columns={summaryTableColumns}
          data={summaryTableData}
          pageSize={10}
          sortable={true}
          emptyMessage="No SIT defect summary data available"
        />
      </div>
    </div>
  )
}