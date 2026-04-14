import { getItem, setItem } from './storage.js'

/**
 * Audit trail logging utility.
 * Records field edits with userId, timestamp, fieldName, oldValue, newValue,
 * entityType, and entityId to localStorage.
 */

const AUDIT_LOG_KEY = 'audit_log'

/**
 * Log a field edit to the audit trail.
 * @param {object} params - The audit log entry parameters
 * @param {string} params.userId - The ID of the user making the edit
 * @param {string} params.fieldName - The name of the field being edited
 * @param {*} params.oldValue - The previous value of the field
 * @param {*} params.newValue - The new value of the field
 * @param {string} params.entityType - The type of entity being edited (e.g., 'dsr', 'defect', 'readiness')
 * @param {string} params.entityId - The unique identifier of the entity being edited
 * @returns {object} The created audit log entry
 */
export function logEdit({ userId, fieldName, oldValue, newValue, entityType, entityId }) {
  if (!userId || !fieldName || !entityType || !entityId) {
    console.error('[auditLogger] Missing required fields for audit log entry')
    return null
  }

  const entry = {
    id: generateEntryId(),
    userId,
    timestamp: new Date().toISOString(),
    fieldName,
    oldValue: oldValue !== undefined ? oldValue : null,
    newValue: newValue !== undefined ? newValue : null,
    entityType,
    entityId,
  }

  const log = getItem(AUDIT_LOG_KEY, [])
  log.push(entry)
  setItem(AUDIT_LOG_KEY, log)

  return entry
}

/**
 * Retrieve the audit log, optionally filtered by criteria.
 * @param {object} filters - Optional filters to apply
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.entityType] - Filter by entity type
 * @param {string} [filters.entityId] - Filter by entity ID
 * @param {string} [filters.fieldName] - Filter by field name
 * @param {string} [filters.startDate] - Filter entries on or after this ISO date string
 * @param {string} [filters.endDate] - Filter entries on or before this ISO date string
 * @returns {Array<object>} Array of audit log entries, sorted by timestamp descending
 */
export function getAuditLog(filters = {}) {
  const log = getItem(AUDIT_LOG_KEY, [])

  if (!filters || typeof filters !== 'object') {
    return sortByTimestamp(log)
  }

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== null && value !== undefined && value !== ''
  )

  if (!hasActiveFilters) {
    return sortByTimestamp(log)
  }

  const filtered = log.filter((entry) => {
    if (filters.userId && entry.userId !== filters.userId) {
      return false
    }

    if (filters.entityType && entry.entityType !== filters.entityType) {
      return false
    }

    if (filters.entityId && entry.entityId !== filters.entityId) {
      return false
    }

    if (filters.fieldName && entry.fieldName !== filters.fieldName) {
      return false
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      const entryDate = new Date(entry.timestamp)
      if (!isNaN(startDate.getTime()) && entryDate < startDate) {
        return false
      }
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      const entryDate = new Date(entry.timestamp)
      if (!isNaN(endDate.getTime()) && entryDate > endDate) {
        return false
      }
    }

    return true
  })

  return sortByTimestamp(filtered)
}

/**
 * Clear the entire audit log or entries matching specific criteria.
 * @param {object} [filters] - Optional filters; if omitted, clears the entire log
 * @param {string} [filters.userId] - Clear entries for a specific user
 * @param {string} [filters.entityType] - Clear entries for a specific entity type
 * @param {string} [filters.entityId] - Clear entries for a specific entity
 * @returns {boolean} Whether the operation succeeded
 */
export function clearAuditLog(filters) {
  if (!filters || typeof filters !== 'object') {
    return setItem(AUDIT_LOG_KEY, [])
  }

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== null && value !== undefined && value !== ''
  )

  if (!hasActiveFilters) {
    return setItem(AUDIT_LOG_KEY, [])
  }

  const log = getItem(AUDIT_LOG_KEY, [])

  const remaining = log.filter((entry) => {
    if (filters.userId && entry.userId === filters.userId) {
      return false
    }

    if (filters.entityType && entry.entityType === filters.entityType) {
      if (!filters.entityId) {
        return false
      }
      if (entry.entityId === filters.entityId) {
        return false
      }
    }

    if (filters.entityId && !filters.entityType && entry.entityId === filters.entityId) {
      return false
    }

    return true
  })

  return setItem(AUDIT_LOG_KEY, remaining)
}

/**
 * Generate a unique entry ID for an audit log record.
 * @returns {string} A unique identifier string
 */
function generateEntryId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `audit_${timestamp}_${random}`
}

/**
 * Sort audit log entries by timestamp in descending order (newest first).
 * @param {Array<object>} entries - The audit log entries
 * @returns {Array<object>} Sorted entries
 */
function sortByTimestamp(entries) {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    return dateB.getTime() - dateA.getTime()
  })
}