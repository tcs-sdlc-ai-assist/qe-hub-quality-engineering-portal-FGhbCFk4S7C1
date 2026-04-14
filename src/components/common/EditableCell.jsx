import { useState, useRef, useEffect, useCallback } from 'react'

const EDIT_TYPES = {
  TEXT: 'text',
  SELECT: 'select',
  DATE: 'date',
}

export default function EditableCell({
  value,
  editable = false,
  type = EDIT_TYPES.TEXT,
  options = [],
  onSave,
  placeholder = 'N/A',
  maxLength = 500,
  ariaLabel = 'Editable cell',
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === EDIT_TYPES.TEXT && inputRef.current.select) {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  useEffect(() => {
    if (!isEditing) return

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        handleCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing])

  const handleStartEdit = useCallback(() => {
    if (!editable || typeof onSave !== 'function') return

    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setIsEditing(true)
  }, [editable, onSave, value])

  const handleSave = useCallback(() => {
    if (typeof onSave !== 'function') {
      setIsEditing(false)
      setEditValue('')
      return
    }

    const trimmedValue = typeof editValue === 'string' ? editValue.trim() : editValue
    const currentValue = value !== null && value !== undefined ? String(value) : ''

    if (trimmedValue !== currentValue) {
      onSave(trimmedValue)
    }

    setIsEditing(false)
    setEditValue('')
  }, [onSave, editValue, value])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
  }, [])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel]
  )

  const handleSelectChange = useCallback(
    (e) => {
      const newValue = e.target.value
      setEditValue(newValue)

      if (typeof onSave !== 'function') {
        setIsEditing(false)
        return
      }

      const currentValue = value !== null && value !== undefined ? String(value) : ''

      if (newValue !== currentValue) {
        onSave(newValue)
      }

      setIsEditing(false)
      setEditValue('')
    },
    [onSave, value]
  )

  const renderDisplayValue = useCallback(() => {
    if (value === null || value === undefined || String(value).trim() === '') {
      return <span className="text-enterprise-muted">{placeholder}</span>
    }

    return <span>{String(value)}</span>
  }, [value, placeholder])

  const renderEditControl = useCallback(() => {
    switch (type) {
      case EDIT_TYPES.SELECT:
        return (
          <select
            ref={inputRef}
            value={editValue}
            onChange={handleSelectChange}
            onKeyDown={handleKeyDown}
            className="input py-1 px-2 text-sm w-full min-w-[120px]"
            aria-label={ariaLabel}
          >
            {options.map((option) => {
              const optionValue = typeof option === 'object' ? option.value : option
              const optionLabel = typeof option === 'object' ? option.label : option

              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              )
            })}
          </select>
        )

      case EDIT_TYPES.DATE:
        return (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input py-1 px-2 text-sm min-w-[140px]"
              aria-label={ariaLabel}
            />
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center w-6 h-6 rounded text-success-700 hover:bg-success-50 transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Save"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center w-6 h-6 rounded text-danger-700 hover:bg-danger-50 transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Cancel"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )

      case EDIT_TYPES.TEXT:
      default:
        return (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
              className="input py-1 px-2 text-sm w-full min-w-[120px]"
              placeholder={placeholder}
              aria-label={ariaLabel}
            />
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center w-6 h-6 rounded text-success-700 hover:bg-success-50 transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Save"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center w-6 h-6 rounded text-danger-700 hover:bg-danger-50 transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Cancel"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )
    }
  }, [
    type,
    editValue,
    handleSelectChange,
    handleKeyDown,
    handleSave,
    handleCancel,
    options,
    maxLength,
    placeholder,
    ariaLabel,
  ])

  if (isEditing) {
    return (
      <div ref={containerRef} className="animate-fade-in">
        {renderEditControl()}
      </div>
    )
  }

  if (!editable || typeof onSave !== 'function') {
    return <div>{renderDisplayValue()}</div>
  }

  return (
    <div
      className="group relative cursor-pointer rounded px-1 -mx-1 py-0.5 -my-0.5 hover:bg-primary-50/50 transition-colors duration-100"
      onDoubleClick={handleStartEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleStartEdit()
        }
      }}
      title="Double-click to edit"
      aria-label={`${ariaLabel}. Double-click to edit.`}
    >
      <div className="flex items-center">
        <span className="flex-1">{renderDisplayValue()}</span>
        <svg
          className="w-3 h-3 ml-1.5 text-enterprise-muted opacity-0 group-hover:opacity-50 transition-opacity duration-100 flex-shrink-0"
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
      </div>
    </div>
  )
}