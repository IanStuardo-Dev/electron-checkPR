import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface FiltersProps {
  onFilterChange: (filters: AnalysisFilters) => void;
}

export interface AnalysisFilters {
  severity: ('high' | 'medium' | 'low')[];
  types: ('complexity' | 'security' | 'quality' | 'duplicates')[];
  threshold: number;
}

const AnalysisFilters = ({ onFilterChange }: FiltersProps) => {
  const [filters, setFilters] = React.useState<AnalysisFilters>({
    severity: ['high', 'medium'],
    types: ['complexity', 'security'],
    threshold: 80
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4 items-center">
      <FunnelIcon className="w-5 h-5 text-gray-500" />
      <select 
        className="px-3 py-1 border rounded-md text-sm"
        multiple
        value={filters.severity}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, option => option.value) as ('high' | 'medium' | 'low')[];
          setFilters(prev => ({ ...prev, severity: values }));
        }}
      >
        <option value="high">High Severity</option>
        <option value="medium">Medium Severity</option>
        <option value="low">Low Severity</option>
      </select>

      <select
        className="px-3 py-1 border rounded-md text-sm"
        multiple
        value={filters.types}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, option => option.value) as ('complexity' | 'security' | 'quality' | 'duplicates')[];
          setFilters(prev => ({ ...prev, types: values }));
        }}
      >
        <option value="complexity">Complexity</option>
        <option value="security">Security</option>
        <option value="quality">Quality</option>
        <option value="duplicates">Duplicates</option>
      </select>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Quality Threshold:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={filters.threshold}
          onChange={(e) => setFilters(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
          className="w-32"
        />
        <span className="text-sm font-medium">{filters.threshold}%</span>
      </div>
    </div>
  );
};

export default AnalysisFilters;