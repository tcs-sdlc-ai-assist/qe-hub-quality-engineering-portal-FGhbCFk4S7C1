import EmbedFrame from '../components/common/EmbedFrame.jsx'

const ELASTIC_DASHBOARD_URL = import.meta.env.VITE_ELASTIC_DASHBOARD_URL || ''

export default function ElasticDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Elastic – Testing Readiness</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Elastic dashboard providing real-time testing readiness metrics, test execution trends, and environment health indicators
        </p>
      </div>

      {/* Elastic Dashboard Embed */}
      <EmbedFrame
        src={ELASTIC_DASHBOARD_URL}
        title="Elastic Testing Readiness Dashboard"
        height="700px"
        fallbackMessage="Unable to load the Elastic dashboard. Please verify the Elastic dashboard URL is configured in your environment variables (VITE_ELASTIC_DASHBOARD_URL) or try again later."
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
              This embedded Elastic dashboard provides a real-time view of testing readiness across all environments.
              It includes test execution trends, environment health indicators, defect inflow/outflow metrics,
              and automated test pass rates sourced directly from the Elastic observability platform.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                Elastic
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                Real-time
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
                Testing Readiness
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                Environment Health
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}