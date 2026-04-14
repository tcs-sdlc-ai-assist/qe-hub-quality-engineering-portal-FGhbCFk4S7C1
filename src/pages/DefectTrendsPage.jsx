import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import DefectTrendsChart from '../components/trends/DefectTrendsChart.jsx'

export default function DefectTrendsPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; DefectTrendsChart reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Application QE Defect Trends</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly defect trends by application showing opened, closed, deferred, and net open defects over time with drill-down by application
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'application']}
        onFilterChange={handleFilterChange}
      />

      {/* Defect Trends Chart */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Defect Trend Analysis</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Overall and per-application defect trends including opened vs closed, net open cumulative trend, and application-level drill-down with monthly breakdowns
          </p>
        </div>
        <DefectTrendsChart />
      </div>
    </div>
  )
}