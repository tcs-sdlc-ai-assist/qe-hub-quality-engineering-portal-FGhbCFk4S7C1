import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import ReleaseReadinessPage from './pages/ReleaseReadinessPage.jsx'
import ShowstopperDefectsPage from './pages/ShowstopperDefectsPage.jsx'
import SITDefectSummaryPage from './pages/SITDefectSummaryPage.jsx'
import DomainDSRPage from './pages/DomainDSRPage.jsx'
import ProgramDSRPage from './pages/ProgramDSRPage.jsx'
import ProgramDrilldownPage from './pages/ProgramDrilldownPage.jsx'
import DeferredDefectsPage from './pages/DeferredDefectsPage.jsx'
import QualityMetricsPage from './pages/QualityMetricsPage.jsx'
import RoadmapPage from './pages/RoadmapPage.jsx'
import ElasticDashboardPage from './pages/ElasticDashboardPage.jsx'
import JiraDashboardPage from './pages/JiraDashboardPage.jsx'
import MonthlySnapshotPage from './pages/MonthlySnapshotPage.jsx'
import DefectTrendsPage from './pages/DefectTrendsPage.jsx'
import SeverityPage from './pages/SeverityPage.jsx'
import EnvironmentDefectsPage from './pages/EnvironmentDefectsPage.jsx'
import RCAPage from './pages/RCAPage.jsx'
import ConfluenceLinksPage from './pages/ConfluenceLinksPage.jsx'
import AdminUploadPage from './pages/AdminUploadPage.jsx'
import AdminSettingsPage from './pages/AdminSettingsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <WelcomePage />,
      },
      {
        path: 'execution/release-readiness',
        element: <ReleaseReadinessPage />,
      },
      {
        path: 'execution/showstopper-defects',
        element: <ShowstopperDefectsPage />,
      },
      {
        path: 'execution/sit-defect-summary',
        element: <SITDefectSummaryPage />,
      },
      {
        path: 'execution/domain-dsr',
        element: <DomainDSRPage />,
      },
      {
        path: 'execution/program-dsr',
        element: <ProgramDSRPage />,
      },
      {
        path: 'execution/program-drilldown',
        element: <ProgramDrilldownPage />,
      },
      {
        path: 'execution/deferred-defects',
        element: <DeferredDefectsPage />,
      },
      {
        path: 'quality-metrics',
        element: <QualityMetricsPage />,
      },
      {
        path: 'trends/monthly-snapshot',
        element: <MonthlySnapshotPage />,
      },
      {
        path: 'trends/defect-trends',
        element: <DefectTrendsPage />,
      },
      {
        path: 'trends/severity',
        element: <SeverityPage />,
      },
      {
        path: 'trends/environment',
        element: <EnvironmentDefectsPage />,
      },
      {
        path: 'trends/rca',
        element: <RCAPage />,
      },
      {
        path: 'embeds/roadmap',
        element: <RoadmapPage />,
      },
      {
        path: 'embeds/elastic',
        element: <ElasticDashboardPage />,
      },
      {
        path: 'embeds/jira',
        element: <JiraDashboardPage />,
      },
      {
        path: 'resources/confluence-links',
        element: <ConfluenceLinksPage />,
      },
      {
        path: 'admin/upload',
        element: (
          <ProtectedRoute requiredPermission="upload_data">
            <AdminUploadPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute requiredPermission="manage_dashboards">
            <AdminSettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
])

export default router