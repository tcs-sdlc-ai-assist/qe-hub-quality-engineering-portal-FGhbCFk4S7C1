import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import SITDefectCharts from '../components/dashboard/SITDefectCharts.jsx'

export default function SITDefectSummaryPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; SITDefectCharts reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">SIT Defect Summary</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Summary of SIT defects across releases, applications, and severity levels with charts and detailed breakdowns
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'application', 'domain', 'severity']}
        onFilterChange={handleFilterChange}
      />

      {/* SIT Defect Charts & Summary */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">SIT Defect Analysis</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Defect distribution by application, severity, and status for the SIT environment with interactive charts and summary table
          </p>
        </div>
        <SITDefectCharts />
      </div>
    </div>
  )
}