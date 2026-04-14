import { getItem, setItem } from '../utils/storage.js'
import { applyFilters } from '../utils/filterUtils.js'
import { logEdit } from '../utils/auditLogger.js'

/**
 * DSR Service
 * Provides CRUD operations for Daily Status Report data including
 * domain-wise DSR, program-level DSR, and program drill-down.
 * Reads/writes from localStorage, applies filters, and triggers audit logging on updates.
 */

const DSR_KEY = 'dsr_data'

/**
 * Fetch DSR metrics with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.release] - Filter by release
 * @param {string} [filters.selectedRelease] - Filter by release (context format)
 * @param {string} [filters.domain] - Filter by domain
 * @param {string} [filters.selectedDomain] - Filter by domain (context format)
 * @param {string} [filters.program] - Filter by program
 * @param {string} [filters.selectedProgram] - Filter by program (context format)
 * @param {string} [filters.application] - Filter by application (checked against applications array)
 * @param {string} [filters.selectedApplication] - Filter by application (context format)
 * @param {string} [filters.wrNumber] - Filter by WR number
 * @param {string} [filters.ragStatus] - Filter by RAG status
 * @returns {Promise<Array<object>>} Filtered DSR data
 */
export function getDSRMetrics(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(DSR_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildDSRFilterMap(filters)

      // Handle application filter separately since applications is an array field
      const applicationFilter = extractApplicationFilter(filters)

      let filtered = applyFilters(data, filterMap)

      if (applicationFilter) {
        filtered = filtered.filter((row) => {
          if (Array.isArray(row.applications)) {
            return row.applications.some(
              (app) => String(app).toLowerCase() === String(applicationFilter).toLowerCase()
            )
          }
          return false
        })
      }

      resolve(filtered)
    } catch (err) {
      console.error('[DSRService] Error fetching DSR metrics:', err)
      resolve([])
    }
  })
}

/**
 * Update an editable field on a DSR row.
 * Supports updating ragStatus, comments, risks, dependencies, and other editable fields.
 * Logs the edit to the audit trail.
 * @param {string} id - Composite identifier in format "release|wrNumber|domain" (e.g., "ER 2026-05-20|WR-1001|Market Facing")
 * @param {string} field - The field name to update
 * @param {*} value - The new value for the field
 * @param {string} [userId] - The ID of the user making the edit
 * @returns {Promise<{ success: boolean, updated: object|null, error: string|null }>}
 */
export function updateDSRField(id, field, value, userId) {
  return new Promise((resolve) => {
    try {
      if (!id || !field) {
        resolve({ success: false, updated: null, error: 'Missing required parameters: id and field' })
        return
      }

      const allowedFields = [
        'ragStatus',
        'comments',
        'risks',
        'dependencies',
        'sitSignOffDate',
        'perfSignOffDate',
        'dastSignOffDate',
        'performanceTesting',
        'dastTesting',
        'tdmRequestNumber',
      ]

      if (!allowedFields.includes(field)) {
        resolve({ success: false, updated: null, error: `Field "${field}" is not editable` })
        return
      }

      const validationError = validateDSRField(field, value)
      if (validationError) {
        resolve({ success: false, updated: null, error: validationError })
        return
      }

      const data = getItem(DSR_KEY, [])

      if (!Array.isArray(data)) {
        resolve({ success: false, updated: null, error: 'DSR data is corrupted' })
        return
      }

      const [release, wrNumber, domain] = parseCompositeId(id)

      if (!release || !wrNumber) {
        resolve({ success: false, updated: null, error: 'Invalid id format. Expected "release|wrNumber" or "release|wrNumber|domain"' })
        return
      }

      const index = data.findIndex((row) => {
        const matchesRelease = row.release === release
        const matchesWR = row.wrNumber === wrNumber
        const matchesDomain = domain ? row.domain === domain : true
        return matchesRelease && matchesWR && matchesDomain
      })

      if (index === -1) {
        resolve({ success: false, updated: null, error: `No DSR record found for release="${release}", wrNumber="${wrNumber}"${domain ? `, domain="${domain}"` : ''}` })
        return
      }

      const oldValue = data[index][field]
      data[index][field] = value

      const saved = setItem(DSR_KEY, data)

      if (!saved) {
        resolve({ success: false, updated: null, error: 'Failed to persist update to storage' })
        return
      }

      if (userId) {
        logEdit({
          userId,
          fieldName: field,
          oldValue,
          newValue: value,
          entityType: 'dsr',
          entityId: id,
        })
      }

      resolve({ success: true, updated: { ...data[index] }, error: null })
    } catch (err) {
      console.error('[DSRService] Error updating DSR field:', err)
      resolve({ success: false, updated: null, error: 'Unexpected error during update' })
    }
  })
}

/**
 * Fetch DSR data filtered by domain and optionally by release.
 * Used for Domain Wise DSR view.
 * @param {string} domain - The domain to filter by
 * @param {string} [release] - Optional release to filter by
 * @returns {Promise<Array<object>>} DSR data for the specified domain
 */
export function getDSRByDomain(domain, release) {
  return new Promise((resolve) => {
    try {
      if (!domain) {
        console.error('[DSRService] Domain parameter is required for getDSRByDomain')
        resolve([])
        return
      }

      const data = getItem(DSR_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = {}

      if (domain && domain !== 'All') {
        filterMap.domain = domain
      }

      if (release && release !== 'All') {
        filterMap.release = release
      }

      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DSRService] Error fetching DSR by domain:', err)
      resolve([])
    }
  })
}

/**
 * Fetch DSR data filtered by program and optionally by release.
 * Used for Program Level DSR and Program Drill-down views.
 * @param {string} program - The program to filter by
 * @param {string} [release] - Optional release to filter by
 * @returns {Promise<Array<object>>} DSR data for the specified program
 */
export function getDSRByProgram(program, release) {
  return new Promise((resolve) => {
    try {
      if (!program) {
        console.error('[DSRService] Program parameter is required for getDSRByProgram')
        resolve([])
        return
      }

      const data = getItem(DSR_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = {}

      if (program && program !== 'All') {
        filterMap.program = program
      }

      if (release && release !== 'All') {
        filterMap.release = release
      }

      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DSRService] Error fetching DSR by program:', err)
      resolve([])
    }
  })
}

/**
 * Build a filter map from user-provided filters for DSR data.
 * Strips 'All' values and maps filter keys to data field names.
 * Does not include application filter since applications is an array field
 * and requires special handling.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildDSRFilterMap(filters) {
  const map = {}

  if (filters.release && filters.release !== 'All') {
    map.release = filters.release
  }
  if (filters.selectedRelease && filters.selectedRelease !== 'All') {
    map.release = filters.selectedRelease
  }
  if (filters.domain && filters.domain !== 'All') {
    map.domain = filters.domain
  }
  if (filters.selectedDomain && filters.selectedDomain !== 'All') {
    map.domain = filters.selectedDomain
  }
  if (filters.program && filters.program !== 'All') {
    map.program = filters.program
  }
  if (filters.selectedProgram && filters.selectedProgram !== 'All') {
    map.program = filters.selectedProgram
  }
  if (filters.wrNumber && filters.wrNumber !== 'All') {
    map.wrNumber = filters.wrNumber
  }
  if (filters.ragStatus && filters.ragStatus !== 'All') {
    map.ragStatus = filters.ragStatus
  }

  return map
}

/**
 * Extract the application filter value from user-provided filters.
 * Returns null if no application filter is active.
 * @param {object} filters - Raw filter criteria
 * @returns {string|null} The application filter value or null
 */
function extractApplicationFilter(filters) {
  if (filters.application && filters.application !== 'All') {
    return filters.application
  }
  if (filters.selectedApplication && filters.selectedApplication !== 'All') {
    return filters.selectedApplication
  }
  return null
}

/**
 * Parse a composite ID string into release, wrNumber, and optionally domain.
 * @param {string} id - Composite ID in format "release|wrNumber" or "release|wrNumber|domain"
 * @returns {[string|null, string|null, string|null]} Tuple of [release, wrNumber, domain]
 */
function parseCompositeId(id) {
  if (!id || typeof id !== 'string') {
    return [null, null, null]
  }

  const parts = id.split('|')
  if (parts.length < 2) {
    return [null, null, null]
  }

  const release = parts[0].trim() || null
  const wrNumber = parts[1].trim() || null
  const domain = parts.length >= 3 ? (parts[2].trim() || null) : null

  return [release, wrNumber, domain]
}

/**
 * Validate a DSR field value before update.
 * @param {string} field - The field name
 * @param {*} value - The value to validate
 * @returns {string|null} Error message or null if valid
 */
function validateDSRField(field, value) {
  switch (field) {
    case 'ragStatus': {
      const validStatuses = ['Green', 'Yellow', 'Red']
      if (!validStatuses.includes(value)) {
        return `Invalid RAG status value. Must be one of: ${validStatuses.join(', ')}`
      }
      return null
    }
    case 'comments':
    case 'risks':
    case 'dependencies': {
      if (value !== null && value !== undefined && typeof value !== 'string') {
        return `${field} must be a string`
      }
      if (typeof value === 'string' && value.length > 500) {
        return `${field} must not exceed 500 characters`
      }
      return null
    }
    case 'sitSignOffDate':
    case 'perfSignOffDate':
    case 'dastSignOffDate': {
      if (value === null || value === undefined || value === '') {
        return null
      }
      if (typeof value !== 'string') {
        return `${field} must be a date string or null`
      }
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return `${field} must be a valid date`
      }
      return null
    }
    case 'performanceTesting':
    case 'dastTesting': {
      if (typeof value !== 'boolean') {
        return `${field} must be a boolean`
      }
      return null
    }
    case 'tdmRequestNumber': {
      if (value !== null && value !== undefined && typeof value !== 'string') {
        return `${field} must be a string`
      }
      return null
    }
    default:
      return null
  }
}