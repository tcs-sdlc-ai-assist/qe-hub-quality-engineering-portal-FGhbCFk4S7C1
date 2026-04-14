/**
 * Filter utility functions used across dashboard and defect components.
 */

/**
 * Check if a single value matches a filter criterion.
 * Handles string comparison (case-insensitive), array membership, and null/undefined.
 * @param {*} value - The value to check
 * @param {string|string[]|null} filterValue - The filter criterion
 * @returns {boolean} Whether the value matches the filter
 */
export function matchesFilter(value, filterValue) {
  if (filterValue === null || filterValue === undefined || filterValue === '' || filterValue === 'All') {
    return true
  }

  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) {
      return true
    }
    if (Array.isArray(value)) {
      return value.some((v) =>
        filterValue.some((f) => String(f).toLowerCase() === String(v).toLowerCase())
      )
    }
    return filterValue.some((f) => String(f).toLowerCase() === String(value ?? '').toLowerCase())
  }

  if (Array.isArray(value)) {
    return value.some((v) => String(v).toLowerCase() === String(filterValue).toLowerCase())
  }

  return String(value ?? '').toLowerCase() === String(filterValue).toLowerCase()
}

/**
 * Apply multiple filters to a dataset.
 * Each key in the filters object corresponds to a field name in the data items.
 * @param {Array<object>} data - The dataset to filter
 * @param {object} filters - An object mapping field names to filter values
 * @returns {Array<object>} Filtered dataset
 */
export function applyFilters(data, filters) {
  if (!Array.isArray(data)) {
    return []
  }

  if (!filters || typeof filters !== 'object') {
    return data
  }

  const activeFilters = Object.entries(filters).filter(([_key, value]) => {
    if (value === null || value === undefined || value === '' || value === 'All') {
      return false
    }
    if (Array.isArray(value) && value.length === 0) {
      return false
    }
    return true
  })

  if (activeFilters.length === 0) {
    return data
  }

  return data.filter((item) =>
    activeFilters.every(([field, filterValue]) => matchesFilter(item[field], filterValue))
  )
}

/**
 * Extract unique values for a given field from a dataset.
 * Handles both scalar and array field values.
 * @param {Array<object>} data - The dataset
 * @param {string} field - The field name to extract unique values from
 * @returns {string[]} Sorted array of unique values
 */
export function getUniqueValues(data, field) {
  if (!Array.isArray(data) || !field) {
    return []
  }

  const valueSet = new Set()

  data.forEach((item) => {
    const value = item[field]
    if (value === null || value === undefined) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== null && v !== undefined && v !== '') {
          valueSet.add(String(v))
        }
      })
    } else if (value !== '') {
      valueSet.add(String(value))
    }
  })

  return Array.from(valueSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Build filter dropdown options from a dataset for a given field.
 * Returns an array of { label, value } objects with an "All" option prepended.
 * @param {Array<object>} data - The dataset
 * @param {string} field - The field name to build options from
 * @param {string} allLabel - Label for the "All" option
 * @returns {Array<{ label: string, value: string }>} Array of option objects
 */
export function buildFilterOptions(data, field, allLabel = 'All') {
  const uniqueValues = getUniqueValues(data, field)

  const options = [{ label: allLabel, value: 'All' }]

  uniqueValues.forEach((value) => {
    options.push({ label: value, value })
  })

  return options
}