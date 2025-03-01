import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import './styles/index.css';
import NotificationTest from './pages/Notifications';
import PRDetail from './pages/PRDetail';
import AnalysisDashboard from './components/CodeAnalysis/AnalysisDashboard';
import { 
  HomeIcon, 
  ChartBarIcon, 
  ClockIcon, 
  BellIcon 
} from '@heroicons/react/24/outline';
import './styles/index.css';

const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-white shadow-sm">
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-800">CheckPR</h1>
          </div>
          <nav className="mt-8 space-y-2 px-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              Dashboard
            </NavLink>
            <NavLink
              to="/analysis"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <ChartBarIcon className="w-5 h-5 mr-3" />
              Code Analysis
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg ${
                  isActive? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <ClockIcon className="w-5 h-5 mr-3" />
              History
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg ${
                  isActive? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <BellIcon className="w-5 h-5 mr-3" />
              Notifications
            </NavLink>

          </nav>
        </div>

        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pr/:id" element={<PRDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/analysis" element={
              <div>
                <h1>Testing Route</h1>
                <AnalysisDashboard />
              </div>
            } />
            <Route path="/notifications" element={<NotificationTest />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;