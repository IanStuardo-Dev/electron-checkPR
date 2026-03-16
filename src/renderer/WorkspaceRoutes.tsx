import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RouteLoadingState from './components/Layout/RouteLoadingState';
import { RepositorySourceProvider } from './features/dashboard/context/RepositorySourceContext';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const RepositoryAnalysis = React.lazy(() => import('./pages/RepositoryAnalysis'));

const WorkspaceRoutes = () => {
  const location = useLocation();

  return (
    <RepositorySourceProvider>
      <React.Suspense fallback={<RouteLoadingState pathname={location.pathname} />}>
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repository-analysis" element={<RepositoryAnalysis />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </RepositorySourceProvider>
  );
};

export default WorkspaceRoutes;
