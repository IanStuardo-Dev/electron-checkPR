import React from 'react';
import { motion } from 'framer-motion';

interface PRCardProps {
  count: number;
  title: string;
}

const PRCard = ({ count, title }: PRCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-4xl font-bold text-primary">{count}</p>
        <p className="ml-2 text-sm text-gray-500">pending reviews</p>
      </div>
    </motion.div>
  );
};

export default PRCard;