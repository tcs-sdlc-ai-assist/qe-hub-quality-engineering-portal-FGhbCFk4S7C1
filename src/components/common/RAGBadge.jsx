import { useState, useRef, useEffect, useCallback } from 'react'
import { getRAGColor } from '../../utils/formatters.js'

const RAG_OPTIONS = ['Green', 'Yellow', 'Red']

const RAG_LABELS = {
  Green: 'Green',
  Yellow: 'Amber',
  Red: 'Red',
}

export default function RAGBadge({ status, editable = false, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  const handleToggle = useCallback(() => {
    if (!editable) return
    setIsOpen((prev) => !prev)
  }, [editable])

  const handleSelect = useCallback(
    (newStatus) => {
      if (newStatus === status) {
        setIsOpen(false)
        return
      }
      if (typeof onChange === 'function') {
        onChange(newStatus)
      }
      setIsOpen(false)
    },
    [status, onChange]
  )

  const handleKeyDown = useCallback(
    (event) => {
      if (!editable) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleToggle()
      }

      if (event.key === 'Escape') {
        setIsOpen(false)
        if (buttonRef.current) {
          buttonRef.current.focus()
        }
      }
    },
    [editable, handleToggle]
  )

  const handleOptionKeyDown = useCallback(
    (event, option) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleSelect(option)
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
        if (buttonRef.current) {
          buttonRef.current.focus()
        }
      }
    },
    [handleSelect]
  )

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const colors = getRAGColor(status)
  const label = RAG_LABELS[status] || status || 'N/A'

  if (!editable) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`} />
        {label}
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${colors.bg} ${colors.text} hover:opacity-80`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`RAG status: ${label}. Click to change.`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`} />
        {label}
        <svg
          className={`ml-1 w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-32 bg-enterprise-surface border border-enterprise-border rounded-lg shadow-dropdown animate-fade-in"
          role="listbox"
          aria-label="Select RAG status"
        >
          <div className="py-1">
            {RAG_OPTIONS.map((option) => {
              const optionColors = getRAGColor(option)
              const optionLabel = RAG_LABELS[option]
              const isSelected = option === status

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option)}
                  className={`w-full flex items-center px-3 py-2 text-xs font-medium transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                    isSelected
                      ? 'bg-enterprise-background'
                      : 'hover:bg-enterprise-background'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${optionColors.dot}`} />
                  <span className={optionColors.text}>{optionLabel}</span>
                  {isSelected && (
                    <svg
                      className="ml-auto w-3.5 h-3.5 text-primary-600"
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
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}