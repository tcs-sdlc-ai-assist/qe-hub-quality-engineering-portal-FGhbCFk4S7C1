import { parseCSV, parseExcel, validateUploadData, mapUploadToSchema } from '../utils/csvParser.js'
import { getItem, setItem } from '../utils/storage.js'

/**
 * Upload Service
 * Provides file upload processing, validation, storage, and upload history tracking.
 * Supports CSV and Excel file formats for DSR, defect, and readiness data types.
 * Parses files using csvParser utility, validates against schemas, and persists to localStorage.
 */

const UPLOAD_HISTORY_KEY = 'upload_history'

const DATA_TYPE_STORAGE_MAP = {
  dsr: 'dsr_data',
  defects_showstopper: 'showstopper_defects',
  defects_deferred: 'deferred_defects',
  readiness: 'readiness_data',
  monthly_snapshot: 'monthly_snapshot',
  defect_trends: 'defect_trends',
  severity_distribution: 'severity_distribution',
  env_defects: 'env_defects',
  rca_data: 'rca_data',
}

const SCHEMA_TYPE_MAP = {
  dsr: 'dsr',
  defects_showstopper: 'defects',
  defects_deferred: 'defects',
  readiness: 'readiness',
}

/**
 * Upload and process an Excel or CSV file.
 * Parses the file, validates data against the schema for the given data type,
 * maps data to the canonical schema, stores in localStorage, and records upload history.
 * @param {File} file - The file to upload (.csv, .xlsx, .xls)
 * @param {string} dataType - The data type key (e.g., 'dsr', 'defects_showstopper', 'readiness')
 * @returns {Promise<{ success: boolean, rowsImported: number, errors: Array<object>, warnings: Array<object>, error: string|null }>}
 */
export async function uploadExcelFile(file, dataType) {
  try {
    if (!file) {
      return buildUploadResult(false, 0, [], [], 'No file provided')
    }

    if (!dataType || typeof dataType !== 'string') {
      return buildUploadResult(false, 0, [], [], 'Data type is required')
    }

    const storageKey = DATA_TYPE_STORAGE_MAP[dataType]
    if (!storageKey) {
      return buildUploadResult(false, 0, [], [], `Unknown data type: "${dataType}"`)
    }

    const fileExtension = getFileExtension(file.name)

    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      return buildUploadResult(false, 0, [], [], 'Unsupported file format. Please upload a .csv, .xlsx, or .xls file')
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return buildUploadResult(false, 0, [], [], 'File size exceeds 10MB limit')
    }

    let parseResult

    if (fileExtension === 'csv') {
      parseResult = await parseCSV(file)
    } else {
      parseResult = await parseExcel(file)
    }

    if (!parseResult || !Array.isArray(parseResult.data) || parseResult.data.length === 0) {
      return buildUploadResult(false, 0, [], [], 'No data rows found in the uploaded file')
    }

    if (parseResult.errors && parseResult.errors.length > 0) {
      const parseErrors = parseResult.errors.map((err) => ({
        row: err.row || 0,
        field: '',
        message: err.message || 'Parse error',
      }))
      return buildUploadResult(false, 0, parseErrors, [], 'File contains parsing errors')
    }

    const processResult = await processUploadedData(parseResult.data, dataType)

    if (processResult.success) {
      recordUploadHistory({
        fileName: file.name,
        fileSize: file.size,
        dataType,
        rowsImported: processResult.rowsImported,
        status: 'success',
        errors: [],
        warnings: processResult.warnings,
      })
    } else {
      recordUploadHistory({
        fileName: file.name,
        fileSize: file.size,
        dataType,
        rowsImported: 0,
        status: 'failed',
        errors: processResult.errors,
        warnings: processResult.warnings,
      })
    }

    return processResult
  } catch (err) {
    console.error('[UploadService] Error uploading file:', err)
    return buildUploadResult(false, 0, [], [], `Upload failed: ${err.message}`)
  }
}

/**
 * Process parsed data by validating against the schema, mapping to canonical format,
 * and storing in localStorage.
 * @param {Array<object>} parsedData - The parsed data rows from the file
 * @param {string} dataType - The data type key (e.g., 'dsr', 'defects_showstopper', 'readiness')
 * @returns {Promise<{ success: boolean, rowsImported: number, errors: Array<object>, warnings: Array<object>, error: string|null }>}
 */
export function processUploadedData(parsedData, dataType) {
  return new Promise((resolve) => {
    try {
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        resolve(buildUploadResult(false, 0, [], [], 'No data provided for processing'))
        return
      }

      if (!dataType || typeof dataType !== 'string') {
        resolve(buildUploadResult(false, 0, [], [], 'Data type is required'))
        return
      }

      const storageKey = DATA_TYPE_STORAGE_MAP[dataType]
      if (!storageKey) {
        resolve(buildUploadResult(false, 0, [], [], `Unknown data type: "${dataType}"`))
        return
      }

      const schemaType = SCHEMA_TYPE_MAP[dataType]

      let validationResult = { valid: true, errors: [], warnings: [] }

      if (schemaType) {
        validationResult = validateUploadData(parsedData, schemaType)
      }

      if (!validationResult.valid) {
        resolve(buildUploadResult(
          false,
          0,
          validationResult.errors,
          validationResult.warnings,
          'Data validation failed. Please fix the errors and try again.'
        ))
        return
      }

      let mappedData

      if (schemaType) {
        mappedData = mapUploadToSchema(parsedData, schemaType)
      } else {
        mappedData = parsedData.map((row) => {
          const cleanRow = {}
          Object.entries(row).forEach(([key, value]) => {
            cleanRow[key.trim()] = typeof value === 'string' ? value.trim() : value
          })
          return cleanRow
        })
      }

      if (!Array.isArray(mappedData) || mappedData.length === 0) {
        resolve(buildUploadResult(false, 0, [], validationResult.warnings, 'Failed to map data to schema'))
        return
      }

      const saved = setItem(storageKey, mappedData)

      if (!saved) {
        resolve(buildUploadResult(false, 0, [], validationResult.warnings, 'Failed to save data to storage'))
        return
      }

      resolve(buildUploadResult(
        true,
        mappedData.length,
        [],
        validationResult.warnings,
        null
      ))
    } catch (err) {
      console.error('[UploadService] Error processing uploaded data:', err)
      resolve(buildUploadResult(false, 0, [], [], `Processing failed: ${err.message}`))
    }
  })
}

/**
 * Retrieve the upload history log.
 * Returns an array of upload history entries sorted by timestamp descending (newest first).
 * @returns {Array<object>} Array of upload history entries
 */
export function getUploadHistory() {
  try {
    const history = getItem(UPLOAD_HISTORY_KEY, [])

    if (!Array.isArray(history)) {
      return []
    }

    return [...history].sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (err) {
    console.error('[UploadService] Error fetching upload history:', err)
    return []
  }
}

/**
 * Clear the upload history log.
 * @returns {boolean} Whether the operation succeeded
 */
export function clearUploadHistory() {
  try {
    return setItem(UPLOAD_HISTORY_KEY, [])
  } catch (err) {
    console.error('[UploadService] Error clearing upload history:', err)
    return false
  }
}

/**
 * Record an upload event in the upload history.
 * @param {object} entry - The upload history entry
 * @param {string} entry.fileName - Name of the uploaded file
 * @param {number} entry.fileSize - Size of the file in bytes
 * @param {string} entry.dataType - The data type key
 * @param {number} entry.rowsImported - Number of rows successfully imported
 * @param {string} entry.status - Upload status ('success' or 'failed')
 * @param {Array<object>} entry.errors - Array of error objects
 * @param {Array<object>} entry.warnings - Array of warning objects
 */
function recordUploadHistory(entry) {
  try {
    const history = getItem(UPLOAD_HISTORY_KEY, [])

    if (!Array.isArray(history)) {
      setItem(UPLOAD_HISTORY_KEY, [])
    }

    const currentHistory = Array.isArray(history) ? history : []

    const record = {
      id: generateUploadId(),
      timestamp: new Date().toISOString(),
      fileName: entry.fileName || 'unknown',
      fileSize: entry.fileSize || 0,
      dataType: entry.dataType || 'unknown',
      rowsImported: entry.rowsImported || 0,
      status: entry.status || 'unknown',
      errorCount: Array.isArray(entry.errors) ? entry.errors.length : 0,
      warningCount: Array.isArray(entry.warnings) ? entry.warnings.length : 0,
    }

    currentHistory.push(record)

    const maxHistorySize = 100
    const trimmedHistory = currentHistory.length > maxHistorySize
      ? currentHistory.slice(currentHistory.length - maxHistorySize)
      : currentHistory

    setItem(UPLOAD_HISTORY_KEY, trimmedHistory)
  } catch (err) {
    console.error('[UploadService] Error recording upload history:', err)
  }
}

/**
 * Build a standardized upload result object.
 * @param {boolean} success - Whether the upload succeeded
 * @param {number} rowsImported - Number of rows imported
 * @param {Array<object>} errors - Array of error objects
 * @param {Array<object>} warnings - Array of warning objects
 * @param {string|null} error - Error message or null
 * @returns {{ success: boolean, rowsImported: number, errors: Array<object>, warnings: Array<object>, error: string|null }}
 */
function buildUploadResult(success, rowsImported, errors, warnings, error) {
  return {
    success,
    rowsImported,
    errors: Array.isArray(errors) ? errors : [],
    warnings: Array.isArray(warnings) ? warnings : [],
    error: error || null,
  }
}

/**
 * Extract the file extension from a filename.
 * @param {string} fileName - The file name
 * @returns {string} Lowercase file extension without the dot
 */
function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return ''
  }

  const parts = fileName.split('.')
  if (parts.length < 2) {
    return ''
  }

  return parts[parts.length - 1].toLowerCase().trim()
}

/**
 * Generate a unique upload ID.
 * @returns {string} A unique identifier string
 */
function generateUploadId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `upload_${timestamp}_${random}`
}