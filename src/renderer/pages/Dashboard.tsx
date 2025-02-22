import React from 'react';
import { motion } from 'framer-motion';
import PRCard from '../components/Dashboard/PRCard';

const Dashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PRCard count={5} title="Pull Requests" />
      </div>
    </motion.div>
  );
};

export default Dashboard;