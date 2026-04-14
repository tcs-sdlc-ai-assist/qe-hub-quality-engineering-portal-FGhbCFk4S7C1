import { useState, useRef, useCallback, useMemo } from 'react'
import { uploadExcelFile } from '../../services/UploadService.js'

const DEFAULT_ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls']
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB

const MIME_MAP = {
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
}

const UPLOAD_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
}

export default function FileUpload({
  onUpload,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  dataType = 'dsr',
}) {
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)
  const dragCounterRef = useRef(0)

  const acceptString = useMemo(() => {
    return acceptedTypes
      .map((ext) => {
        const mime = MIME_MAP[ext]
        return mime ? `${ext},${mime}` : ext
      })
      .join(',')
  }, [acceptedTypes])

  const maxSizeLabel = useMemo(() => {
    if (maxSize >= 1024 * 1024) {
      return `${Math.round(maxSize / (1024 * 1024))}MB`
    }
    if (maxSize >= 1024) {
      return `${Math.round(maxSize / 1024)}KB`
    }
    return `${maxSize}B`
  }, [maxSize])

  const acceptedTypesLabel = useMemo(() => {
    return acceptedTypes.map((ext) => ext.toUpperCase().replace('.', '')).join(', ')
  }, [acceptedTypes])

  const validateFile = useCallback(
    (file) => {
      if (!file) {
        return 'No file selected'
      }

      const fileName = file.name || ''
      const fileExtension = fileName.includes('.')
        ? `.${fileName.split('.').pop().toLowerCase()}`
        : ''

      if (!acceptedTypes.includes(fileExtension)) {
        return `Unsupported file type "${fileExtension}". Accepted types: ${acceptedTypesLabel}`
      }

      if (file.size > maxSize) {
        return `File size exceeds ${maxSizeLabel} limit`
      }

      if (file.size === 0) {
        return 'File is empty'
      }

      return null
    },
    [acceptedTypes, acceptedTypesLabel, maxSize, maxSizeLabel]
  )

  const handleFileSelect = useCallback(
    (file) => {
      setResult(null)
      setErrorMessage('')
      setProgress(0)

      const validationError = validateFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        setUploadState(UPLOAD_STATES.ERROR)
        setSelectedFile(null)
        return
      }

      setSelectedFile(file)
      setUploadState(UPLOAD_STATES.IDLE)
    },
    [validateFile]
  )

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files && e.target.files[0]
      if (file) {
        handleFileSelect(file)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFileSelect]
  )

  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragOver(false)

      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setErrorMessage('No file selected')
      setUploadState(UPLOAD_STATES.ERROR)
      return
    }

    setUploadState(UPLOAD_STATES.VALIDATING)
    setProgress(10)
    setErrorMessage('')
    setResult(null)

    try {
      setUploadState(UPLOAD_STATES.UPLOADING)
      setProgress(30)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      const uploadResult = await uploadExcelFile(selectedFile, dataType)

      clearInterval(progressInterval)
      setProgress(100)

      if (uploadResult.success) {
        setUploadState(UPLOAD_STATES.SUCCESS)
        setResult(uploadResult)

        if (typeof onUpload === 'function') {
          onUpload(uploadResult)
        }
      } else {
        setUploadState(UPLOAD_STATES.ERROR)
        setErrorMessage(uploadResult.error || 'Upload failed')
        setResult(uploadResult)
      }
    } catch (err) {
      console.error('[FileUpload] Upload error:', err)
      setUploadState(UPLOAD_STATES.ERROR)
      setErrorMessage(err.message || 'An unexpected error occurred during upload')
      setProgress(0)
    }
  }, [selectedFile, dataType, onUpload])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setUploadState(UPLOAD_STATES.IDLE)
    setProgress(0)
    setResult(null)
    setErrorMessage('')
    dragCounterRef.current = 0
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const isUploading = uploadState === UPLOAD_STATES.UPLOADING || uploadState === UPLOAD_STATES.VALIDATING

  const formatFileSize = useCallback((bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B'
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${bytes} B`
  }, [])

  const dropZoneClasses = useMemo(() => {
    const base =
      'relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-xl border-2 border-dashed transition-colors duration-150 cursor-pointer'

    if (isUploading) {
      return `${base} border-primary-300 bg-primary-50/30 cursor-not-allowed`
    }

    if (isDragOver) {
      return `${base} border-primary-500 bg-primary-50`
    }

    if (uploadState === UPLOAD_STATES.SUCCESS) {
      return `${base} border-success-500 bg-success-50/30`
    }

    if (uploadState === UPLOAD_STATES.ERROR) {
      return `${base} border-danger-500 bg-danger-50/30`
    }

    return `${base} border-enterprise-border bg-enterprise-background hover:border-primary-400 hover:bg-primary-50/20`
  }, [isDragOver, isUploading, uploadState])

  return (
    <div className="animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="File upload input"
        disabled={isUploading}
      />

      <div
        className={dropZoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!isUploading && !selectedFile ? handleBrowseClick : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isUploading && !selectedFile) {
            e.preventDefault()
            handleBrowseClick()
          }
        }}
        aria-label="Drag and drop file upload zone"
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8">
          {!selectedFile && uploadState !== UPLOAD_STATES.SUCCESS && (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600">
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-enterprise-dark">
                  <span className="text-primary-600 hover:text-primary-700">Browse files</span>
                  {' '}or drag and drop
                </p>
                <p className="mt-1 text-xs text-enterprise-muted">
                  {acceptedTypesLabel} up to {maxSizeLabel}
                </p>
              </div>
            </>
          )}

          {selectedFile && uploadState !== UPLOAD_STATES.SUCCESS && (
            <div className="flex items-center gap-3 w-full max-w-md">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">
                <svg
                  className="w-5 h-5"
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
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-enterprise-dark truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-enterprise-muted">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-enterprise-muted hover:text-enterprise-dark hover:bg-enterprise-background transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Remove selected file"
                >
                  <svg
                    className="w-4 h-4"
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
              )}
            </div>
          )}

          {uploadState === UPLOAD_STATES.SUCCESS && result && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-50 text-success-700">
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
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-success-700">Upload successful</p>
              <p className="text-xs text-enterprise-muted">
                {result.rowsImported} row{result.rowsImported !== 1 ? 's' : ''} imported
              </p>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-primary-700">
                  {uploadState === UPLOAD_STATES.VALIDATING ? 'Validating...' : 'Uploading...'}
                </span>
                <span className="text-xs font-medium text-primary-700">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {uploadState === UPLOAD_STATES.ERROR && errorMessage && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-500/20 animate-fade-in">
          <svg
            className="w-4 h-4 text-danger-700 flex-shrink-0 mt-0.5"
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
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-danger-700">{errorMessage}</p>
            {result && Array.isArray(result.errors) && result.errors.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {result.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx} className="text-xs text-danger-700">
                    {err.row > 0 ? `Row ${err.row}` : ''}
                    {err.field ? ` — ${err.field}` : ''}
                    {err.row > 0 || err.field ? ': ' : ''}
                    {err.message}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li className="text-xs text-danger-700 font-medium">
                    ...and {result.errors.length - 5} more error{result.errors.length - 5 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {result && Array.isArray(result.warnings) && result.warnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-warning-50 border border-warning-500/20 animate-fade-in">
          <svg
            className="w-4 h-4 text-warning-700 flex-shrink-0 mt-0.5"
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning-700">Warnings</p>
            <ul className="mt-1 space-y-0.5">
              {result.warnings.slice(0, 3).map((warn, idx) => (
                <li key={idx} className="text-xs text-warning-700">
                  {warn.field ? `${warn.field}: ` : ''}
                  {warn.message}
                </li>
              ))}
              {result.warnings.length > 3 && (
                <li className="text-xs text-warning-700 font-medium">
                  ...and {result.warnings.length - 3} more warning{result.warnings.length - 3 !== 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        {selectedFile && uploadState !== UPLOAD_STATES.SUCCESS && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-primary"
            aria-label="Upload file"
          >
            {isUploading ? (
              <>
                <div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                  aria-hidden="true"
                />
                {uploadState === UPLOAD_STATES.VALIDATING ? 'Validating...' : 'Uploading...'}
              </>
            ) : (
              <>
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload
              </>
            )}
          </button>
        )}

        {(uploadState === UPLOAD_STATES.SUCCESS || uploadState === UPLOAD_STATES.ERROR) && (
          <button
            type="button"
            onClick={handleReset}
            className="btn-outline"
            aria-label="Upload another file"
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
            Upload Another
          </button>
        )}

        {!selectedFile && uploadState === UPLOAD_STATES.IDLE && (
          <button
            type="button"
            onClick={handleBrowseClick}
            className="btn-secondary"
            aria-label="Browse files"
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
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
            Browse Files
          </button>
        )}
      </div>
    </div>
  )
}