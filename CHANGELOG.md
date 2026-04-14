# Changelog

All notable changes to the QE Hub Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-20

### Added

#### Authentication & Authorization
- Mock authentication system with email-based user selection on the login page.
- Role-based access control supporting three roles: Admin, Test Lead, and View Only.
- Permission-based UI rendering — editable fields, admin pages, and upload functionality are gated by role.
- Session persistence via localStorage so users remain logged in across page refreshes.
- Protected route wrapper that redirects unauthenticated users and displays access denied for insufficient permissions.

#### Execution Dashboard
- **Release Readiness Dashboard** — tabular view of release readiness status across all programs with RAG indicators, pass rates, defect counts, and editable confidence index.
- **Showstopper Defects** — sortable, paginated table of critical and showstopper defects with priority, status, aging, assignee, environment, and WR details.
- **SIT Defect Summary** — charts and summary table for SIT environment defects including defects by application, severity distribution pie chart, stacked severity-by-application bar chart, and status distribution.
- **Domain Wise DSR** — expandable domain rows with WR-level daily status report details including RAG status, test coverage, execution percentage, dates, dependencies, risks, comments, and performance/DAST testing fields.
- **Program Wise DSR** — expandable program rows with the same WR-level DSR detail as domain view, grouped by program.
- **Program Drilldown** — interactive program selector with summary stat cards, coverage and execution bar charts, RAG distribution pie chart, defects-by-WR bar chart, test results stacked bar chart, application breakdown table, and full WR detail table.
- **Deferred Defects** — sortable table of deferred defects with priority, status, aging, assignee, environment, WR details, and editable deferral comment field.

#### Quality Metrics
- Aggregated quality metrics cards computed from DSR and defect data including average test coverage, pass rate, defect fix rate, open critical defects, total programs, total tests, average execution, open defects, programs on track, and programs at risk.
- RAG status summary banner showing Green, Amber, and Red counts with failed and blocked test totals.

#### Trend Analytics
- **Monthly QE Delivery Snapshot** — monthly trend charts for test execution (stacked bar), pass rate (area chart), defect opened vs closed (line chart), test results pie chart, release risk trend (stacked bar), and average defect aging (line chart) with a detailed monthly data table.
- **Application QE Defect Trends** — overall defect trend line chart, net open cumulative area chart, opened vs closed by application bar chart, application selector with per-application trend drilldown, and application defect summary table.
- **QE Defects by Severity** — overall severity pie chart, severity-by-month stacked bar chart, severity trend line chart, critical defect cumulative area chart, monthly severity drilldown with month selector, and monthly severity breakdown table.
- **SIT, UAT & Prod Defects by Application** — stacked environment bar chart by application, overall environment pie chart, environment trend line chart, monthly environment stacked bar chart, month selector with monthly drilldown charts, and application environment summary table.
- **Root Cause Analysis (RCA)** — overall RCA pie chart, RCA-by-month stacked bar chart, RCA trend line chart, code defect cumulative area chart, top root causes banner, month selector with monthly RCA drilldown, and monthly RCA breakdown table.

#### Embedded Dashboards
- **DevSecOps 2026 Roadmap** — embedded iframe for Jira Plans roadmap with loading spinner, error handling, and retry functionality.
- **Elastic Testing Readiness** — embedded iframe for Elastic observability dashboard with loading, error, and fallback states.
- **Jira Epic-level Progress** — embedded iframe for Jira dashboards with loading, error, and fallback states.

#### Resources
- **Confluence Links** — card-based layout of six key QE Confluence resource pages (Quality Management Process, Tools & Framework Hub, Defect Triage Guidelines, Environment Onboarding Guide, Release Calendar & Milestones, Test Metrics & KPI Glossary) with descriptions, tags, and external links.

#### Admin
- **Data Upload** — file upload interface supporting CSV and Excel formats for nine data types (DSR, Release Readiness, Showstopper Defects, Deferred Defects, Monthly Snapshot, Defect Trends, Severity Distribution, Environment Defects, RCA Data) with drag-and-drop, file validation, progress indicator, upload history table, and error/warning reporting.
- **Admin Settings** — tabbed settings page with editable fields configuration (enable/disable per field), Confluence links management (show/hide per link), audit log viewer with summary stats and clear functionality, and data management with full mock data reset.

#### Inline Editing
- Editable RAG status badges with dropdown selector on DSR and readiness views (Test Lead and Admin roles).
- Editable date fields (SIT sign-off, performance sign-off, DAST sign-off, BRD/DOU, TRD, code drop) via inline date picker on DSR views.
- Editable text fields (comments, risks, dependencies, TDM request number) via inline text input on DSR views.
- Editable select fields (performance testing, DAST testing) via inline dropdown on DSR views.
- Editable confidence index via inline cell editing on the readiness table.
- Editable deferral comments via inline text input on the deferred defects table.
- All inline edits persist to localStorage and are recorded in the audit log.

#### UI Components
- Reusable `StatCard` component with trend indicators, color variants, and icon support.
- Reusable `ChartCard` wrapper for Recharts visualizations with title, subtitle, and empty state.
- Reusable `DataTable` component with sorting, pagination, page size selection, inline cell editing, and empty state.
- Reusable `FilterBar` component with configurable visible filters, active filter pills, and reset functionality.
- Reusable `RAGBadge` component with optional editable dropdown for Green/Amber/Red status.
- Reusable `EditableCell` component supporting text, select, and date input types with save/cancel controls.
- Reusable `ExpandableRow` component for collapsible table row detail sections.
- Reusable `FileUpload` component with drag-and-drop, file validation, progress bar, and success/error states.
- Reusable `EmbedFrame` component for iframe embedding with loading spinner, error handling, and retry.
- Reusable `Modal` component with overlay, keyboard navigation, focus trap, and scroll lock.
- Reusable `LoadingSpinner` component with configurable size and message.
- Reusable `EmptyState` component with icon, title, message, and optional action button.

#### Layout
- Collapsible sidebar navigation with nested menu items, active state highlighting, role-based visibility, and user profile section.
- Sticky header with breadcrumb navigation, user avatar, role badge, and logout button.
- Responsive main layout with sidebar, header, and scrollable content area.

#### Data Layer
- localStorage-based data persistence with prefixed keys and JSON serialization.
- Service layer (`DSRService`, `DashboardService`, `DefectService`, `UploadService`) providing async CRUD operations with filter support.
- Filter utility functions for case-insensitive matching, array field filtering, and unique value extraction.
- Chart helper utilities for transforming raw data into Recharts-compatible bar, line, pie, and stacked bar formats.
- CSV/Excel parser using PapaParse and xlsx libraries with schema validation and type conversion.
- Audit logger recording all field edits with userId, timestamp, field name, old value, new value, entity type, and entity ID.
- Formatter utilities for dates, percentages, numbers, RAG colors, confidence colors, and text truncation.

#### Mock Data
- Comprehensive mock DSR dataset with 21 records across 8 domains, 8 programs, and 12 WR numbers spanning 4 releases.
- Mock showstopper defects dataset with 18 critical and major defects across 12 applications and 5 environments.
- Mock deferred defects dataset with 15 deferred defects across 12 applications with deferral comments.
- Mock readiness dataset with 12 release readiness records across 8 programs.
- Mock monthly snapshot dataset with 8 months of aggregated QE delivery metrics.
- Mock defect trends dataset with 80 monthly application-level defect trend records.
- Mock severity distribution dataset with 32 monthly severity breakdown records.
- Mock environment defects dataset with 98 monthly application-environment defect records.
- Mock RCA dataset with 56 monthly root cause category records.
- Mock user dataset with 12 users across Admin, Test Lead, and View Only roles.

#### Configuration
- Environment variable support via Vite for Jira, qTest, Elastic, Confluence base URLs, SSO client ID, and SSO authority.
- Tailwind CSS configuration with custom enterprise color palette, typography, spacing, shadows, and animations.
- ESLint configuration for React 18 with hooks rules and unused variable warnings.
- Vercel deployment configuration with SPA rewrite rules.