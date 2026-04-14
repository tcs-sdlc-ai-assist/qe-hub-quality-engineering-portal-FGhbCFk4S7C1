import { getItem, setItem } from '../utils/storage.js'
import { applyFilters } from '../utils/filterUtils.js'
import { logEdit } from '../utils/auditLogger.js'

/**
 * Dashboard Service
 * Provides CRUD operations for dashboard data including release readiness,
 * quality metrics, and monthly snapshots.
 * Reads/writes from localStorage, applies filters, and triggers audit logging on updates.
 */

const READINESS_KEY = 'readiness_data'
const DSR_KEY = 'dsr_data'
const SHOWSTOPPER_KEY = 'showstopper_defects'
const DEFERRED_KEY = 'deferred_defects'
const MONTHLY_SNAPSHOT_KEY = 'monthly_snapshot'

/**
 * Fetch release readiness dashboard data with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.release] - Filter by release
 * @param {string} [filters.program] - Filter by program
 * @param {string} [filters.wrNumber] - Filter by WR number
 * @param {string} [filters.ragStatus] - Filter by RAG status
 * @returns {Promise<Array<object>>} Filtered readiness data
 */
export function getReadinessDashboard(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(READINESS_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DashboardService] Error fetching readiness dashboard:', err)
      resolve([])
    }
  })
}

/**
 * Update an editable field on a readiness dashboard row.
 * Supports updating ragStatus, releaseConfidenceIndex, and comments.
 * Logs the edit to the audit trail.
 * @param {string} id - Composite identifier in format "release|wrNumber" (e.g., "ER 2026-05-20|WR-1001")
 * @param {string} field - The field name to update ('ragStatus', 'releaseConfidenceIndex', 'comments')
 * @param {*} value - The new value for the field
 * @param {string} [userId] - The ID of the user making the edit
 * @returns {Promise<{ success: boolean, updated: object|null, error: string|null }>}
 */
export function updateReadinessField(id, field, value, userId) {
  return new Promise((resolve) => {
    try {
      if (!id || !field) {
        resolve({ success: false, updated: null, error: 'Missing required parameters: id and field' })
        return
      }

      const allowedFields = ['ragStatus', 'releaseConfidenceIndex', 'comments']
      if (!allowedFields.includes(field)) {
        resolve({ success: false, updated: null, error: `Field "${field}" is not editable` })
        return
      }

      const validationError = validateReadinessField(field, value)
      if (validationError) {
        resolve({ success: false, updated: null, error: validationError })
        return
      }

      const data = getItem(READINESS_KEY, [])

      if (!Array.isArray(data)) {
        resolve({ success: false, updated: null, error: 'Readiness data is corrupted' })
        return
      }

      const [release, wrNumber] = parseCompositeId(id)

      if (!release || !wrNumber) {
        resolve({ success: false, updated: null, error: 'Invalid id format. Expected "release|wrNumber"' })
        return
      }

      const index = data.findIndex(
        (row) => row.release === release && row.wrNumber === wrNumber
      )

      if (index === -1) {
        resolve({ success: false, updated: null, error: `No readiness record found for release="${release}", wrNumber="${wrNumber}"` })
        return
      }

      const oldValue = data[index][field]
      data[index][field] = value

      const saved = setItem(READINESS_KEY, data)

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
          entityType: 'readiness',
          entityId: id,
        })
      }

      resolve({ success: true, updated: { ...data[index] }, error: null })
    } catch (err) {
      console.error('[DashboardService] Error updating readiness field:', err)
      resolve({ success: false, updated: null, error: 'Unexpected error during update' })
    }
  })
}

/**
 * Fetch overall quality metrics computed from DSR and defect data.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.release] - Filter by release
 * @param {string} [filters.domain] - Filter by domain
 * @param {string} [filters.program] - Filter by program
 * @param {string} [filters.application] - Filter by application (checked against applications array)
 * @returns {Promise<object>} Aggregated quality metrics
 */
export function getQualityMetrics(filters = {}) {
  return new Promise((resolve) => {
    try {
      const dsrData = getItem(DSR_KEY, [])
      const showstopperData = getItem(SHOWSTOPPER_KEY, [])
      const deferredData = getItem(DEFERRED_KEY, [])

      if (!Array.isArray(dsrData)) {
        resolve(buildEmptyMetrics())
        return
      }

      const dsrFilterMap = buildDSRFilterMap(filters)
      const filteredDSR = applyFilters(dsrData, dsrFilterMap)

      const defectFilterMap = buildDefectFilterMap(filters)
      const filteredShowstoppers = Array.isArray(showstopperData)
        ? applyFilters(showstopperData, defectFilterMap)
        : []
      const filteredDeferred = Array.isArray(deferredData)
        ? applyFilters(deferredData, defectFilterMap)
        : []

      const metrics = computeQualityMetrics(filteredDSR, filteredShowstoppers, filteredDeferred)

      resolve(metrics)
    } catch (err) {
      console.error('[DashboardService] Error fetching quality metrics:', err)
      resolve(buildEmptyMetrics())
    }
  })
}

/**
 * Fetch monthly snapshot trend data with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.month] - Filter by specific month
 * @returns {Promise<Array<object>>} Monthly snapshot data
 */
export function getMonthlySnapshot(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(MONTHLY_SNAPSHOT_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = {}
      if (filters.month && filters.month !== 'All') {
        filterMap.month = filters.month
      }

      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DashboardService] Error fetching monthly snapshot:', err)
      resolve([])
    }
  })
}

/**
 * Build a filter map from user-provided filters for readiness data.
 * Strips 'All' values and maps filter keys to data field names.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildFilterMap(filters) {
  const map = {}

  if (filters.release && filters.release !== 'All') {
    map.release = filters.release
  }
  if (filters.selectedRelease && filters.selectedRelease !== 'All') {
    map.release = filters.selectedRelease
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
 * Build a filter map for DSR data from user-provided filters.
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

  return map
}

/**
 * Build a filter map for defect data from user-provided filters.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildDefectFilterMap(filters) {
  const map = {}

  if (filters.release && filters.release !== 'All') {
    map.release = filters.release
  }
  if (filters.selectedRelease && filters.selectedRelease !== 'All') {
    map.release = filters.selectedRelease
  }
  if (filters.application && filters.application !== 'All') {
    map.impactedApplication = filters.application
  }
  if (filters.selectedApplication && filters.selectedApplication !== 'All') {
    map.impactedApplication = filters.selectedApplication
  }

  return map
}

/**
 * Parse a composite ID string into release and wrNumber.
 * @param {string} id - Composite ID in format "release|wrNumber"
 * @returns {[string|null, string|null]} Tuple of [release, wrNumber]
 */
function parseCompositeId(id) {
  if (!id || typeof id !== 'string') {
    return [null, null]
  }

  const parts = id.split('|')
  if (parts.length < 2) {
    return [null, null]
  }

  const release = parts[0].trim()
  const wrNumber = parts[1].trim()

  return [release || null, wrNumber || null]
}

/**
 * Validate a readiness field value before update.
 * @param {string} field - The field name
 * @param {*} value - The value to validate
 * @returns {string|null} Error message or null if valid
 */
function validateReadinessField(field, value) {
  switch (field) {
    case 'ragStatus': {
      const validStatuses = ['Green', 'Yellow', 'Red']
      if (!validStatuses.includes(value)) {
        return `Invalid RAG status value. Must be one of: ${validStatuses.join(', ')}`
      }
      return null
    }
    case 'releaseConfidenceIndex': {
      const num = Number(value)
      if (isNaN(num)) {
        return 'Confidence index must be a number'
      }
      if (num < 0 || num > 5) {
        return 'Confidence index must be between 0 and 5'
      }
      return null
    }
    case 'comments': {
      if (value !== null && value !== undefined && typeof value !== 'string') {
        return 'Comments must be a string'
      }
      if (typeof value === 'string' && value.length > 500) {
        return 'Comments must not exceed 500 characters'
      }
      return null
    }
    default:
      return null
  }
}

/**
 * Compute aggregated quality metrics from DSR and defect data.
 * @param {Array<object>} dsrData - Filtered DSR data
 * @param {Array<object>} showstoppers - Filtered showstopper defects
 * @param {Array<object>} deferred - Filtered deferred defects
 * @returns {object} Aggregated quality metrics
 */
function computeQualityMetrics(dsrData, showstoppers, deferred) {
  if (!dsrData || dsrData.length === 0) {
    return buildEmptyMetrics()
  }

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  let blockedTests = 0
  let defectsOpen = 0
  let defectsClosed = 0
  let totalCoverage = 0
  let totalExecution = 0
  let coverageCount = 0
  let executionCount = 0

  const ragCounts = { Green: 0, Yellow: 0, Red: 0 }

  dsrData.forEach((row) => {
    totalTests += row.totalTests || 0
    passedTests += row.passedTests || 0
    failedTests += row.failedTests || 0
    blockedTests += row.blockedTests || 0
    defectsOpen += row.defectsOpen || 0
    defectsClosed += row.defectsClosed || 0

    if (row.testCoverage !== null && row.testCoverage !== undefined) {
      totalCoverage += row.testCoverage
      coverageCount += 1
    }

    if (row.executionPct !== null && row.executionPct !== undefined) {
      totalExecution += row.executionPct
      executionCount += 1
    }

    if (row.ragStatus && ragCounts[row.ragStatus] !== undefined) {
      ragCounts[row.ragStatus] += 1
    }
  })

  const avgCoverage = coverageCount > 0
    ? Math.round((totalCoverage / coverageCount) * 10) / 10
    : 0

  const avgExecution = executionCount > 0
    ? Math.round((totalExecution / executionCount) * 10) / 10
    : 0

  const passRate = totalTests > 0
    ? Math.round((passedTests / totalTests) * 1000) / 10
    : 0

  return {
    totalPrograms: dsrData.length,
    totalTests,
    passedTests,
    failedTests,
    blockedTests,
    passRate,
    avgTestCoverage: avgCoverage,
    avgExecutionPct: avgExecution,
    defectsOpen,
    defectsClosed,
    totalDefects: defectsOpen + defectsClosed,
    showstopperCount: showstoppers.length,
    deferredCount: deferred.length,
    ragSummary: { ...ragCounts },
    programsAtRisk: ragCounts.Red,
    programsOnTrack: ragCounts.Green,
    programsAtWarning: ragCounts.Yellow,
  }
}

/**
 * Build an empty metrics object with default values.
 * @returns {object} Empty quality metrics
 */
function buildEmptyMetrics() {
  return {
    totalPrograms: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    blockedTests: 0,
    passRate: 0,
    avgTestCoverage: 0,
    avgExecutionPct: 0,
    defectsOpen: 0,
    defectsClosed: 0,
    totalDefects: 0,
    showstopperCount: 0,
    deferredCount: 0,
    ragSummary: { Green: 0, Yellow: 0, Red: 0 },
    programsAtRisk: 0,
    programsOnTrack: 0,
    programsAtWarning: 0,
  }
}