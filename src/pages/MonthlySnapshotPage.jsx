import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import MonthlySnapshotView from '../components/trends/MonthlySnapshotView.jsx'

export default function MonthlySnapshotPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; MonthlySnapshotView reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Monthly QE Delivery Snapshot</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly trends and key quality engineering metrics across releases, test execution, defect management, pass rates, and release risk indicators
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'application']}
        onFilterChange={handleFilterChange}
      />

      {/* Monthly Snapshot View */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Monthly Snapshot Overview</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Key monthly metrics including test execution trends, pass rate progression, defect opened vs closed, release risk status, and average defect aging over time
          </p>
        </div>
        <MonthlySnapshotView />
      </div>
    </div>
  )
}