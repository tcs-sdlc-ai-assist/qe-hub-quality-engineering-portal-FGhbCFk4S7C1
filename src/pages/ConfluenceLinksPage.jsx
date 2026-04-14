import { useMemo } from 'react'

const CONFLUENCE_BASE_URL = import.meta.env.VITE_CONFLUENCE_BASE_URL || ''

const CONFLUENCE_LINKS = [
  {
    id: 'quality-management-process',
    title: 'QE Quality Management Process',
    description:
      'Comprehensive documentation covering the quality management lifecycle, test strategy templates, entry/exit criteria, defect management workflows, and release readiness checklists used across all QE programs.',
    path: '/spaces/QE/pages/quality-management-process',
    icon: (
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
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
        />
      </svg>
    ),
    color: 'primary',
    tags: ['Process', 'Test Strategy', 'Release Readiness'],
  },
  {
    id: 'tools-framework-hub',
    title: 'QE Tools & Framework Hub',
    description:
      'Central hub for QE tooling documentation including test automation frameworks, CI/CD pipeline integration guides, environment setup instructions, test data management, and performance testing toolkits.',
    path: '/spaces/QE/pages/tools-framework-hub',
    icon: (
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
          d="M11.42 15.17l-5.1-5.1a1.5 1.5 0 010-2.12l.71-.71a1.5 1.5 0 012.12 0l3.57 3.57 7.07-7.07a1.5 1.5 0 012.12 0l.71.71a1.5 1.5 0 010 2.12l-8.49 8.49a1.5 1.5 0 01-2.12 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21.75 12a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z"
        />
      </svg>
    ),
    color: 'info',
    tags: ['Automation', 'CI/CD', 'Test Data', 'Performance'],
  },
  {
    id: 'defect-triage-guidelines',
    title: 'Defect Triage Guidelines',
    description:
      'Guidelines and best practices for defect triage meetings, severity classification standards, escalation procedures, and defect lifecycle management across SIT, UAT, and Production environments.',
    path: '/spaces/QE/pages/defect-triage-guidelines',
    icon: (
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
    ),
    color: 'warning',
    tags: ['Defect Triage', 'Severity', 'Escalation'],
  },
  {
    id: 'environment-onboarding',
    title: 'Environment Onboarding Guide',
    description:
      'Step-by-step onboarding guide for new team members covering environment access requests, VPN setup, tool provisioning, Jira/qTest configuration, and test environment connectivity instructions.',
    path: '/spaces/QE/pages/environment-onboarding',
    icon: (
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
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
    color: 'success',
    tags: ['Onboarding', 'Environment', 'Access'],
  },
  {
    id: 'release-calendar',
    title: 'Release Calendar & Milestones',
    description:
      'Shared release calendar with key milestones, code freeze dates, SIT/UAT windows, go/no-go decision points, and production deployment schedules for all active programs.',
    path: '/spaces/QE/pages/release-calendar',
    icon: (
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
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
    color: 'secondary',
    tags: ['Release Calendar', 'Milestones', 'Code Freeze'],
  },
  {
    id: 'test-metrics-glossary',
    title: 'Test Metrics & KPI Glossary',
    description:
      'Definitions and calculation methodologies for all QE metrics and KPIs including test coverage, execution percentage, pass rate, defect density, defect fix rate, and release confidence index.',
    path: '/spaces/QE/pages/test-metrics-glossary',
    icon: (
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
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
    color: 'danger',
    tags: ['Metrics', 'KPIs', 'Glossary'],
  },
]

const COLOR_CONFIG = {
  primary: {
    iconBg: 'bg-primary-50',
    iconText: 'text-primary-600',
    hoverBorder: 'hover:border-primary-300',
  },
  success: {
    iconBg: 'bg-success-50',
    iconText: 'text-success-700',
    hoverBorder: 'hover:border-success-500/30',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconText: 'text-warning-700',
    hoverBorder: 'hover:border-warning-500/30',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconText: 'text-danger-700',
    hoverBorder: 'hover:border-danger-500/30',
  },
  info: {
    iconBg: 'bg-info-50',
    iconText: 'text-info-700',
    hoverBorder: 'hover:border-info-500/30',
  },
  secondary: {
    iconBg: 'bg-secondary-50',
    iconText: 'text-secondary-600',
    hoverBorder: 'hover:border-secondary-500/30',
  },
}

const TAG_COLORS = {
  primary: 'bg-primary-50 text-primary-700',
  info: 'bg-info-50 text-info-700',
  warning: 'bg-warning-50 text-warning-700',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  secondary: 'bg-secondary-50 text-secondary-600',
}

export default function ConfluenceLinksPage() {
  const links = useMemo(() => {
    return CONFLUENCE_LINKS.map((link) => ({
      ...link,
      href: CONFLUENCE_BASE_URL ? `${CONFLUENCE_BASE_URL}${link.path}` : null,
    }))
  }, [])

  const hasBaseUrl = useMemo(() => {
    return CONFLUENCE_BASE_URL && CONFLUENCE_BASE_URL.trim().length > 0
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="page-title">Confluence Resources</h2>
        <p className="mt-1 text-sm text-enterprise-muted">
          Quick access to key QE Confluence pages including quality management processes, tools &
          framework documentation, defect triage guidelines, and release calendars
        </p>
      </div>

      {/* URL Configuration Warning */}
      {!hasBaseUrl && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-500/20 animate-fade-in">
          <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warning-50 text-warning-700">
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
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning-700">
              Confluence Base URL Not Configured
            </p>
            <p className="mt-1 text-sm text-enterprise-muted">
              The Confluence base URL is not set. Please configure{' '}
              <code className="text-xs font-mono bg-warning-50 px-1 py-0.5 rounded">
                VITE_CONFLUENCE_BASE_URL
              </code>{' '}
              in your environment variables to enable direct links to Confluence pages.
            </p>
          </div>
        </div>
      )}

      {/* Confluence Link Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => {
          const colorClasses = COLOR_CONFIG[link.color] || COLOR_CONFIG.primary
          const tagColorClass = TAG_COLORS[link.color] || TAG_COLORS.primary

          const cardContent = (
            <>
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl ${colorClasses.iconBg} ${colorClasses.iconText}`}
                  aria-hidden="true"
                >
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-enterprise-dark">
                    {link.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-enterprise-muted leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {Array.isArray(link.tags) && link.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {link.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagColorClass}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Link Action */}
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600">
                <svg
                  className="w-4 h-4"
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
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
                <span>{link.href ? 'Open in Confluence' : 'URL not configured'}</span>
              </div>
            </>
          )

          if (link.href) {
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`card flex flex-col border border-transparent ${colorClasses.hoverBorder} transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`}
                aria-label={`Open ${link.title} in Confluence`}
              >
                {cardContent}
              </a>
            )
          }

          return (
            <div
              key={link.id}
              className="card flex flex-col border border-transparent opacity-75"
            >
              {cardContent}
            </div>
          )
        })}
      </div>

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
            <h3 className="section-title">About These Resources</h3>
            <p className="mt-1 text-sm text-enterprise-muted">
              These Confluence pages are maintained by the QE leadership team and serve as the
              single source of truth for quality engineering processes, tooling documentation, and
              operational guidelines. All links open in a new tab and require Confluence access
              through your organization&apos;s SSO.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                Confluence
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
                QE Documentation
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-50 text-info-700">
                SSO Required
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                Opens in New Tab
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}