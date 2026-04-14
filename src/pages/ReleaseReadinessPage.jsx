import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import ReadinessTable from '../components/dashboard/ReadinessTable.jsx'

export default function ReleaseReadinessPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; ReadinessTable reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Release Readiness Dashboard</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Track release readiness status across all programs with RAG indicators, pass rates, defect counts, and confidence index
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'program']}
        onFilterChange={handleFilterChange}
      />

      {/* Readiness Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Release Readiness Status</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Editable RAG status, confidence index, and comments per WR. Double-click editable cells to update values.
          </p>
        </div>
        <ReadinessTable />
      </div>
    </div>
  )
}