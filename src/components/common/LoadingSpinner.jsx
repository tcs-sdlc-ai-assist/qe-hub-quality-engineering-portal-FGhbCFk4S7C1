import { useMemo } from 'react'

const SIZE_CONFIG = {
  sm: {
    spinner: 'w-5 h-5',
    text: 'text-xs',
    border: 'border-2',
  },
  md: {
    spinner: 'w-8 h-8',
    text: 'text-sm',
    border: 'border-[3px]',
  },
  lg: {
    spinner: 'w-12 h-12',
    text: 'text-base',
    border: 'border-4',
  },
}

export default function LoadingSpinner({ size = 'md', message }) {
  const sizeClasses = useMemo(() => {
    return SIZE_CONFIG[size] || SIZE_CONFIG.md
  }, [size])

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 animate-fade-in">
      <div
        className={`${sizeClasses.spinner} ${sizeClasses.border} border-enterprise-border border-t-primary-600 rounded-full animate-spin`}
        role="status"
        aria-label={message || 'Loading'}
      />
      {message && (
        <p className={`${sizeClasses.text} text-enterprise-muted font-medium`}>
          {message}
        </p>
      )}
    </div>
  )
}