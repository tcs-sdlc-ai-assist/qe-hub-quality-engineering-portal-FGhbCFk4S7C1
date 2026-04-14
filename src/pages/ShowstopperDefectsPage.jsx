import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import ShowstopperDefectTable from '../components/dashboard/ShowstopperDefectTable.jsx'

export default function ShowstopperDefectsPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; ShowstopperDefectTable reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Showstopper Defects</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Track critical and showstopper defects across releases, applications, and environments with priority, status, aging, and assignee details
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'application', 'environment']}
        onFilterChange={handleFilterChange}
      />

      {/* Showstopper Defect Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Showstopper Defect List</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Critical and high-priority defects impacting release readiness. Sortable by priority, status, aging, and other fields.
          </p>
        </div>
        <ShowstopperDefectTable />
      </div>
    </div>
  )
}