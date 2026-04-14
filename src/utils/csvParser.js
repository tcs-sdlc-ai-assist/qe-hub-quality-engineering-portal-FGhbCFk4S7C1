import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * CSV/Excel file parsing utility for admin data upload feature.
 * Provides parsing, validation, and schema mapping functions.
 */

/**
 * Parse a CSV file using PapaParse.
 * @param {File} file - The CSV file to parse
 * @param {object} options - Additional PapaParse configuration options
 * @returns {Promise<{ data: Array<object>, errors: Array<object>, meta: object }>}
 */
export function parseCSV(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    const defaultOptions = {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      trimHeaders: true,
      transformHeader: (header) => header.trim(),
      ...options,
    }

    Papa.parse(file, {
      ...defaultOptions,
      complete: (results) => {
        resolve({
          data: results.data || [],
          errors: results.errors || [],
          meta: results.meta || {},
        })
      },
      error: (err) => {
        console.error('[csvParser] Error parsing CSV:', err)
        reject(new Error(`Failed to parse CSV: ${err.message}`))
      },
    })
  })
}

/**
 * Parse an Excel file (.xlsx, .xls) using the xlsx library.
 * @param {File} file - The Excel file to parse
 * @param {object} options - Additional options (sheetIndex, sheetName)
 * @returns {Promise<{ data: Array<object>, errors: Array<object>, meta: object }>}
 */
export function parseExcel(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

        const sheetName = options.sheetName || workbook.SheetNames[options.sheetIndex || 0]

        if (!sheetName || !workbook.Sheets[sheetName]) {
          reject(new Error(`Sheet "${sheetName || 'unknown'}" not found in workbook`))
          return
        }

        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        })

        const trimmedData = data.map((row) => {
          const trimmedRow = {}
          Object.entries(row).forEach(([key, value]) => {
            const trimmedKey = key.trim()
            trimmedRow[trimmedKey] = typeof value === 'string' ? value.trim() : value
          })
          return trimmedRow
        })

        resolve({
          data: trimmedData,
          errors: [],
          meta: {
            sheetName,
            sheetNames: workbook.SheetNames,
            rowCount: trimmedData.length,
          },
        })
      } catch (err) {
        console.error('[csvParser] Error parsing Excel:', err)
        reject(new Error(`Failed to parse Excel: ${err.message}`))
      }
    }

    reader.onerror = () => {
      console.error('[csvParser] FileReader error')
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Schema definitions for supported upload types.
 */
const UPLOAD_SCHEMAS = {
  dsr: {
    requiredFields: ['domain', 'program', 'release', 'wrNumber', 'ragStatus'],
    optionalFields: [
      'applications',
      'sitSignOffDate',
      'brdDouDate',
      'trdDate',
      'codeDropDate',
      'tdmRequestNumber',
      'dependencies',
      'risks',
      'comments',
      'performanceTesting',
      'perfSignOffDate',
      'dastTesting',
      'dastSignOffDate',
      'testCoverage',
      'executionPct',
      'totalTests',
      'passedTests',
      'failedTests',
      'blockedTests',
      'defectsOpen',
      'defectsClosed',
    ],
    fieldTypes: {
      domain: 'string',
      program: 'string',
      release: 'string',
      wrNumber: 'string',
      applications: 'array',
      ragStatus: 'enum:Green,Yellow,Red',
      sitSignOffDate: 'date',
      brdDouDate: 'date',
      trdDate: 'date',
      codeDropDate: 'date',
      tdmRequestNumber: 'string',
      dependencies: 'string',
      risks: 'string',
      comments: 'string',
      performanceTesting: 'boolean',
      perfSignOffDate: 'date',
      dastTesting: 'boolean',
      dastSignOffDate: 'date',
      testCoverage: 'number',
      executionPct: 'number',
      totalTests: 'number',
      passedTests: 'number',
      failedTests: 'number',
      blockedTests: 'number',
      defectsOpen: 'number',
      defectsClosed: 'number',
    },
  },
  defects: {
    requiredFields: ['issueId', 'summary', 'priority', 'status', 'release', 'impactedApplication'],
    optionalFields: [
      'createdDate',
      'aging',
      'assignee',
      'wrNumber',
      'wrDescription',
      'environment',
      'deferralComment',
    ],
    fieldTypes: {
      issueId: 'string',
      summary: 'string',
      priority: 'enum:Critical,Major,Minor,Trivial',
      status: 'string',
      release: 'string',
      impactedApplication: 'string',
      createdDate: 'date',
      aging: 'number',
      assignee: 'string',
      wrNumber: 'string',
      wrDescription: 'string',
      environment: 'string',
      deferralComment: 'string',
    },
  },
  readiness: {
    requiredFields: ['release', 'program', 'wrNumber', 'ragStatus'],
    optionalFields: [
      'testExecutionPassPct',
      'totalDefects',
      'openDefects',
      'releaseConfidenceIndex',
      'comments',
    ],
    fieldTypes: {
      release: 'string',
      program: 'string',
      wrNumber: 'string',
      ragStatus: 'enum:Green,Yellow,Red',
      testExecutionPassPct: 'number',
      totalDefects: 'number',
      openDefects: 'number',
      releaseConfidenceIndex: 'number',
      comments: 'string',
    },
  },
}

/**
 * Validate a single field value against its expected type.
 * @param {*} value - The value to validate
 * @param {string} fieldType - The expected type descriptor
 * @returns {{ valid: boolean, message: string|null }}
 */
function validateFieldType(value, fieldType) {
  if (value === null || value === undefined || value === '') {
    return { valid: true, message: null }
  }

  if (fieldType.startsWith('enum:')) {
    const allowedValues = fieldType.replace('enum:', '').split(',')
    const strValue = String(value).trim()
    if (!allowedValues.some((v) => v.toLowerCase() === strValue.toLowerCase())) {
      return {
        valid: false,
        message: `Value "${value}" must be one of: ${allowedValues.join(', ')}`,
      }
    }
    return { valid: true, message: null }
  }

  switch (fieldType) {
    case 'string':
      return { valid: true, message: null }

    case 'number': {
      const num = Number(value)
      if (isNaN(num)) {
        return { valid: false, message: `Value "${value}" is not a valid number` }
      }
      return { valid: true, message: null }
    }

    case 'boolean': {
      const strVal = String(value).toLowerCase().trim()
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no']
      if (!validBooleans.includes(strVal)) {
        return { valid: false, message: `Value "${value}" is not a valid boolean` }
      }
      return { valid: true, message: null }
    }

    case 'date': {
      const strDate = String(value).trim()
      if (strDate === 'N/A' || strDate === 'n/a') {
        return { valid: true, message: null }
      }
      const date = new Date(strDate)
      if (isNaN(date.getTime())) {
        return { valid: false, message: `Value "${value}" is not a valid date` }
      }
      return { valid: true, message: null }
    }

    case 'array':
      return { valid: true, message: null }

    default:
      return { valid: true, message: null }
  }
}

/**
 * Validate uploaded data against a schema definition.
 * @param {Array<object>} data - The parsed data rows
 * @param {string} schemaType - The schema type key ('dsr', 'defects', 'readiness')
 * @returns {{ valid: boolean, errors: Array<{ row: number, field: string, message: string }>, warnings: Array<{ row: number, field: string, message: string }> }}
 */
export function validateUploadData(data, schemaType) {
  const errors = []
  const warnings = []

  if (!Array.isArray(data) || data.length === 0) {
    errors.push({ row: 0, field: '', message: 'No data rows found in file' })
    return { valid: false, errors, warnings }
  }

  const schema = UPLOAD_SCHEMAS[schemaType]
  if (!schema) {
    errors.push({ row: 0, field: '', message: `Unknown schema type: "${schemaType}"` })
    return { valid: false, errors, warnings }
  }

  const headers = Object.keys(data[0])
  const allSchemaFields = [...schema.requiredFields, ...schema.optionalFields]

  schema.requiredFields.forEach((field) => {
    const found = headers.some((h) => normalizeHeader(h) === normalizeHeader(field))
    if (!found) {
      errors.push({
        row: 0,
        field,
        message: `Required column "${field}" is missing from the uploaded file`,
      })
    }
  })

  headers.forEach((header) => {
    const normalized = normalizeHeader(header)
    const matched = allSchemaFields.some((f) => normalizeHeader(f) === normalized)
    if (!matched) {
      warnings.push({
        row: 0,
        field: header,
        message: `Column "${header}" is not recognized and will be ignored`,
      })
    }
  })

  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  data.forEach((row, index) => {
    const rowNum = index + 1

    schema.requiredFields.forEach((field) => {
      const matchedHeader = findMatchingHeader(headers, field)
      const value = matchedHeader ? row[matchedHeader] : undefined

      if (value === null || value === undefined || String(value).trim() === '') {
        errors.push({
          row: rowNum,
          field,
          message: `Required field "${field}" is empty`,
        })
      }
    })

    Object.entries(schema.fieldTypes).forEach(([field, fieldType]) => {
      const matchedHeader = findMatchingHeader(headers, field)
      if (!matchedHeader) {
        return
      }

      const value = row[matchedHeader]
      const validation = validateFieldType(value, fieldType)

      if (!validation.valid) {
        errors.push({
          row: rowNum,
          field,
          message: validation.message,
        })
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Normalize a header string for comparison.
 * @param {string} header - The header string
 * @returns {string} Normalized lowercase string without spaces/underscores
 */
function normalizeHeader(header) {
  return String(header)
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .trim()
}

/**
 * Find a matching header from the data headers for a given schema field.
 * @param {string[]} headers - The data headers
 * @param {string} field - The schema field name
 * @returns {string|null} The matching header or null
 */
function findMatchingHeader(headers, field) {
  const normalizedField = normalizeHeader(field)
  return headers.find((h) => normalizeHeader(h) === normalizedField) || null
}

/**
 * Convert a raw value to the expected type based on the field type descriptor.
 * @param {*} value - The raw value
 * @param {string} fieldType - The expected type descriptor
 * @returns {*} The converted value
 */
function convertValue(value, fieldType) {
  if (value === null || value === undefined || String(value).trim() === '') {
    if (fieldType === 'number') return null
    if (fieldType === 'boolean') return false
    if (fieldType === 'date') return null
    if (fieldType === 'array') return []
    return null
  }

  if (fieldType.startsWith('enum:')) {
    const allowedValues = fieldType.replace('enum:', '').split(',')
    const strValue = String(value).trim()
    const matched = allowedValues.find((v) => v.toLowerCase() === strValue.toLowerCase())
    return matched || strValue
  }

  switch (fieldType) {
    case 'string':
      return String(value).trim()

    case 'number': {
      const num = Number(value)
      return isNaN(num) ? null : num
    }

    case 'boolean': {
      const strVal = String(value).toLowerCase().trim()
      return ['true', '1', 'yes'].includes(strVal)
    }

    case 'date': {
      const strDate = String(value).trim()
      if (strDate === '' || strDate === 'N/A' || strDate === 'n/a') {
        return null
      }
      const date = new Date(strDate)
      if (isNaN(date.getTime())) {
        return null
      }
      return date.toISOString().split('T')[0]
    }

    case 'array': {
      if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter(Boolean)
      }
      const strVal = String(value).trim()
      if (strVal === '') {
        return []
      }
      return strVal.split(/[,;|]/).map((v) => v.trim()).filter(Boolean)
    }

    default:
      return value
  }
}

/**
 * Map parsed upload data to the expected schema format.
 * Normalizes headers, converts types, and maps fields to their canonical names.
 * @param {Array<object>} data - The parsed data rows
 * @param {string} schemaType - The schema type key ('dsr', 'defects', 'readiness')
 * @returns {Array<object>} Mapped data rows conforming to the schema
 */
export function mapUploadToSchema(data, schemaType) {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  const schema = UPLOAD_SCHEMAS[schemaType]
  if (!schema) {
    console.error(`[csvParser] Unknown schema type: "${schemaType}"`)
    return []
  }

  const headers = Object.keys(data[0])
  const allSchemaFields = [...schema.requiredFields, ...schema.optionalFields]

  const headerMap = {}
  allSchemaFields.forEach((field) => {
    const matchedHeader = findMatchingHeader(headers, field)
    if (matchedHeader) {
      headerMap[field] = matchedHeader
    }
  })

  return data.map((row) => {
    const mappedRow = {}

    allSchemaFields.forEach((field) => {
      const sourceHeader = headerMap[field]
      const rawValue = sourceHeader ? row[sourceHeader] : undefined
      const fieldType = schema.fieldTypes[field] || 'string'

      mappedRow[field] = convertValue(rawValue, fieldType)
    })

    return mappedRow
  })
}