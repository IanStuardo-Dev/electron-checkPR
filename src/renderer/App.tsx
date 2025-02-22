import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import './styles/index.css';
import NotificationTest from './pages/Notifications';

const App: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useState(240);

  return (
    <Router>
      <div className="flex h-screen bg-slate-100">
        <div 
          className="flex-1 overflow-x-hidden"
          style={{ marginRight: `${sidebarWidth}px` }}
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/notifications" element={<NotificationTest />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
        <Sidebar onWidthChange={setSidebarWidth} />
      </div>
    </Router>
  );
};

export default App;