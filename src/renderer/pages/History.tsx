import React from 'react';
import { motion } from 'framer-motion';

const History = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azure HU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <motion.tr 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hover:bg-gray-50 transition-colors"
          >
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Feature: Auth Implementation</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                Approved
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">HU-123</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-20</td>
          </motion.tr>
        </tbody>
      </table>
    </div>
  );
};

export default History;