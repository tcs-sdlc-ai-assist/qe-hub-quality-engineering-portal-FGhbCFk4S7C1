import { createContext, useContext, useState, useCallback } from 'react'

const FilterContext = createContext(null)

const INITIAL_FILTERS = {
  selectedRelease: 'All',
  selectedDomain: 'All',
  selectedApplication: 'All',
  selectedProgram: 'All',
  selectedEnvironment: 'All',
  selectedSeverity: 'All',
}

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS })

  const setFilter = useCallback((filterName, value) => {
    if (!filterName || typeof filterName !== 'string') {
      console.error('[FilterContext] Invalid filter name provided')
      return
    }

    const key = filterName.startsWith('selected')
      ? filterName
      : `selected${filterName.charAt(0).toUpperCase()}${filterName.slice(1)}`

    if (!(key in INITIAL_FILTERS)) {
      console.error(`[FilterContext] Unknown filter key: "${key}"`)
      return
    }

    setFilters((prev) => ({
      ...prev,
      [key]: value !== null && value !== undefined ? value : 'All',
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS })
  }, [])

  const value = {
    filters,
    selectedRelease: filters.selectedRelease,
    selectedDomain: filters.selectedDomain,
    selectedApplication: filters.selectedApplication,
    selectedProgram: filters.selectedProgram,
    selectedEnvironment: filters.selectedEnvironment,
    selectedSeverity: filters.selectedSeverity,
    setFilter,
    resetFilters,
  }

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

export default FilterContext