import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import './styles/index.css';
import Sidebar from './components/Layout/Sidebar';
import Settings from './pages/Settings';
import RepositoryAnalysis from './pages/RepositoryAnalysis';
import { RepositorySourceProvider } from './features/dashboard/context/RepositorySourceContext';

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RepositorySourceProvider>
        <div className="min-h-screen bg-slate-100">
          <div className="mx-auto flex min-h-screen max-w-[1600px]">
            <Sidebar />
            <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/repository-analysis" element={<RepositoryAnalysis />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </main>
          </div>
        </div>
      </RepositorySourceProvider>
    </Router>
  );
};

export default App;
