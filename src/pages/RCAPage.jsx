import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import RCAChart from '../components/trends/RCAChart.jsx'

export default function RCAPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; RCAChart reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Root Cause Analysis (RCA)</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Defect root cause categorization across SIT, UAT, and Production environments showing Code Defect, Requirements Gap, Environment Issue, Data Issue, Integration Defect, Configuration Error, and Third Party trends over time
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'application']}
        onFilterChange={handleFilterChange}
      />

      {/* RCA Chart */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Root Cause Analysis</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Overall and monthly RCA distribution including stacked bar charts, trend lines, code defect cumulative trend, and monthly drill-down with detailed breakdown table across SIT, UAT, and Production environments
          </p>
        </div>
        <RCAChart />
      </div>
    </div>
  )
}