import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import ProgramDrilldownView from '../components/dashboard/ProgramDrilldownView.jsx'

export default function ProgramDrilldownPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; ProgramDrilldownView reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Program Status Drilldown</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Detailed program-level status drill-down with WR/application status, test coverage, execution metrics, defect analysis, and interactive charts
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'program', 'domain']}
        onFilterChange={handleFilterChange}
      />

      {/* Program Drilldown View */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Program Drilldown Analysis</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Select a program to view WR-level status, test coverage and execution charts, RAG distribution, defect breakdown by WR, application summary, and editable fields. Double-click editable cells to update values.
          </p>
        </div>
        <ProgramDrilldownView />
      </div>
    </div>
  )
}