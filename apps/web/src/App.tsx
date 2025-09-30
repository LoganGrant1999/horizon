import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import DashboardPage from './pages/app/DashboardPage';
import BodyMapPage from './pages/app/BodyMapPage';
import JournalPage from './pages/app/JournalPage';
import PrescriptionsPage from './pages/app/PrescriptionsPage';
import ReportsPage from './pages/app/ReportsPage';
import SettingsPage from './pages/app/SettingsPage';
import { initAnalytics } from './lib/analytics';

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Onboarding (protected but doesn't redirect) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute skipOnboardingCheck>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="body-map" element={<BodyMapPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all - redirect to dashboard if authed, login if not */}
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}

export default App;