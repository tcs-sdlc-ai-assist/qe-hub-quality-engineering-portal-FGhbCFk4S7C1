# QE Hub Portal

Quality Engineering Hub — a centralized dashboard for tracking test execution, defect management, release readiness, and quality metrics across all QE programs.

## Tech Stack

- **React 18** with functional components and hooks
- **Vite 5** for fast development and optimized builds
- **Tailwind CSS 3** with custom enterprise design tokens
- **Recharts** for interactive data visualizations (bar, line, area, pie charts)
- **React Router v6** for client-side routing with nested layouts
- **PapaParse** and **xlsx** for CSV/Excel file parsing
- **localStorage** for client-side data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

```bash
npm install
```

### Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `VITE_APP_TITLE` | Application title | `QE Hub Portal` |
| `VITE_JIRA_BASE_URL` | Jira instance base URL | `https://your-org.atlassian.net` |
| `VITE_QTEST_BASE_URL` | qTest instance base URL | `https://your-org.qtestnet.com` |
| `VITE_ELASTIC_DASHBOARD_URL` | Elastic observability dashboard URL | `https://your-org.elastic.co` |
| `VITE_CONFLUENCE_BASE_URL` | Confluence wiki base URL | `https://your-org.atlassian.net/wiki` |
| `VITE_SSO_CLIENT_ID` | SSO/OIDC client ID | `your-sso-client-id` |
| `VITE_SSO_AUTHORITY` | SSO/OIDC authority URL | `https://your-org.auth-provider.com` |

> **Note:** All environment variables are optional. The portal runs fully with mock data when no external URLs are configured. Embedded dashboard pages will display a fallback message when their respective URLs are not set.

### Development

```bash
npm run dev
```

Opens the app at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Outputs optimized production files to the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Folder Structure

```
qe-hub-portal/
├── public/                          # Static assets
├── src/
│   ├── components/
│   │   ├── common/                  # Reusable UI components
│   │   │   ├── ChartCard.jsx        # Wrapper for Recharts visualizations
│   │   │   ├── DataTable.jsx        # Sortable, paginated table with inline editing
│   │   │   ├── EditableCell.jsx     # Inline text/select/date editor
│   │   │   ├── EmbedFrame.jsx       # Iframe embed with loading/error states
│   │   │   ├── EmptyState.jsx       # Empty data placeholder
│   │   │   ├── ExpandableRow.jsx    # Collapsible table row detail
│   │   │   ├── FileUpload.jsx       # Drag-and-drop file upload
│   │   │   ├── FilterBar.jsx        # Configurable filter dropdowns
│   │   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   │   ├── Modal.jsx            # Dialog with focus trap and scroll lock
│   │   │   ├── ProtectedRoute.jsx   # Auth and permission guard
│   │   │   ├── RAGBadge.jsx         # RAG status badge with editable dropdown
│   │   │   └── StatCard.jsx         # Metric card with trend indicator
│   │   ├── dashboard/               # Execution dashboard components
│   │   │   ├── DSRDomainView.jsx    # Domain-wise DSR with expandable rows
│   │   │   ├── DSRProgramView.jsx   # Program-wise DSR with expandable rows
│   │   │   ├── DeferredDefectTable.jsx
│   │   │   ├── ProgramDrilldownView.jsx
│   │   │   ├── QualityMetricsCards.jsx
│   │   │   ├── ReadinessTable.jsx
│   │   │   ├── SITDefectCharts.jsx
│   │   │   └── ShowstopperDefectTable.jsx
│   │   ├── layout/                  # App shell components
│   │   │   ├── Header.jsx           # Sticky header with breadcrumbs
│   │   │   ├── MainLayout.jsx       # Sidebar + header + content layout
│   │   │   └── Sidebar.jsx          # Collapsible navigation sidebar
│   │   └── trends/                  # Trend analytics components
│   │       ├── DefectTrendsChart.jsx
│   │       ├── EnvironmentDefectsChart.jsx
│   │       ├── MonthlySnapshotView.jsx
│   │       ├── RCAChart.jsx
│   │       └── SeverityDistributionChart.jsx
│   ├── constants/
│   │   ├── filters.js               # Domain, application, release, program lists
│   │   ├── navigation.js            # Sidebar navigation tree
│   │   └── roles.js                 # Role definitions and permission matrix
│   ├── contexts/
│   │   ├── AuthContext.jsx           # Authentication state and login/logout
│   │   └── FilterContext.jsx         # Global filter state
│   ├── data/
│   │   ├── mockDSR.js               # 21 DSR records across 8 domains
│   │   ├── mockDefects.js           # 18 showstopper + 15 deferred defects
│   │   ├── mockReadiness.js         # 12 release readiness records
│   │   ├── mockTrends.js            # Monthly snapshot, defect trends, severity, env, RCA
│   │   └── mockUsers.js             # 12 users across 3 roles
│   ├── pages/                       # Route-level page components
│   │   ├── AdminSettingsPage.jsx
│   │   ├── AdminUploadPage.jsx
│   │   ├── ConfluenceLinksPage.jsx
│   │   ├── DefectTrendsPage.jsx
│   │   ├── DeferredDefectsPage.jsx
│   │   ├── DomainDSRPage.jsx
│   │   ├── ElasticDashboardPage.jsx
│   │   ├── EnvironmentDefectsPage.jsx
│   │   ├── JiraDashboardPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MonthlySnapshotPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   ├── ProgramDSRPage.jsx
│   │   ├── ProgramDrilldownPage.jsx
│   │   ├── QualityMetricsPage.jsx
│   │   ├── RCAPage.jsx
│   │   ├── ReleaseReadinessPage.jsx
│   │   ├── RoadmapPage.jsx
│   │   ├── SITDefectSummaryPage.jsx
│   │   ├── SeverityPage.jsx
│   │   ├── ShowstopperDefectsPage.jsx
│   │   └── WelcomePage.jsx
│   ├── services/
│   │   ├── DSRService.js            # DSR CRUD with filter and audit logging
│   │   ├── DashboardService.js      # Readiness, quality metrics, monthly snapshot
│   │   ├── DefectService.js         # Showstopper, deferred, trends, severity, env, RCA
│   │   └── UploadService.js         # File upload processing and history
│   ├── utils/
│   │   ├── auditLogger.js           # Audit trail for field edits
│   │   ├── chartHelpers.js          # Recharts data transformation utilities
│   │   ├── csvParser.js             # CSV/Excel parsing with schema validation
│   │   ├── filterUtils.js           # Filter matching and unique value extraction
│   │   ├── formatters.js            # Date, number, percentage, RAG color formatters
│   │   └── storage.js               # localStorage wrapper with mock data seeding
│   ├── App.jsx                      # Root component with providers
│   ├── index.css                    # Tailwind directives and component classes
│   ├── main.jsx                     # React DOM entry point
│   └── routes.jsx                   # Route definitions with protected routes
├── .env.example
├── .eslintrc.cjs
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

## Features

### Authentication & Authorization

- Mock email-based login with user selection
- Three roles: **Admin**, **Test Lead**, **View Only**
- Permission-based UI rendering — editable fields, admin pages, and upload functionality are gated by role
- Session persistence via localStorage across page refreshes
- Protected route wrapper with access denied fallback

### Execution Dashboard

- **Release Readiness** — tabular view with RAG indicators, pass rates, defect counts, and editable confidence index
- **Showstopper Defects** — sortable, paginated table of critical defects with priority, status, aging, and environment
- **SIT Defect Summary** — charts and summary table for SIT defects by application, severity, and status
- **Domain Wise DSR** — expandable domain rows with WR-level daily status report details
- **Program Wise DSR** — expandable program rows with WR-level DSR details
- **Program Drilldown** — interactive program selector with summary cards, coverage/execution charts, RAG distribution, defect breakdown, and WR detail table
- **Deferred Defects** — sortable table with editable deferral comment field

### Quality Metrics

- Aggregated metric cards: average test coverage, pass rate, defect fix rate, open critical defects, total programs, programs on track, programs at risk
- RAG status summary banner with Green, Amber, Red counts

### Trend Analytics

- **Monthly QE Delivery Snapshot** — test execution, pass rate, defect, release risk, and defect aging trend charts with monthly data table
- **Application QE Defect Trends** — overall and per-application defect trend line charts, net open cumulative area chart, and application summary table
- **QE Defects by Severity** — severity pie chart, stacked bar by month, severity trend lines, critical defect cumulative area chart, and monthly drilldown
- **SIT, UAT & Prod Defects by Application** — stacked environment bar chart, environment trend lines, monthly environment stacked bar, and monthly drilldown
- **Root Cause Analysis (RCA)** — RCA pie chart, stacked bar by month, RCA trend lines, code defect cumulative area chart, top root causes banner, and monthly drilldown

### Embedded Dashboards

- **DevSecOps 2026 Roadmap** — embedded Jira Plans roadmap iframe
- **Elastic Testing Readiness** — embedded Elastic observability dashboard iframe
- **Jira Epic-level Progress** — embedded Jira dashboard iframe
- All embeds include loading spinner, error handling, and retry functionality

### Resources

- **Confluence Links** — card-based layout of six key QE Confluence resource pages with descriptions, tags, and external links

### Admin

- **Data Upload** — drag-and-drop file upload supporting CSV and Excel for nine data types with validation, progress indicator, upload history table, and error/warning reporting
- **Admin Settings** — editable fields configuration, Confluence links management, audit log viewer with summary stats and clear functionality, and data management with full mock data reset

### Inline Editing

- Editable RAG status badges with dropdown selector (Test Lead and Admin roles)
- Editable date fields via inline date picker
- Editable text fields via inline text input (comments, risks, dependencies)
- Editable select fields via inline dropdown (performance testing, DAST testing)
- Editable confidence index via inline cell editing on the readiness table
- Editable deferral comments on the deferred defects table
- All inline edits persist to localStorage and are recorded in the audit log

## Mock Data

The portal ships with comprehensive mock datasets that are seeded into localStorage on first load:

- **21** DSR records across 8 domains, 8 programs, and 12 WR numbers spanning 4 releases
- **18** showstopper defects across 12 applications and 5 environments
- **15** deferred defects with deferral comments
- **12** release readiness records across 8 programs
- **8** months of aggregated monthly QE delivery metrics
- **80** monthly application-level defect trend records
- **32** monthly severity breakdown records
- **98** monthly application-environment defect records
- **56** monthly root cause category records
- **12** users across Admin, Test Lead, and View Only roles

## Deployment

The project includes a `vercel.json` configuration for single-page application deployment on Vercel with client-side routing support.

```bash
npm run build
```

Deploy the `dist` directory to any static hosting provider (Vercel, Netlify, S3 + CloudFront, etc.).

## License

Private