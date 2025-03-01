import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface Suggestion {
  type: 'improvement' | 'warning' | 'optimization';
  message: string;
  impact: 'high' | 'medium' | 'low';
  file?: string;
}

const Suggestions = ({ suggestions }: { suggestions: Suggestion[] }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <LightBulbIcon className="w-6 h-6 text-yellow-500" />
      <h3 className="text-lg font-medium">Suggestions</h3>
    </div>
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <div 
          key={index}
          className={`p-3 rounded-lg ${
            suggestion.type === 'improvement' ? 'bg-blue-50' :
            suggestion.type === 'warning' ? 'bg-amber-50' : 'bg-green-50'
          }`}
        >
          <div className="flex justify-between">
            <span className="font-medium">{suggestion.message}</span>
            <span className={`text-sm ${
              suggestion.impact === 'high' ? 'text-red-600' :
              suggestion.impact === 'medium' ? 'text-amber-600' : 'text-blue-600'
            }`}>
              {suggestion.impact} impact
            </span>
          </div>
          {suggestion.file && (
            <span className="text-sm text-gray-500 block mt-1">
              File: {suggestion.file}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default Suggestions;