/**
 * Chart data transformation utilities for Recharts components.
 * Provides functions to transform raw data into chart-ready formats.
 */

/**
 * Default color palette for charts.
 */
const DEFAULT_COLORS = [
  '#4f46e5', // primary-600
  '#14b8a6', // secondary-500
  '#22c55e', // success-500
  '#f59e0b', // warning-500
  '#ef4444', // danger-500
  '#3b82f6', // info-500
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

/**
 * RAG status color mapping for charts.
 */
const RAG_COLORS = {
  Green: '#22c55e',
  Yellow: '#f59e0b',
  Red: '#ef4444',
}

/**
 * Severity color mapping for charts.
 */
const SEVERITY_COLORS = {
  Critical: '#ef4444',
  Major: '#f59e0b',
  Minor: '#3b82f6',
  Trivial: '#6c757d',
}

/**
 * Status color mapping for charts.
 */
const STATUS_COLORS = {
  Open: '#ef4444',
  'In Progress': '#f59e0b',
  Closed: '#22c55e',
  Deferred: '#6c757d',
  Blocked: '#8b5cf6',
}

/**
 * Get chart colors based on a category type or return the default palette.
 * @param {string} [category] - Optional category type ('rag', 'severity', 'status')
 * @param {number} [count] - Number of colors needed from the default palette
 * @returns {object|string[]} Color mapping object or array of color strings
 */
export function getChartColors(category, count) {
  if (category === 'rag') {
    return { ...RAG_COLORS }
  }

  if (category === 'severity') {
    return { ...SEVERITY_COLORS }
  }

  if (category === 'status') {
    return { ...STATUS_COLORS }
  }

  if (typeof count === 'number' && count > 0) {
    const colors = []
    for (let i = 0; i < count; i++) {
      colors.push(DEFAULT_COLORS[i % DEFAULT_COLORS.length])
    }
    return colors
  }

  return [...DEFAULT_COLORS]
}

/**
 * Transform raw data into a format suitable for Recharts BarChart.
 * Groups data by a category field and aggregates a value field.
 * @param {Array<object>} data - The raw dataset
 * @param {object} options - Transformation options
 * @param {string} options.categoryField - The field to group by (x-axis)
 * @param {string} options.valueField - The field to aggregate (y-axis)
 * @param {string} [options.aggregation='sum'] - Aggregation method ('sum', 'count', 'avg')
 * @param {string} [options.sortBy] - Sort by 'category' or 'value'
 * @param {string} [options.sortOrder='asc'] - Sort order ('asc' or 'desc')
 * @returns {Array<{ name: string, value: number }>} Bar chart data
 */
export function transformToBarData(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  const {
    categoryField,
    valueField,
    aggregation = 'sum',
    sortBy,
    sortOrder = 'asc',
  } = options

  if (!categoryField) {
    return []
  }

  const groups = {}

  data.forEach((item) => {
    const category = item[categoryField]
    if (category === null || category === undefined) {
      return
    }

    const key = String(category)

    if (!groups[key]) {
      groups[key] = { values: [], count: 0 }
    }

    if (valueField && item[valueField] !== null && item[valueField] !== undefined) {
      const num = Number(item[valueField])
      if (!isNaN(num)) {
        groups[key].values.push(num)
      }
    }

    groups[key].count += 1
  })

  let result = Object.entries(groups).map(([name, group]) => {
    let value = 0

    if (aggregation === 'count') {
      value = group.count
    } else if (aggregation === 'avg' && group.values.length > 0) {
      const sum = group.values.reduce((acc, v) => acc + v, 0)
      value = Math.round((sum / group.values.length) * 100) / 100
    } else if (aggregation === 'sum') {
      value = group.values.reduce((acc, v) => acc + v, 0)
    }

    return { name, value }
  })

  if (sortBy === 'category') {
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortOrder === 'desc' ? -cmp : cmp
    })
  } else if (sortBy === 'value') {
    result.sort((a, b) => {
      const cmp = a.value - b.value
      return sortOrder === 'desc' ? -cmp : cmp
    })
  }

  return result
}

/**
 * Transform raw data into a format suitable for Recharts PieChart.
 * Groups data by a category field and aggregates counts or values.
 * @param {Array<object>} data - The raw dataset
 * @param {object} options - Transformation options
 * @param {string} options.categoryField - The field to group by (pie slices)
 * @param {string} [options.valueField] - The field to sum for each slice; if omitted, counts occurrences
 * @param {string} [options.colorCategory] - Color category for getChartColors ('rag', 'severity', 'status')
 * @returns {Array<{ name: string, value: number, color: string }>} Pie chart data
 */
export function transformToPieData(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  const { categoryField, valueField, colorCategory } = options

  if (!categoryField) {
    return []
  }

  const groups = {}

  data.forEach((item) => {
    const category = item[categoryField]
    if (category === null || category === undefined) {
      return
    }

    const key = String(category)

    if (!groups[key]) {
      groups[key] = 0
    }

    if (valueField && item[valueField] !== null && item[valueField] !== undefined) {
      const num = Number(item[valueField])
      if (!isNaN(num)) {
        groups[key] += num
      }
    } else {
      groups[key] += 1
    }
  })

  const colorMap = colorCategory ? getChartColors(colorCategory) : null
  const entries = Object.entries(groups)

  return entries.map(([name, value], index) => {
    let color
    if (colorMap && !Array.isArray(colorMap) && colorMap[name]) {
      color = colorMap[name]
    } else {
      color = DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }

    return { name, value, color }
  })
}

/**
 * Transform raw data into a format suitable for Recharts LineChart.
 * Groups data by an x-axis field and extracts one or more series.
 * @param {Array<object>} data - The raw dataset
 * @param {object} options - Transformation options
 * @param {string} options.xField - The field for the x-axis (e.g., 'month')
 * @param {string[]} options.yFields - Array of field names for y-axis series
 * @param {string} [options.seriesField] - Optional field to split data into multiple series
 * @param {string} [options.valueField] - Value field when using seriesField
 * @returns {Array<object>} Line chart data with xField as key and yFields as values
 */
export function transformToLineData(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  const { xField, yFields, seriesField, valueField } = options

  if (!xField) {
    return []
  }

  if (seriesField && valueField) {
    return _transformToLineDataWithSeries(data, xField, seriesField, valueField)
  }

  if (!Array.isArray(yFields) || yFields.length === 0) {
    return []
  }

  const grouped = {}
  const xOrder = []

  data.forEach((item) => {
    const xValue = item[xField]
    if (xValue === null || xValue === undefined) {
      return
    }

    const key = String(xValue)

    if (!grouped[key]) {
      grouped[key] = { [xField]: key }
      xOrder.push(key)
    }

    yFields.forEach((yField) => {
      const val = item[yField]
      if (val !== null && val !== undefined) {
        const num = Number(val)
        if (!isNaN(num)) {
          if (grouped[key][yField] === undefined) {
            grouped[key][yField] = num
          } else {
            grouped[key][yField] += num
          }
        }
      }
    })
  })

  return xOrder.map((key) => {
    const row = grouped[key]
    yFields.forEach((yField) => {
      if (row[yField] === undefined) {
        row[yField] = 0
      }
    })
    return row
  })
}

/**
 * Internal helper to transform line data when splitting by a series field.
 * @param {Array<object>} data - The raw dataset
 * @param {string} xField - The x-axis field
 * @param {string} seriesField - The field to split series by
 * @param {string} valueField - The value field for each series
 * @returns {Array<object>} Line chart data with dynamic series keys
 */
function _transformToLineDataWithSeries(data, xField, seriesField, valueField) {
  const grouped = {}
  const xOrder = []
  const seriesNames = new Set()

  data.forEach((item) => {
    const xValue = item[xField]
    const seriesValue = item[seriesField]

    if (xValue === null || xValue === undefined) {
      return
    }
    if (seriesValue === null || seriesValue === undefined) {
      return
    }

    const xKey = String(xValue)
    const seriesKey = String(seriesValue)

    seriesNames.add(seriesKey)

    if (!grouped[xKey]) {
      grouped[xKey] = { [xField]: xKey }
      xOrder.push(xKey)
    }

    const val = item[valueField]
    if (val !== null && val !== undefined) {
      const num = Number(val)
      if (!isNaN(num)) {
        if (grouped[xKey][seriesKey] === undefined) {
          grouped[xKey][seriesKey] = num
        } else {
          grouped[xKey][seriesKey] += num
        }
      }
    }
  })

  return xOrder.map((key) => {
    const row = grouped[key]
    seriesNames.forEach((seriesName) => {
      if (row[seriesName] === undefined) {
        row[seriesName] = 0
      }
    })
    return row
  })
}

/**
 * Build stacked bar chart data from a dataset.
 * Groups data by a category field and stacks by a stack field.
 * @param {Array<object>} data - The raw dataset
 * @param {object} options - Transformation options
 * @param {string} options.categoryField - The field for the x-axis categories
 * @param {string} options.stackField - The field to create stacks from
 * @param {string} [options.valueField] - The field to sum for each stack; if omitted, counts occurrences
 * @param {string[]} [options.stackOrder] - Optional explicit ordering of stack keys
 * @returns {{ data: Array<object>, stackKeys: string[] }} Stacked bar data and stack key names
 */
export function buildStackedBarData(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return { data: [], stackKeys: [] }
  }

  const { categoryField, stackField, valueField, stackOrder } = options

  if (!categoryField || !stackField) {
    return { data: [], stackKeys: [] }
  }

  const grouped = {}
  const categoryOrder = []
  const stackKeysSet = new Set()

  data.forEach((item) => {
    const category = item[categoryField]
    const stack = item[stackField]

    if (category === null || category === undefined) {
      return
    }
    if (stack === null || stack === undefined) {
      return
    }

    const catKey = String(category)
    const stackKey = String(stack)

    stackKeysSet.add(stackKey)

    if (!grouped[catKey]) {
      grouped[catKey] = { [categoryField]: catKey }
      categoryOrder.push(catKey)
    }

    if (valueField && item[valueField] !== null && item[valueField] !== undefined) {
      const num = Number(item[valueField])
      if (!isNaN(num)) {
        if (grouped[catKey][stackKey] === undefined) {
          grouped[catKey][stackKey] = num
        } else {
          grouped[catKey][stackKey] += num
        }
      }
    } else {
      if (grouped[catKey][stackKey] === undefined) {
        grouped[catKey][stackKey] = 1
      } else {
        grouped[catKey][stackKey] += 1
      }
    }
  })

  let stackKeys
  if (Array.isArray(stackOrder) && stackOrder.length > 0) {
    stackKeys = stackOrder.filter((key) => stackKeysSet.has(key))
    stackKeysSet.forEach((key) => {
      if (!stackKeys.includes(key)) {
        stackKeys.push(key)
      }
    })
  } else {
    stackKeys = Array.from(stackKeysSet).sort((a, b) => a.localeCompare(b))
  }

  const result = categoryOrder.map((catKey) => {
    const row = grouped[catKey]
    stackKeys.forEach((stackKey) => {
      if (row[stackKey] === undefined) {
        row[stackKey] = 0
      }
    })
    return row
  })

  return { data: result, stackKeys }
}