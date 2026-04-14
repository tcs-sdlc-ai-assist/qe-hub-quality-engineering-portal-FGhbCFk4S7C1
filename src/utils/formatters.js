/**
 * Data formatting utilities used across dashboard components.
 */

/**
 * Format a date string into a human-readable format.
 * @param {string|null} dateStr - ISO date string or null
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or 'N/A'
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) {
    return 'N/A'
  }
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }
    return date.toLocaleDateString('en-US', defaultOptions)
  } catch (err) {
    console.error('[formatters] Error formatting date:', err)
    return 'N/A'
  }
}

/**
 * Format a number as a percentage string.
 * @param {number|null|undefined} value - The numeric value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string or 'N/A'
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Format a number with locale-aware separators.
 * @param {number|null|undefined} value - The numeric value
 * @param {number} decimals - Maximum decimal places
 * @returns {string} Formatted number string or 'N/A'
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

/**
 * Calculate aging in days from a given date string to today.
 * @param {string|null} dateStr - ISO date string
 * @returns {number|null} Number of days or null if invalid
 */
export function calculateAging(dateStr) {
  if (!dateStr) {
    return null
  }
  try {
    const created = new Date(dateStr)
    if (isNaN(created.getTime())) {
      return null
    }
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  } catch (err) {
    console.error('[formatters] Error calculating aging:', err)
    return null
  }
}

/**
 * Get Tailwind CSS color classes for a RAG status.
 * @param {string} status - RAG status ('Green', 'Yellow', 'Red')
 * @returns {{ bg: string, text: string, dot: string, badge: string }} Color class strings
 */
export function getRAGColor(status) {
  switch (status) {
    case 'Green':
      return {
        bg: 'bg-success-50',
        text: 'text-success-700',
        dot: 'bg-success-500',
        badge: 'badge-success',
      }
    case 'Yellow':
      return {
        bg: 'bg-warning-50',
        text: 'text-warning-700',
        dot: 'bg-warning-500',
        badge: 'badge-warning',
      }
    case 'Red':
      return {
        bg: 'bg-danger-50',
        text: 'text-danger-700',
        dot: 'bg-danger-500',
        badge: 'badge-danger',
      }
    default:
      return {
        bg: 'bg-enterprise-background',
        text: 'text-enterprise-muted',
        dot: 'bg-enterprise-muted',
        badge: 'badge',
      }
  }
}

/**
 * Get Tailwind CSS color classes for a confidence index value (1-5 scale).
 * @param {number} value - Confidence index (1.0 to 5.0)
 * @returns {{ bg: string, text: string, label: string }} Color class strings and label
 */
export function getConfidenceColor(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      bg: 'bg-enterprise-background',
      text: 'text-enterprise-muted',
      label: 'N/A',
    }
  }

  if (value >= 4.0) {
    return {
      bg: 'bg-success-50',
      text: 'text-success-700',
      label: 'High',
    }
  }

  if (value >= 3.0) {
    return {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      label: 'Medium',
    }
  }

  if (value >= 2.0) {
    return {
      bg: 'bg-danger-50',
      text: 'text-danger-700',
      label: 'Low',
    }
  }

  return {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    label: 'Critical',
  }
}

/**
 * Truncate text to a specified length with an ellipsis.
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum character length
 * @returns {string} Truncated text or original if shorter than maxLength
 */
export function truncateText(text, maxLength = 80) {
  if (!text) {
    return ''
  }
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength).trimEnd()}…`
}