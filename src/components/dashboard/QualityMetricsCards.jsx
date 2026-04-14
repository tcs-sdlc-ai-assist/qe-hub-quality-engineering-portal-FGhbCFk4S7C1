import { useState, useEffect, useCallback, useMemo } from 'react'
import StatCard from '../common/StatCard.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getQualityMetrics } from '../../services/DashboardService.js'
import { useFilters } from '../../contexts/FilterContext.jsx'
import { formatPercentage, formatNumber } from '../../utils/formatters.js'

export default function QualityMetricsCards() {
  const { filters } = useFilters()
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getQualityMetrics(filters)
      setMetrics(result)
    } catch (err) {
      console.error('[QualityMetricsCards] Error fetching quality metrics:', err)
      setMetrics(null)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const avgTestCoverage = useMemo(() => {
    if (!metrics) return 0
    return metrics.avgTestCoverage || 0
  }, [metrics])

  const avgExecution = useMemo(() => {
    if (!metrics) return 0
    return metrics.avgExecutionPct || 0
  }, [metrics])

  const passRate = useMemo(() => {
    if (!metrics) return 0
    return metrics.passRate || 0
  }, [metrics])

  const openDefects = useMemo(() => {
    if (!metrics) return 0
    return metrics.defectsOpen || 0
  }, [metrics])

  const showstopperCount = useMemo(() => {
    if (!metrics) return 0
    return metrics.showstopperCount || 0
  }, [metrics])

  const deferredCount = useMemo(() => {
    if (!metrics) return 0
    return metrics.deferredCount || 0
  }, [metrics])

  const totalDefects = useMemo(() => {
    if (!metrics) return 0
    return metrics.totalDefects || 0
  }, [metrics])

  const defectFixRate = useMemo(() => {
    if (!metrics || totalDefects === 0) return 0
    const closed = metrics.defectsClosed || 0
    return Math.round((closed / totalDefects) * 1000) / 10
  }, [metrics, totalDefects])

  const programsAtRisk = useMemo(() => {
    if (!metrics) return 0
    return metrics.programsAtRisk || 0
  }, [metrics])

  const programsOnTrack = useMemo(() => {
    if (!metrics) return 0
    return metrics.programsOnTrack || 0
  }, [metrics])

  const totalPrograms = useMemo(() => {
    if (!metrics) return 0
    return metrics.totalPrograms || 0
  }, [metrics])

  const totalTests = useMemo(() => {
    if (!metrics) return 0
    return metrics.totalTests || 0
  }, [metrics])

  const coverageTrend = useMemo(() => {
    if (avgTestCoverage >= 90) return 'up'
    if (avgTestCoverage >= 75) return 'neutral'
    return 'down'
  }, [avgTestCoverage])

  const passRateTrend = useMemo(() => {
    if (passRate >= 90) return 'up'
    if (passRate >= 75) return 'neutral'
    return 'down'
  }, [passRate])

  const defectFixRateTrend = useMemo(() => {
    if (defectFixRate >= 80) return 'up'
    if (defectFixRate >= 60) return 'neutral'
    return 'down'
  }, [defectFixRate])

  const openDefectsTrend = useMemo(() => {
    if (openDefects <= 5) return 'up'
    if (openDefects <= 15) return 'neutral'
    return 'down'
  }, [openDefects])

  if (isLoading) {
    return <LoadingSpinner size="md" message="Loading quality metrics..." />
  }

  if (!metrics || totalPrograms === 0) {
    return (
      <EmptyState
        title="No Quality Metrics"
        message="No quality metrics data is available for the selected filters. Try adjusting your filter criteria."
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Test Coverage"
          value={formatPercentage(avgTestCoverage)}
          color={avgTestCoverage >= 90 ? 'success' : avgTestCoverage >= 75 ? 'warning' : 'danger'}
          trend={coverageTrend}
          trendValue={formatPercentage(avgTestCoverage)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />

        <StatCard
          title="Open Critical Defects"
          value={formatNumber(showstopperCount)}
          color={showstopperCount === 0 ? 'success' : showstopperCount <= 5 ? 'warning' : 'danger'}
          trend={showstopperCount === 0 ? 'up' : showstopperCount <= 5 ? 'neutral' : 'down'}
          trendValue={`${formatNumber(showstopperCount)} showstopper${showstopperCount !== 1 ? 's' : ''}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />

        <StatCard
          title="Defect Fix Rate"
          value={formatPercentage(defectFixRate)}
          color={defectFixRate >= 80 ? 'success' : defectFixRate >= 60 ? 'warning' : 'danger'}
          trend={defectFixRateTrend}
          trendValue={`${formatNumber(metrics.defectsClosed || 0)} of ${formatNumber(totalDefects)} fixed`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Pass Rate"
          value={formatPercentage(passRate)}
          color={passRate >= 90 ? 'success' : passRate >= 75 ? 'warning' : 'danger'}
          trend={passRateTrend}
          trendValue={`${formatNumber(metrics.passedTests || 0)} of ${formatNumber(totalTests)} passed`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
            </svg>
          }
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Programs"
          value={formatNumber(totalPrograms)}
          color="primary"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          }
        />

        <StatCard
          title="Total Tests"
          value={formatNumber(totalTests)}
          color="info"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
            </svg>
          }
        />

        <StatCard
          title="Avg Execution"
          value={formatPercentage(avgExecution)}
          color={avgExecution >= 90 ? 'success' : avgExecution >= 75 ? 'warning' : 'danger'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />

        <StatCard
          title="Open Defects"
          value={formatNumber(openDefects)}
          color={openDefects <= 5 ? 'success' : openDefects <= 15 ? 'warning' : 'danger'}
          trend={openDefectsTrend}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.22-2.058-1.907-3.555-3.97-3.555H8.916c-2.064 0-3.75 1.497-3.97 3.555a23.91 23.91 0 01-1.153 6.135A24.073 24.073 0 0112 12.75z" />
            </svg>
          }
        />

        <StatCard
          title="On Track"
          value={formatNumber(programsOnTrack)}
          color="success"
          subtitle={`of ${formatNumber(totalPrograms)} programs`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="At Risk"
          value={formatNumber(programsAtRisk)}
          color={programsAtRisk === 0 ? 'success' : 'danger'}
          subtitle={`${formatNumber(deferredCount)} deferred`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* RAG Summary Row */}
      {metrics.ragSummary && (
        <div className="card">
          <div className="mb-4">
            <h3 className="section-title">RAG Status Summary</h3>
            <p className="mt-1 text-sm text-enterprise-muted">
              Overall RAG distribution across all programs for the selected filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-success-50 text-success-700">
                <span className="w-2 h-2 rounded-full bg-success-500 mr-2" />
                Green: {formatNumber(metrics.ragSummary.Green || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-warning-50 text-warning-700">
                <span className="w-2 h-2 rounded-full bg-warning-500 mr-2" />
                Amber: {formatNumber(metrics.ragSummary.Yellow || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-danger-50 text-danger-700">
                <span className="w-2 h-2 rounded-full bg-danger-500 mr-2" />
                Red: {formatNumber(metrics.ragSummary.Red || 0)}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-4 text-sm text-enterprise-muted">
              <span>
                Failed: <span className="font-medium text-danger-700">{formatNumber(metrics.failedTests || 0)}</span>
              </span>
              <span>
                Blocked: <span className="font-medium text-warning-700">{formatNumber(metrics.blockedTests || 0)}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}