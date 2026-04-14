import EmbedFrame from '../components/common/EmbedFrame.jsx'

const JIRA_DASHBOARD_URL = import.meta.env.VITE_JIRA_BASE_URL
  ? `${import.meta.env.VITE_JIRA_BASE_URL}/jira/dashboards`
  : ''

export default function JiraDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Jira Dashboard – Epic-level Progress</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Jira dashboard showing epic-level progress, percent completion, sprint velocity, and delivery status across all QE programs
        </p>
      </div>

      {/* Jira Dashboard Embed */}
      <EmbedFrame
        src={JIRA_DASHBOARD_URL}
        title="Jira Epic-level Progress Dashboard"
        height="700px"
        fallbackMessage="Unable to load the Jira dashboard. Please verify the Jira base URL is configured in your environment variables (VITE_JIRA_BASE_URL) or try again later."
      />

      {/* Additional Context */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-info-50 text-info-700">
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
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="section-title">About This Dashboard</h3>
            <p className="mt-1 text-sm text-enterprise-muted">
              This embedded Jira dashboard provides a real-time view of epic-level progress across all QE programs.
              It includes epic completion percentages, sprint velocity metrics, story point burndown,
              and cross-team delivery status sourced directly from Jira.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                Jira
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                Real-time
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
                Epic Progress
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                Percent Completion
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}