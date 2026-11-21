import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import {AppLayout} from './components/layout/AppLayout';
import {OfficialLayout} from './components/official/OfficialLayout';
import {CitiSolveProvider, useCitiSolve} from './context/CitiSolveContext';
import {CitizenHomePage} from './pages/CitizenHomePage';
import {HistoryDashboardPage} from './pages/HistoryDashboardPage';
import {IssueDetailPage} from './pages/IssueDetailPage';
import {ProfileSettingsPage} from './pages/ProfileSettingsPage';
import {ReportIssuePage} from './pages/ReportIssuePage';
import {RewardsDashboardPage} from './pages/RewardsDashboardPage';
import {StatusDashboardPage} from './pages/StatusDashboardPage';
import {WelcomeAuthPage} from './pages/WelcomeAuthPage';
import {OfficialAnalyticsPage} from './pages/official/OfficialAnalyticsPage';
import {OfficialComplaintDetailPage} from './pages/official/OfficialComplaintDetailPage';
import {OfficialComplaintsPage} from './pages/official/OfficialComplaintsPage';
import {OfficialDashboardPage} from './pages/official/OfficialDashboardPage';
import {OfficialDepartmentsPage} from './pages/official/OfficialDepartmentsPage';
import {OfficialEscalationsPage} from './pages/official/OfficialEscalationsPage';
import {OfficialNotificationsPage} from './pages/official/OfficialNotificationsPage';
import {OfficialProfilePage} from './pages/official/OfficialProfilePage';
import {OfficialWardMapPage} from './pages/official/OfficialWardMapPage';
import {WardDepartmentTrackPage} from './pages/official/WardDepartmentTrackPage';
import {WardMapSeverityPage} from './pages/official/WardMapSeverityPage';
import {WardSolvedComplaintsPage} from './pages/official/WardSolvedComplaintsPage';

const ProtectedCitizenRoute: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {currentUser, currentOfficial} = useCitiSolve();
  if (currentOfficial) {
    return <Navigate to="/official" replace />;
  }
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const ProtectedOfficialRoute: React.FC<{
  children: React.ReactNode;
  municipalOnly?: boolean;
  wardOnly?: boolean;
}> = ({children, municipalOnly = false, wardOnly = false}) => {
  const {currentUser, currentOfficial} = useCitiSolve();
  if (currentUser) {
    return <Navigate to="/home" replace />;
  }
  if (!currentOfficial) {
    return <Navigate to="/" replace />;
  }
  if (municipalOnly && currentOfficial.roleLevel === 'ward_officer') {
    return <Navigate to="/official" replace />;
  }
  if (wardOnly && currentOfficial.roleLevel !== 'ward_officer') {
    return <Navigate to="/official" replace />;
  }
  return <OfficialLayout>{children}</OfficialLayout>;
};

const OfficialHomeRouter: React.FC = () => {
  const {currentOfficial} = useCitiSolve();
  if (currentOfficial?.roleLevel === 'ward_officer') {
    return <WardMapSeverityPage />;
  }
  return <OfficialDashboardPage />;
};

export default function App() {
  return (
    <CitiSolveProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeAuthPage />} />
          <Route
            path="/home"
            element={
              <ProtectedCitizenRoute>
                <CitizenHomePage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedCitizenRoute>
                <ReportIssuePage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <ProtectedCitizenRoute>
                <IssueDetailPage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/status"
            element={
              <ProtectedCitizenRoute>
                <StatusDashboardPage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedCitizenRoute>
                <RewardsDashboardPage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedCitizenRoute>
                <HistoryDashboardPage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedCitizenRoute>
                <ProfileSettingsPage />
              </ProtectedCitizenRoute>
            }
          />
          <Route
            path="/official"
            element={
              <ProtectedOfficialRoute>
                <OfficialHomeRouter />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/ward-track"
            element={
              <ProtectedOfficialRoute wardOnly>
                <WardDepartmentTrackPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/ward-solved"
            element={
              <ProtectedOfficialRoute wardOnly>
                <WardSolvedComplaintsPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/complaints"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialComplaintsPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/complaints/:id"
            element={
              <ProtectedOfficialRoute>
                <OfficialComplaintDetailPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/map"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialWardMapPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/departments"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialDepartmentsPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/escalations"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialEscalationsPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/analytics"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialAnalyticsPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/notifications"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialNotificationsPage />
              </ProtectedOfficialRoute>
            }
          />
          <Route
            path="/official/profile"
            element={
              <ProtectedOfficialRoute municipalOnly>
                <OfficialProfilePage />
              </ProtectedOfficialRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CitiSolveProvider>
  );
}

