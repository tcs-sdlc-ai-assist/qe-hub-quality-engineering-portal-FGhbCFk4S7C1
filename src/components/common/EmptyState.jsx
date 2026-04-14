import { useMemo } from 'react'

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) {
  const defaultIcon = useMemo(() => {
    return (
      <svg
        className="w-12 h-12 text-enterprise-muted opacity-40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    )
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="mb-4">
        {icon ? icon : defaultIcon}
      </div>

      {title && (
        <h3 className="text-lg font-semibold text-enterprise-dark mb-1">
          {title}
        </h3>
      )}

      {message && (
        <p className="text-sm text-enterprise-muted text-center max-w-md">
          {message}
        </p>
      )}

      {actionLabel && typeof onAction === 'function' && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary mt-6"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}