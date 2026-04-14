import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import DeferredDefectTable from '../components/dashboard/DeferredDefectTable.jsx'

export default function DeferredDefectsPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; DeferredDefectTable reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Deferred Defects</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Track deferred defects across releases, applications, and environments with priority, status, aging, assignee details, and editable deferral comments
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'application', 'environment']}
        onFilterChange={handleFilterChange}
      />

      {/* Deferred Defect Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Deferred Defect List</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Deferred defects with deferral comments. Double-click the deferral comment cell to update values. Sortable by priority, status, aging, and other fields.
          </p>
        </div>
        <DeferredDefectTable />
      </div>
    </div>
  )
}