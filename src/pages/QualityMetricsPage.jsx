import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import QualityMetricsCards from '../components/dashboard/QualityMetricsCards.jsx'

export default function QualityMetricsPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; QualityMetricsCards reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Overall Quality Metrics</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Comprehensive quality engineering metrics including test coverage, pass rates, critical defects, defect fix rates, RAG status summary, and program-level risk indicators across all releases
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'program', 'application']}
        onFilterChange={handleFilterChange}
      />

      {/* Quality Metrics Cards */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Quality Metrics Overview</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Key quality indicators aggregated from DSR data, showstopper defects, and deferred defects for the selected filters. Metrics include average test coverage, pass rate, defect fix rate, open critical defects, program risk status, and RAG distribution.
          </p>
        </div>
        <QualityMetricsCards />
      </div>
    </div>
  )
}