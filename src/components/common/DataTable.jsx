import { useState, useMemo, useCallback } from 'react'

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

export default function DataTable({
  columns = [],
  data = [],
  onEdit,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  sortable = true,
  emptyMessage = 'No data available',
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')

  const handleSort = useCallback(
    (columnKey) => {
      if (!sortable) return

      setSortConfig((prev) => {
        if (prev.key === columnKey) {
          if (prev.direction === 'asc') {
            return { key: columnKey, direction: 'desc' }
          }
          return { key: null, direction: 'asc' }
        }
        return { key: columnKey, direction: 'asc' }
      })
      setCurrentPage(1)
    },
    [sortable]
  )

  const sortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    if (!sortConfig.key) {
      return [...data]
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      const cmp = aStr.localeCompare(bStr)
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })
  }, [data, sortConfig])

  const totalPages = useMemo(() => {
    if (sortedData.length === 0) return 1
    return Math.ceil(sortedData.length / pageSize)
  }, [sortedData, pageSize])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const startRow = useMemo(() => {
    if (sortedData.length === 0) return 0
    return (currentPage - 1) * pageSize + 1
  }, [currentPage, pageSize, sortedData])

  const endRow = useMemo(() => {
    const end = currentPage * pageSize
    return Math.min(end, sortedData.length)
  }, [currentPage, pageSize, sortedData])

  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return
      setCurrentPage(page)
      setEditingCell(null)
    },
    [totalPages]
  )

  const handlePageSizeChange = useCallback((e) => {
    const newSize = Number(e.target.value)
    setPageSize(newSize)
    setCurrentPage(1)
    setEditingCell(null)
  }, [])

  const handleCellDoubleClick = useCallback(
    (rowIndex, columnKey, currentValue) => {
      if (typeof onEdit !== 'function') return

      const column = columns.find((col) => col.key === columnKey)
      if (!column || !column.editable) return

      setEditingCell({ rowIndex, columnKey })
      setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '')
    },
    [columns, onEdit]
  )

  const handleEditSave = useCallback(
    (rowIndex, columnKey) => {
      if (typeof onEdit !== 'function') return

      const globalIndex = (currentPage - 1) * pageSize + rowIndex
      const row = sortedData[globalIndex]

      if (!row) {
        setEditingCell(null)
        setEditValue('')
        return
      }

      const oldValue = row[columnKey]
      const newValue = editValue.trim()

      if (String(oldValue ?? '') !== newValue) {
        onEdit(globalIndex, columnKey, newValue, row)
      }

      setEditingCell(null)
      setEditValue('')
    },
    [onEdit, currentPage, pageSize, sortedData, editValue]
  )

  const handleEditCancel = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  const handleEditKeyDown = useCallback(
    (e, rowIndex, columnKey) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleEditSave(rowIndex, columnKey)
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        handleEditCancel()
      }
    },
    [handleEditSave, handleEditCancel]
  )

  const renderSortIcon = useCallback(
    (columnKey) => {
      if (!sortable) return null

      const isActive = sortConfig.key === columnKey

      return (
        <span className="inline-flex ml-1.5">
          <svg
            className={`w-3.5 h-3.5 transition-colors duration-100 ${
              isActive ? 'text-primary-600' : 'text-enterprise-muted opacity-40'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isActive && sortConfig.direction === 'desc' ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            )}
          </svg>
        </span>
      )
    },
    [sortable, sortConfig]
  )

  const renderCell = useCallback(
    (row, column, rowIndex) => {
      const isEditing =
        editingCell &&
        editingCell.rowIndex === rowIndex &&
        editingCell.columnKey === column.key

      if (isEditing) {
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleEditSave(rowIndex, column.key)}
            onKeyDown={(e) => handleEditKeyDown(e, rowIndex, column.key)}
            className="input py-1 px-2 text-sm w-full min-w-[100px]"
            autoFocus
            aria-label={`Edit ${column.label}`}
          />
        )
      }

      const value = row[column.key]

      if (typeof column.render === 'function') {
        return column.render(value, row, rowIndex)
      }

      if (value === null || value === undefined) {
        return <span className="text-enterprise-muted">N/A</span>
      }

      if (Array.isArray(value)) {
        return value.join(', ')
      }

      return String(value)
    },
    [editingCell, editValue, handleEditSave, handleEditKeyDown]
  )

  const pageNumbers = useMemo(() => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }, [currentPage, totalPages])

  if (!Array.isArray(columns) || columns.length === 0) {
    return null
  }

  return (
    <div className="animate-fade-in">
      <div className="table-container">
        <table className="w-full min-w-full divide-y divide-enterprise-border">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header ${
                    sortable ? 'cursor-pointer select-none hover:bg-enterprise-border/30 transition-colors duration-100' : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                  aria-sort={
                    sortConfig.key === column.key
                      ? sortConfig.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  role={sortable ? 'columnheader button' : 'columnheader'}
                >
                  <div className="flex items-center">
                    <span>{column.label}</span>
                    {renderSortIcon(column.key)}
                    {column.editable && typeof onEdit === 'function' && (
                      <svg
                        className="w-3 h-3 ml-1 text-enterprise-muted opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-enterprise-border bg-enterprise-surface">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-enterprise-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-enterprise-muted opacity-40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="table-row"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`table-cell ${
                        column.editable && typeof onEdit === 'function'
                          ? 'cursor-pointer hover:bg-primary-50/50 transition-colors duration-100'
                          : ''
                      }`}
                      onDoubleClick={() =>
                        handleCellDoubleClick(rowIndex, column.key, row[column.key])
                      }
                      title={
                        column.editable && typeof onEdit === 'function'
                          ? 'Double-click to edit'
                          : undefined
                      }
                    >
                      {renderCell(row, column, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1">
          <div className="flex items-center gap-3 text-sm text-enterprise-muted">
            <span>
              Showing {startRow}–{endRow} of {sortedData.length}
            </span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size-select" className="sr-only">
                Rows per page
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="input py-1 px-2 text-xs w-auto min-w-[60px]"
                aria-label="Rows per page"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-xs">per page</span>
            </div>
          </div>

          <nav className="flex items-center gap-1" aria-label="Table pagination">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="btn-outline px-2 py-1 text-xs"
              aria-label="First page"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-outline px-2 py-1 text-xs"
              aria-label="Previous page"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7 7"
                />
              </svg>
            </button>

            {pageNumbers[0] > 1 && (
              <span className="px-1 text-xs text-enterprise-muted">…</span>
            )}

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-enterprise-dark hover:bg-enterprise-background border border-enterprise-border'
                }`}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <span className="px-1 text-xs text-enterprise-muted">…</span>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-outline px-2 py-1 text-xs"
              aria-label="Next page"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="btn-outline px-2 py-1 text-xs"
              aria-label="Last page"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7m-8-14l7 7-7 7"
                />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}