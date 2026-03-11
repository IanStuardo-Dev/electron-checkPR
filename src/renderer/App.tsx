import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import './styles/index.css';
import NotificationTest from './pages/Notifications';
import PRDetail from './pages/PRDetail';
import AnalysisDashboard from './components/CodeAnalysis/AnalysisDashboard';
import Sidebar from './components/Layout/Sidebar';
import Settings from './pages/Settings';
import RepositoryAnalysis from './pages/RepositoryAnalysis';
import { environment } from '../config/environment';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <Sidebar />
          <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/repository-analysis" element={<RepositoryAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pr/:id" element={environment.enableDemoRoutes ? <PRDetail /> : <Navigate to="/" replace />} />
            <Route path="/analysis" element={environment.enableDemoRoutes ? (
              <div>
                <h1>Testing Route</h1>
                <AnalysisDashboard />
              </div>
            ) : <Navigate to="/" replace />} />
            <Route path="/notifications" element={environment.enableDemoRoutes ? <NotificationTest /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
