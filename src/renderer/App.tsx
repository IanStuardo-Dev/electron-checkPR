import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import './styles/index.css';
import NotificationTest from './pages/Notifications';
import PRDetail from './pages/PRDetail';
import AnalysisDashboard from './components/CodeAnalysis/AnalysisDashboard';
import Sidebar from './components/Layout/Sidebar';
import Settings from './pages/Settings';
import RepositoryAnalysis from './pages/RepositoryAnalysis';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <Sidebar />
          <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pr/:id" element={<PRDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/repository-analysis" element={<RepositoryAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analysis" element={
              <div>
                <h1>Testing Route</h1>
                <AnalysisDashboard />
              </div>
            } />
            <Route path="/notifications" element={<NotificationTest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
