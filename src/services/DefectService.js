import { getItem, setItem } from '../utils/storage.js'
import { applyFilters } from '../utils/filterUtils.js'
import { logEdit } from '../utils/auditLogger.js'

/**
 * Defect Service
 * Provides CRUD operations for defect data including showstopper defects,
 * deferred defects, defect trends, severity distribution, environment defects, and RCA data.
 * Reads/writes from localStorage, applies filters, and triggers audit logging on updates.
 */

const SHOWSTOPPER_KEY = 'showstopper_defects'
const DEFERRED_KEY = 'deferred_defects'
const DEFECT_TRENDS_KEY = 'defect_trends'
const SEVERITY_DISTRIBUTION_KEY = 'severity_distribution'
const ENV_DEFECTS_KEY = 'env_defects'
const RCA_DATA_KEY = 'rca_data'

/**
 * Fetch showstopper defects with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.release] - Filter by release
 * @param {string} [filters.selectedRelease] - Filter by release (context format)
 * @param {string} [filters.application] - Filter by impacted application
 * @param {string} [filters.selectedApplication] - Filter by impacted application (context format)
 * @param {string} [filters.environment] - Filter by environment
 * @param {string} [filters.selectedEnvironment] - Filter by environment (context format)
 * @param {string} [filters.severity] - Filter by priority/severity
 * @param {string} [filters.selectedSeverity] - Filter by priority/severity (context format)
 * @param {string} [filters.wrNumber] - Filter by WR number
 * @returns {Promise<Array<object>>} Filtered showstopper defects
 */
export function getShowstopperDefects(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(SHOWSTOPPER_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildDefectFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DefectService] Error fetching showstopper defects:', err)
      resolve([])
    }
  })
}

/**
 * Fetch deferred defects with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.release] - Filter by release
 * @param {string} [filters.selectedRelease] - Filter by release (context format)
 * @param {string} [filters.application] - Filter by impacted application
 * @param {string} [filters.selectedApplication] - Filter by impacted application (context format)
 * @param {string} [filters.environment] - Filter by environment
 * @param {string} [filters.selectedEnvironment] - Filter by environment (context format)
 * @param {string} [filters.severity] - Filter by priority/severity
 * @param {string} [filters.selectedSeverity] - Filter by priority/severity (context format)
 * @param {string} [filters.wrNumber] - Filter by WR number
 * @returns {Promise<Array<object>>} Filtered deferred defects
 */
export function getDeferredDefects(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(DEFERRED_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildDefectFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DefectService] Error fetching deferred defects:', err)
      resolve([])
    }
  })
}

/**
 * Update the deferral comment on a deferred defect.
 * Logs the edit to the audit trail.
 * @param {string} id - The issueId of the defect to update
 * @param {string} comment - The new deferral comment
 * @param {string} [userId] - The ID of the user making the edit
 * @returns {Promise<{ success: boolean, updated: object|null, error: string|null }>}
 */
export function updateDeferralComment(id, comment, userId) {
  return new Promise((resolve) => {
    try {
      if (!id) {
        resolve({ success: false, updated: null, error: 'Missing required parameter: id' })
        return
      }

      if (comment !== null && comment !== undefined && typeof comment !== 'string') {
        resolve({ success: false, updated: null, error: 'Deferral comment must be a string' })
        return
      }

      if (typeof comment === 'string' && comment.length > 500) {
        resolve({ success: false, updated: null, error: 'Deferral comment must not exceed 500 characters' })
        return
      }

      const data = getItem(DEFERRED_KEY, [])

      if (!Array.isArray(data)) {
        resolve({ success: false, updated: null, error: 'Deferred defects data is corrupted' })
        return
      }

      const index = data.findIndex((row) => row.issueId === id)

      if (index === -1) {
        resolve({ success: false, updated: null, error: `No deferred defect found with issueId="${id}"` })
        return
      }

      const oldValue = data[index].deferralComment
      data[index].deferralComment = comment

      const saved = setItem(DEFERRED_KEY, data)

      if (!saved) {
        resolve({ success: false, updated: null, error: 'Failed to persist update to storage' })
        return
      }

      if (userId) {
        logEdit({
          userId,
          fieldName: 'deferralComment',
          oldValue,
          newValue: comment,
          entityType: 'defect',
          entityId: id,
        })
      }

      resolve({ success: true, updated: { ...data[index] }, error: null })
    } catch (err) {
      console.error('[DefectService] Error updating deferral comment:', err)
      resolve({ success: false, updated: null, error: 'Unexpected error during update' })
    }
  })
}

/**
 * Fetch defect trend data with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.application] - Filter by application
 * @param {string} [filters.selectedApplication] - Filter by application (context format)
 * @param {string} [filters.month] - Filter by specific month
 * @returns {Promise<Array<object>>} Filtered defect trend data
 */
export function getDefectTrends(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(DEFECT_TRENDS_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildTrendFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DefectService] Error fetching defect trends:', err)
      resolve([])
    }
  })
}

/**
 * Fetch severity distribution data with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.severity] - Filter by severity
 * @param {string} [filters.selectedSeverity] - Filter by severity (context format)
 * @param {string} [filters.month] - Filter by specific month
 * @returns {Promise<Array<object>>} Filtered severity distribution data
 */
export function getSeverityDistribution(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(SEVERITY_DISTRIBUTION_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildSeverityFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DefectService] Error fetching severity distribution:', err)
      resolve([])
    }
  })
}

/**
 * Fetch environment defect data with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.application] - Filter by application
 * @param {string} [filters.selectedApplication] - Filter by application (context format)
 * @param {string} [filters.environment] - Filter by environment
 * @param {string} [filters.selectedEnvironment] - Filter by environment (context format)
 * @param {string} [filters.month] - Filter by specific month
 * @returns {Promise<Array<object>>} Filtered environment defect data
 */
export function getEnvironmentDefects(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(ENV_DEFECTS_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildEnvFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DefectService] Error fetching environment defects:', err)
      resolve([])
    }
  })
}

/**
 * Fetch RCA (Root Cause Analysis) data with optional filters.
 * @param {object} [filters={}] - Filter criteria to apply
 * @param {string} [filters.category] - Filter by RCA category
 * @param {string} [filters.month] - Filter by specific month
 * @returns {Promise<Array<object>>} Filtered RCA data
 */
export function getRCAData(filters = {}) {
  return new Promise((resolve) => {
    try {
      const data = getItem(RCA_DATA_KEY, [])

      if (!Array.isArray(data)) {
        resolve([])
        return
      }

      const filterMap = buildRCAFilterMap(filters)
      const filtered = applyFilters(data, filterMap)

      resolve(filtered)
    } catch (err) {
      console.error('[DefectService] Error fetching RCA data:', err)
      resolve([])
    }
  })
}

/**
 * Build a filter map from user-provided filters for defect data.
 * Strips 'All' values and maps filter keys to data field names.
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
  if (filters.environment && filters.environment !== 'All') {
    map.environment = filters.environment
  }
  if (filters.selectedEnvironment && filters.selectedEnvironment !== 'All') {
    map.environment = filters.selectedEnvironment
  }
  if (filters.severity && filters.severity !== 'All') {
    map.priority = filters.severity
  }
  if (filters.selectedSeverity && filters.selectedSeverity !== 'All') {
    map.priority = filters.selectedSeverity
  }
  if (filters.wrNumber && filters.wrNumber !== 'All') {
    map.wrNumber = filters.wrNumber
  }

  return map
}

/**
 * Build a filter map for defect trend data from user-provided filters.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildTrendFilterMap(filters) {
  const map = {}

  if (filters.application && filters.application !== 'All') {
    map.application = filters.application
  }
  if (filters.selectedApplication && filters.selectedApplication !== 'All') {
    map.application = filters.selectedApplication
  }
  if (filters.month && filters.month !== 'All') {
    map.month = filters.month
  }

  return map
}

/**
 * Build a filter map for severity distribution data from user-provided filters.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildSeverityFilterMap(filters) {
  const map = {}

  if (filters.severity && filters.severity !== 'All') {
    map.severity = filters.severity
  }
  if (filters.selectedSeverity && filters.selectedSeverity !== 'All') {
    map.severity = filters.selectedSeverity
  }
  if (filters.month && filters.month !== 'All') {
    map.month = filters.month
  }

  return map
}

/**
 * Build a filter map for environment defect data from user-provided filters.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildEnvFilterMap(filters) {
  const map = {}

  if (filters.application && filters.application !== 'All') {
    map.application = filters.application
  }
  if (filters.selectedApplication && filters.selectedApplication !== 'All') {
    map.application = filters.selectedApplication
  }
  if (filters.environment && filters.environment !== 'All') {
    map.environment = filters.environment
  }
  if (filters.selectedEnvironment && filters.selectedEnvironment !== 'All') {
    map.environment = filters.selectedEnvironment
  }
  if (filters.month && filters.month !== 'All') {
    map.month = filters.month
  }

  return map
}

/**
 * Build a filter map for RCA data from user-provided filters.
 * @param {object} filters - Raw filter criteria
 * @returns {object} Cleaned filter map
 */
function buildRCAFilterMap(filters) {
  const map = {}

  if (filters.category && filters.category !== 'All') {
    map.category = filters.category
  }
  if (filters.month && filters.month !== 'All') {
    map.month = filters.month
  }

  return map
}