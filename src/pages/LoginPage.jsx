import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { MOCK_USERS } from '../data/mockUsers.js'
import { ROLES } from '../constants/roles.js'

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.TEST_LEAD]: 'Test Lead',
  [ROLES.VIEW_ONLY]: 'View Only',
}

const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full access to all features including admin settings, uploads, and dashboard management',
  [ROLES.TEST_LEAD]: 'Edit RAG status, confidence index, comments, DSR fields, and upload data',
  [ROLES.VIEW_ONLY]: 'View-only access to all dashboards and reports',
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [selectedEmail, setSelectedEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const usersByRole = useMemo(() => {
    const grouped = {}

    MOCK_USERS.forEach((user) => {
      const role = user.role || 'UNKNOWN'
      if (!grouped[role]) {
        grouped[role] = []
      }
      grouped[role].push(user)
    })

    return grouped
  }, [])

  const roleKeys = useMemo(() => {
    return [ROLES.ADMIN, ROLES.TEST_LEAD, ROLES.VIEW_ONLY].filter(
      (role) => usersByRole[role] && usersByRole[role].length > 0
    )
  }, [usersByRole])

  const selectedUser = useMemo(() => {
    if (!selectedEmail) return null
    return MOCK_USERS.find((u) => u.email === selectedEmail) || null
  }, [selectedEmail])

  const handleUserSelect = useCallback((email) => {
    setSelectedEmail(email)
    setError('')
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      if (!selectedEmail) {
        setError('Please select a user to continue')
        return
      }

      setIsSubmitting(true)
      setError('')

      try {
        const result = login(selectedEmail)

        if (result.success) {
          navigate('/')
        } else {
          setError(result.error || 'Login failed. Please try again.')
        }
      } catch (err) {
        console.error('[LoginPage] Login error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [selectedEmail, login, navigate]
  )

  if (isAuthenticated) {
    navigate('/')
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-enterprise-background px-4 py-12 animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4">
            <svg
              className="w-8 h-8"
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
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-enterprise-dark">
            QE Hub Portal
          </h1>
          <p className="mt-2 text-sm text-enterprise-muted">
            Quality Engineering Hub — Select a user to sign in
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="card">
          <div className="mb-6">
            <h2 className="section-title">Select User</h2>
            <p className="mt-1 text-sm text-enterprise-muted">
              Choose a mock user below to explore the portal with different role permissions
            </p>
          </div>

          {/* Role Groups */}
          <div className="space-y-6">
            {roleKeys.map((role) => {
              const users = usersByRole[role]
              const roleLabel = ROLE_LABELS[role] || role
              const roleDescription = ROLE_DESCRIPTIONS[role] || ''

              let roleBadgeClasses = 'bg-info-50 text-info-700'
              if (role === ROLES.ADMIN) {
                roleBadgeClasses = 'bg-danger-50 text-danger-700'
              } else if (role === ROLES.TEST_LEAD) {
                roleBadgeClasses = 'bg-warning-50 text-warning-700'
              }

              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClasses}`}
                    >
                      {roleLabel}
                    </span>
                    {roleDescription && (
                      <span className="text-xs text-enterprise-muted hidden sm:inline">
                        {roleDescription}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {users.map((user) => {
                      const isSelected = selectedEmail === user.email

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user.email)}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'bg-primary-50 border-2 border-primary-500 shadow-card'
                              : 'bg-enterprise-background border-2 border-transparent hover:bg-enterprise-border hover:border-enterprise-border'
                          }`}
                          aria-label={`Select user ${user.name}`}
                          aria-pressed={isSelected}
                        >
                          <div
                            className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
                              isSelected
                                ? 'bg-primary-600 text-white'
                                : 'bg-primary-100 text-primary-700'
                            }`}
                            aria-hidden="true"
                          >
                            {user.avatar || user.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isSelected ? 'text-primary-700' : 'text-enterprise-dark'
                              }`}
                            >
                              {user.name}
                            </p>
                            <p className="text-xs text-enterprise-muted truncate">
                              {user.email}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-primary-600"
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
                                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected User Summary */}
          {selectedUser && (
            <div className="mt-6 p-4 rounded-lg bg-primary-50 border border-primary-200 animate-fade-in">
              <div className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white text-sm font-semibold"
                  aria-hidden="true"
                >
                  {selectedUser.avatar || selectedUser.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-700">
                    Signing in as {selectedUser.name}
                  </p>
                  <p className="text-xs text-primary-600">
                    {ROLE_LABELS[selectedUser.role] || selectedUser.role} — {selectedUser.domain || 'All Domains'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-500/20 animate-fade-in">
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
              <p className="text-sm font-medium text-danger-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={!selectedEmail || isSubmitting}
              className="btn-primary w-full justify-center py-3"
              aria-label="Sign in"
            >
              {isSubmitting ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
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
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-enterprise-muted">
            This is a prototype login for demonstration purposes.
          </p>
          <p className="text-xs text-enterprise-muted mt-1">
            In production, this will integrate with SSO / OIDC authentication.
          </p>
        </div>
      </div>
    </div>
  )
}