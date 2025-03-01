import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const NotificationTest = () => {
  const [progress, setProgress] = useState(0);

  const showSuccessNotification = () => {
    new Notification('PR Approved', {
      body: 'The pull request "Feature: Auth System" has been approved',
      silent: false
    });
  };

  const showPriorityNotification = () => {
    new Notification('⚠️ High Priority Review Needed', {
      body: 'Critical PR pending: "Security Fix: Auth Vulnerability"',
      requireInteraction: true,
      silent: false
    });
  };

  const showCommentNotification = () => {
    new Notification('💬 New Comment', {
      body: 'John Doe commented: "Could you explain this implementation?"',
      silent: true
    });
  };

  const showProgressNotification = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          new Notification('✅ Analysis Complete', {
            body: 'AI analysis of PR completed successfully'
          });
          return 100;
        }
        return prev + 20;
      });
    }, 1000);
  };

  const showConflictNotification = () => {
    new Notification('🔄 Merge Conflict Detected', {
      body: 'Conflicts found in PR #123. Action required.',
      requireInteraction: true
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-slate-800">Notification Tests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Existing notifications */}
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

        {/* Priority PR */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showPriorityNotification}
          className="p-6 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
            <span className="text-lg font-medium text-amber-700">Priority PR</span>
          </div>
        </motion.button>

        {/* Comment notification */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showCommentNotification}
          className="p-6 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <ChatBubbleLeftIcon className="w-8 h-8 text-blue-500" />
            <span className="text-lg font-medium text-blue-700">New Comment</span>
          </div>
        </motion.button>

        {/* Progress notification */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showProgressNotification}
          className="p-6 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <ClockIcon className="w-8 h-8 text-purple-500" />
              <span className="text-lg font-medium text-purple-700">Analysis Progress</span>
            </div>
            {progress > 0 && (
              <div className="w-full bg-purple-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </motion.button>

        {/* Conflict notification */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={showConflictNotification}
          className="p-6 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <CodeBracketIcon className="w-8 h-8 text-red-500" />
            <span className="text-lg font-medium text-red-700">Merge Conflict</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default NotificationTest;