import React from 'react';
import { motion } from 'framer-motion';
import { BellIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotificationTest = () => {
  const showSuccessNotification = () => {
    new Notification('PR Approved', {
      body: 'The pull request "Feature: Auth System" has been approved',
      icon: './assets/success.png'
    });
  };

  const showErrorNotification = () => {
    new Notification('PR Rejected', {
      body: 'The pull request "Bug Fix: Login" has been rejected',
      icon: './assets/error.png'
    });
  };

  const showNewPRNotification = () => {
    new Notification('New Pull Request', {
      body: 'New PR available: "Feature: User Dashboard"',
      icon: './assets/info.png'
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-slate-800">Notification Tests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showNewPRNotification}
          className="p-6 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <BellIcon className="w-8 h-8 text-blue-500" />
            <span className="text-lg font-medium text-blue-700">New PR Notification</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showSuccessNotification}
          className="p-6 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <span className="text-lg font-medium text-green-700">Approval Notification</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showErrorNotification}
          className="p-6 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <XCircleIcon className="w-8 h-8 text-red-500" />
            <span className="text-lg font-medium text-red-700">Rejection Notification</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default NotificationTest;