import { useAuth } from '../../contexts/AuthContext.jsx'

export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content gap-3 py-8 animate-fade-in">
        <div
          className="w-8 h-8 border-[3px] border-enterprise-border border-t-primary-600 rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm text-enterprise-muted font-medium">
          Verifying access...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-16 px-4 animate-fade-in">
        <div className="card max-w-md w-full text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-50 text-warning-700 mx-auto mb-4">
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-enterprise-dark mb-1">
            Authentication Required
          </h2>
          <p className="text-sm text-enterprise-muted mb-6">
            Please log in to access this page.
          </p>
          <a
            href="/"
            className="btn-primary inline-flex"
            aria-label="Go to login page"
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
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-16 px-4 animate-fade-in">
        <div className="card max-w-md w-full text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-50 text-danger-700 mx-auto mb-4">
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-enterprise-dark mb-1">
            Access Denied
          </h2>
          <p className="text-sm text-enterprise-muted mb-6">
            You do not have the required permissions to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <a
            href="/"
            className="btn-outline inline-flex"
            aria-label="Return to home page"
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
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            Return Home
          </a>
        </div>
      </div>
    )
  }

  return children
}