import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import DSRProgramView from '../components/dashboard/DSRProgramView.jsx'

export default function ProgramDSRPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; DSRProgramView reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Program Wise DSR</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Program-wise daily status report with RAG indicators, test coverage, execution metrics, defect counts, and editable fields per WR
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'program', 'domain']}
        onFilterChange={handleFilterChange}
      />

      {/* Program DSR View */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Program DSR Status</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Expand each program to view WR-level DSR details. Editable RAG status, dates, dependencies, risks, and comments per WR. Double-click editable cells to update values.
          </p>
        </div>
        <DSRProgramView />
      </div>
    </div>
  )
}