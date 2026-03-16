import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './styles/index.css';
import Sidebar from './components/Layout/Sidebar';
import TitleBar from './components/Layout/TitleBar';
import RouteLoadingState from './components/Layout/RouteLoadingState';

const History = React.lazy(() => import('./pages/History'));
const WorkspaceRoutes = React.lazy(() => import('./WorkspaceRoutes'));

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </Router>
  );
};

const AppShell = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="mx-auto flex h-full max-w-[1680px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TitleBar pathname={location.pathname} />
          <main key={location.pathname} className="min-w-0 flex-1 overflow-y-auto px-6 py-8 lg:px-10">
            <React.Suspense fallback={<RouteLoadingState pathname={location.pathname} />}>
              <Routes location={location}>
                <Route path="/history" element={<History />} />
                <Route path="*" element={<WorkspaceRoutes />} />
              </Routes>
            </React.Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
