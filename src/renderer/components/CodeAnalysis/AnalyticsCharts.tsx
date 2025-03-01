import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface HistoricalData {
  date: string;
  complexity: number;
  duplicates: number;
  security: number;
  quality: number;
}

const AnalyticsCharts = ({ data }: { data: HistoricalData[] }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-lg font-medium mb-4">Trends Over Time</h3>
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="complexity" stroke="#6366f1" />
      <Line type="monotone" dataKey="duplicates" stroke="#f59e0b" />
      <Line type="monotone" dataKey="security" stroke="#ef4444" />
      <Line type="monotone" dataKey="quality" stroke="#10b981" />
    </LineChart>
  </div>
);

export default AnalyticsCharts;