export const NAVIGATION_ITEMS = [
  {
    id: 'welcome',
    label: 'Welcome',
    path: '/',
    icon: 'HomeIcon',
  },
  {
    id: 'execution-dashboard',
    label: 'Execution Dashboard',
    icon: 'ChartBarIcon',
    children: [
      {
        id: 'release-readiness',
        label: 'Release Readiness',
        path: '/execution/release-readiness',
      },
      {
        id: 'showstopper-defects',
        label: 'Showstopper Defects',
        path: '/execution/showstopper-defects',
      },
      {
        id: 'sit-defect-summary',
        label: 'SIT Defect Summary',
        path: '/execution/sit-defect-summary',
      },
      {
        id: 'domain-dsr',
        label: 'Domain DSR',
        path: '/execution/domain-dsr',
      },
      {
        id: 'program-dsr',
        label: 'Program DSR',
        path: '/execution/program-dsr',
      },
      {
        id: 'program-drilldown',
        label: 'Program Drilldown',
        path: '/execution/program-drilldown',
      },
      {
        id: 'deferred-defects',
        label: 'Deferred Defects',
        path: '/execution/deferred-defects',
      },
    ],
  },
  {
    id: 'quality-metrics',
    label: 'Quality Metrics',
    path: '/quality-metrics',
    icon: 'ClipboardDocumentCheckIcon',
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: 'ArrowTrendingUpIcon',
    children: [
      {
        id: 'monthly-snapshot',
        label: 'Monthly Snapshot',
        path: '/trends/monthly-snapshot',
      },
      {
        id: 'defect-trends',
        label: 'Defect Trends',
        path: '/trends/defect-trends',
      },
      {
        id: 'severity',
        label: 'Severity',
        path: '/trends/severity',
      },
      {
        id: 'environment',
        label: 'Environment',
        path: '/trends/environment',
      },
      {
        id: 'rca',
        label: 'RCA',
        path: '/trends/rca',
      },
    ],
  },
  {
    id: 'embeds',
    label: 'Embeds',
    icon: 'WindowIcon',
    children: [
      {
        id: 'roadmap',
        label: 'Roadmap',
        path: '/embeds/roadmap',
      },
      {
        id: 'elastic',
        label: 'Elastic',
        path: '/embeds/elastic',
      },
      {
        id: 'jira',
        label: 'Jira',
        path: '/embeds/jira',
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: 'BookOpenIcon',
    children: [
      {
        id: 'confluence-links',
        label: 'Confluence Links',
        path: '/resources/confluence-links',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'Cog6ToothIcon',
    requiredRole: 'ADMIN',
    children: [
      {
        id: 'upload',
        label: 'Upload',
        path: '/admin/upload',
      },
      {
        id: 'settings',
        label: 'Settings',
        path: '/admin/settings',
      },
    ],
  },
]