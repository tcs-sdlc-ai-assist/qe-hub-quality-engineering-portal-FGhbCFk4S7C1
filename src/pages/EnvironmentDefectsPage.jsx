import { useCallback } from 'react'
import FilterBar from '../components/common/FilterBar.jsx'
import EnvironmentDefectsChart from '../components/trends/EnvironmentDefectsChart.jsx'

export default function EnvironmentDefectsPage() {
  const handleFilterChange = useCallback((filterKey, value) => {
    // FilterBar updates FilterContext directly; EnvironmentDefectsChart reacts to context changes
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">SIT, UAT & Prod Defects by Application</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Defect distribution by application across SIT, UAT, Pre-Prod, Performance, Integration, and Production environments with monthly trends and drill-down analysis
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        visibleFilters={['release', 'domain', 'application', 'environment']}
        onFilterChange={handleFilterChange}
      />

      {/* Environment Defects Chart */}
      <div className="card">
        <div className="mb-4">
          <h3 className="section-title">Environment Defect Analysis</h3>
          <p className="mt-1 text-sm text-enterprise-muted">
            Stacked environment defect distribution by application, monthly environment trends, environment distribution pie charts, and monthly drill-down with detailed breakdown table
          </p>
        </div>
        <EnvironmentDefectsChart />
      </div>
    </div>
  )
}