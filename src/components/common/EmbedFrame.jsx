import { useState, useCallback, useMemo } from 'react'
import LoadingSpinner from './LoadingSpinner.jsx'

const DEFAULT_HEIGHT = '600px'

export default function EmbedFrame({
  src,
  title = 'Embedded Content',
  height = DEFAULT_HEIGHT,
  fallbackMessage = 'Unable to load embedded content. Please check the URL or try again later.',
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  const handleRetry = useCallback(() => {
    setIsLoading(true)
    setHasError(false)
  }, [])

  const containerStyle = useMemo(() => {
    return {
      height: typeof height === 'number' ? `${height}px` : height,
    }
  }, [height])

  const hasSrc = useMemo(() => {
    return src && typeof src === 'string' && src.trim().length > 0
  }, [src])

  if (!hasSrc) {
    return (
      <div className="card animate-fade-in">
        {title && (
          <div className="mb-4">
            <h3 className="section-title">{title}</h3>
          </div>
        )}
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-enterprise-border bg-enterprise-background"
          style={containerStyle}
        >
          <div className="flex flex-col items-center gap-3 px-6 py-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-50 text-warning-700">
              <svg
                className="w-6 h-6"
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
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-enterprise-dark">No URL Provided</p>
            <p className="text-sm text-enterprise-muted text-center max-w-md">
              {fallbackMessage}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="card animate-fade-in">
        {title && (
          <div className="mb-4">
            <h3 className="section-title">{title}</h3>
          </div>
        )}
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-danger-500/30 bg-danger-50/30"
          style={containerStyle}
        >
          <div className="flex flex-col items-center gap-3 px-6 py-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-50 text-danger-700">
              <svg
                className="w-6 h-6"
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
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-danger-700">Failed to Load</p>
            <p className="text-sm text-enterprise-muted text-center max-w-md">
              {fallbackMessage}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="btn-outline mt-2"
              aria-label="Retry loading embedded content"
            >
              <svg
                className="w-4 h-4 mr-1.5"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card animate-fade-in">
      {title && (
        <div className="mb-4">
          <h3 className="section-title">{title}</h3>
        </div>
      )}
      <div className="relative w-full rounded-xl overflow-hidden border border-enterprise-border" style={containerStyle}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-enterprise-surface">
            <LoadingSpinner size="md" message={`Loading ${title}...`} />
          </div>
        )}
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          allow="fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
          aria-label={title}
        />
      </div>
    </div>
  )
}