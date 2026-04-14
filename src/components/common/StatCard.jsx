import { useMemo } from 'react'

const TREND_CONFIG = {
  up: {
    icon: (
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
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    ),
    colorClass: 'text-success-700',
    bgClass: 'bg-success-50',
    label: 'Trending up',
  },
  down: {
    icon: (
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
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    ),
    colorClass: 'text-danger-700',
    bgClass: 'bg-danger-50',
    label: 'Trending down',
  },
  neutral: {
    icon: (
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
          d="M5 12h14"
        />
      </svg>
    ),
    colorClass: 'text-enterprise-muted',
    bgClass: 'bg-enterprise-background',
    label: 'No change',
  },
}

const COLOR_CONFIG = {
  primary: {
    iconBg: 'bg-primary-50',
    iconText: 'text-primary-600',
  },
  success: {
    iconBg: 'bg-success-50',
    iconText: 'text-success-700',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconText: 'text-warning-700',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconText: 'text-danger-700',
  },
  info: {
    iconBg: 'bg-info-50',
    iconText: 'text-info-700',
  },
  secondary: {
    iconBg: 'bg-secondary-50',
    iconText: 'text-secondary-600',
  },
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary',
  subtitle,
}) {
  const colorClasses = useMemo(() => {
    return COLOR_CONFIG[color] || COLOR_CONFIG.primary
  }, [color])

  const trendConfig = useMemo(() => {
    if (!trend || !TREND_CONFIG[trend]) {
      return null
    }
    return TREND_CONFIG[trend]
  }, [trend])

  const displayValue = useMemo(() => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    return String(value)
  }, [value])

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-enterprise-muted truncate">
            {title || 'Metric'}
          </p>
          <p className="mt-2 text-2xl font-bold text-enterprise-dark truncate">
            {displayValue}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-enterprise-muted truncate">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`flex-shrink-0 ml-4 inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorClasses.iconBg} ${colorClasses.iconText}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      {trendConfig && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${trendConfig.bgClass} ${trendConfig.colorClass}`}
            aria-hidden="true"
          >
            {trendConfig.icon}
          </span>
          {trendValue !== null && trendValue !== undefined && (
            <span className={`text-sm font-medium ${trendConfig.colorClass}`}>
              {String(trendValue)}
            </span>
          )}
          <span className="text-xs text-enterprise-muted" aria-label={trendConfig.label}>
            {trendConfig.label}
          </span>
        </div>
      )}
    </div>
  )
}