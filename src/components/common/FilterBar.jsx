import { useCallback, useMemo } from 'react'
import { useFilters } from '../../contexts/FilterContext.jsx'
import {
  RELEASES,
  DOMAINS,
  APPLICATIONS,
  PROGRAMS,
  ENVIRONMENTS,
  SEVERITIES,
} from '../../constants/filters.js'

const FILTER_CONFIG = {
  release: {
    key: 'selectedRelease',
    label: 'Release',
    options: RELEASES,
    filterName: 'Release',
  },
  domain: {
    key: 'selectedDomain',
    label: 'Domain',
    options: DOMAINS,
    filterName: 'Domain',
  },
  application: {
    key: 'selectedApplication',
    label: 'Application',
    options: APPLICATIONS,
    filterName: 'Application',
  },
  program: {
    key: 'selectedProgram',
    label: 'Program',
    options: PROGRAMS,
    filterName: 'Program',
  },
  environment: {
    key: 'selectedEnvironment',
    label: 'Environment',
    options: ENVIRONMENTS,
    filterName: 'Environment',
  },
  severity: {
    key: 'selectedSeverity',
    label: 'Severity',
    options: SEVERITIES,
    filterName: 'Severity',
  },
}

const DEFAULT_VISIBLE_FILTERS = ['release', 'domain', 'application', 'program']

export default function FilterBar({ visibleFilters, onFilterChange }) {
  const { filters, setFilter, resetFilters } = useFilters()

  const activeFilters = useMemo(() => {
    const filterKeys = Array.isArray(visibleFilters) && visibleFilters.length > 0
      ? visibleFilters
      : DEFAULT_VISIBLE_FILTERS

    return filterKeys.filter((key) => FILTER_CONFIG[key])
  }, [visibleFilters])

  const handleFilterChange = useCallback(
    (filterKey, value) => {
      const config = FILTER_CONFIG[filterKey]
      if (!config) {
        return
      }

      setFilter(config.filterName, value)

      if (typeof onFilterChange === 'function') {
        onFilterChange(filterKey, value)
      }
    },
    [setFilter, onFilterChange]
  )

  const handleReset = useCallback(() => {
    resetFilters()

    if (typeof onFilterChange === 'function') {
      onFilterChange('reset', 'All')
    }
  }, [resetFilters, onFilterChange])

  const hasActiveFilters = useMemo(() => {
    return activeFilters.some((filterKey) => {
      const config = FILTER_CONFIG[filterKey]
      if (!config) return false
      return filters[config.key] !== 'All'
    })
  }, [activeFilters, filters])

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="bg-enterprise-surface border border-enterprise-border rounded-xl p-4 mb-6 animate-fade-in">
      <div className="flex flex-wrap items-end gap-4">
        {activeFilters.map((filterKey) => {
          const config = FILTER_CONFIG[filterKey]
          if (!config) return null

          const currentValue = filters[config.key] || 'All'

          return (
            <div key={filterKey} className="flex flex-col min-w-[160px]">
              <label
                htmlFor={`filter-${filterKey}`}
                className="label mb-1"
              >
                {config.label}
              </label>
              <select
                id={`filter-${filterKey}`}
                value={currentValue}
                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                className="input pr-8 appearance-none bg-no-repeat bg-right cursor-pointer"
                aria-label={`Filter by ${config.label}`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236c757d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundSize: '1.25rem',
                  backgroundPosition: 'right 0.5rem center',
                }}
              >
                <option value="All">All {config.label}s</option>
                {config.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )
        })}

        <div className="flex items-end pb-0.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="btn-outline text-xs px-3 py-2 whitespace-nowrap"
            aria-label="Reset all filters"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5 inline-block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-enterprise-border">
          <span className="text-xs text-enterprise-muted font-medium">Active:</span>
          {activeFilters.map((filterKey) => {
            const config = FILTER_CONFIG[filterKey]
            if (!config) return null

            const currentValue = filters[config.key]
            if (!currentValue || currentValue === 'All') return null

            return (
              <span
                key={filterKey}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
              >
                <span className="text-primary-400 mr-1">{config.label}:</span>
                {currentValue}
                <button
                  type="button"
                  onClick={() => handleFilterChange(filterKey, 'All')}
                  className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-primary-200 transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label={`Clear ${config.label} filter`}
                >
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}