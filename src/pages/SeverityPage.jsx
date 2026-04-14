import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import SeverityDistributionChart from '../components/trends/SeverityDistributionChart.jsx'

export default function SeverityPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; SeverityDistributionChart reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">QE Defects by Severity</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Monthly defect distribution by severity level showing Critical, Major, Minor, and Trivial trends over time with drill-down by month
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'application', 'severity']}
        onFilterChange={handleFilterChange}
      />

      {/* Severity Distribution Chart */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Severity Distribution Analysis</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Overall and monthly severity distribution including stacked bar charts, trend lines, critical defect cumulative trend, and monthly drill-down with detailed breakdown table
          </p>
        </div>
        <SeverityDistributionChart />
      </div>
    </div>
  )
}