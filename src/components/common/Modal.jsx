import { useEffect, useRef, useCallback, useMemo } from 'react'

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
}) {
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  const sizeClass = useMemo(() => {
    return SIZE_CLASSES[size] || SIZE_CLASSES.md
  }, [size])

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose()
    }
  }, [onClose])

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) {
        handleClose()
      }
    },
    [handleClose]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [handleClose]
  )

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus()
        }
      }, 0)

      return () => {
        clearTimeout(timer)
      }
    } else {
      document.body.style.overflow = ''

      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus()
        previousActiveElement.current = null
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal dialog'}
    >
      <div
        ref={modalRef}
        className={`w-full ${sizeClass} bg-enterprise-surface rounded-2xl shadow-dropdown animate-fade-in`}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-enterprise-border">
          {title && (
            <h2 className="text-lg font-semibold text-enterprise-dark truncate pr-4">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-enterprise-muted hover:text-enterprise-dark hover:bg-enterprise-background transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
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

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {children ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-enterprise-muted">
              <span className="text-sm">No content available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}