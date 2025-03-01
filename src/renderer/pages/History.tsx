import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const History = () => {
  const navigate = useNavigate();

  const mockPRs = [
    {
      id: 123,
      title: "Feature: Auth Implementation",
      status: "Approved",
      huNumber: "HU-123",
      date: "2024-01-20",
      statusColor: "green"
    },
    {
      id: 124,
      title: "Fix: Login Validation",
      status: "Rejected",
      huNumber: "HU-124",
      date: "2024-01-21",
      statusColor: "red"
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azure HU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mockPRs.map((pr) => (
            <motion.tr 
              key={pr.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pr.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${pr.statusColor}-100 text-${pr.statusColor}-800`}>
                  {pr.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pr.huNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pr.date}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(`/pr/${pr.id}`)}
                  className="text-blue-600 hover:text-blue-800"
                  title="View PR Details"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </motion.button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;