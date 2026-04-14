import { useState, useCallback, useMemo } from 'react'

export default function ExpandableRow({
  summary,
  children,
  defaultExpanded = false,
  colSpan = 1,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
    },
    [handleToggle]
  )

  const chevronClasses = useMemo(() => {
    const base = 'w-4 h-4 transition-transform duration-200 flex-shrink-0'
    if (isExpanded) {
      return `${base} rotate-90`
    }
    return base
  }, [isExpanded])

  return (
    <>
      <tr
        className="table-row cursor-pointer select-none"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
      >
        {summary ? (
          typeof summary === 'function' ? (
            summary({ isExpanded, toggle: handleToggle, chevron: renderChevron(chevronClasses) })
          ) : (
            <>
              <td className="table-cell w-10">
                <div className="flex items-center justify-center">
                  {renderChevron(chevronClasses)}
                </div>
              </td>
              {summary}
            </>
          )
        ) : (
          <td className="table-cell" colSpan={colSpan}>
            <div className="flex items-center gap-2">
              {renderChevron(chevronClasses)}
              <span className="text-sm text-enterprise-muted">No summary available</span>
            </div>
          </td>
        )}
      </tr>

      {isExpanded && (
        <tr className="animate-fade-in">
          <td
            colSpan={colSpan}
            className="px-0 py-0 bg-enterprise-background border-t border-enterprise-border"
          >
            <div className="px-6 py-4">
              {children ? (
                children
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-enterprise-muted">
                  <svg
                    className="w-6 h-6 opacity-40 mb-2"
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
                  <span className="text-sm">No detail content available</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function renderChevron(className) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
}