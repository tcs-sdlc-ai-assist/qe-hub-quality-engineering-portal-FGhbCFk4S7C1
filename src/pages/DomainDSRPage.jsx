import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import DSRDomainView from '../components/dashboard/DSRDomainView.jsx'

export default function DomainDSRPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; DSRDomainView reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Domain Wise DSR</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Domain-wise daily status report with RAG indicators, test coverage, execution metrics, defect counts, and editable fields per WR
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'program']}
        onFilterChange={handleFilterChange}
      />

      {/* Domain DSR View */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Domain DSR Status</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Expand each domain to view WR-level DSR details. Editable RAG status, dates, dependencies, risks, and comments per WR. Double-click editable cells to update values.
          </p>
        </div>
        <DSRDomainView />
      </div>
    </div>
  )
}