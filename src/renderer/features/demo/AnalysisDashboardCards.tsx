import React from 'react';
import { ChartBarIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import type { RepoMetrics } from './analysis-dashboard.data';

export const AnalysisDashboardCards = ({ selectedMetrics }: { selectedMetrics: RepoMetrics }) => (
  <div className="grid grid-cols-2 gap-6">
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <ChartBarIcon className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-medium">Complexity Analysis</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Overall Score</span>
          <span className="text-2xl font-semibold text-indigo-600">{selectedMetrics.complexity.score}</span>
        </div>
        <div className="space-y-2">
          {selectedMetrics.complexity.details.map((detail, index) => (
            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              {detail}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
        <h3 className="text-lg font-medium">Security Analysis</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Vulnerabilities</span>
          <span className={`text-2xl font-semibold ${
            selectedMetrics.security.severity === 'high' ? 'text-red-600' :
            selectedMetrics.security.severity === 'medium' ? 'text-amber-600' : 'text-green-600'
          }`}>
            {selectedMetrics.security.vulnerabilities}
          </span>
        </div>
        <div className="space-y-2">
          {selectedMetrics.security.details.map((detail, index) => (
            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
              {detail}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <DocumentDuplicateIcon className="w-6 h-6 text-amber-600" />
        <h3 className="text-lg font-medium">Code Duplication</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Duplication Rate</span>
          <span className="text-2xl font-semibold text-amber-600">{selectedMetrics.duplicates.percentage}%</span>
        </div>
        <div className="space-y-2">
          {selectedMetrics.duplicates.locations.map((loc, index) => (
            <div key={index} className="text-sm text-gray-600">
              <span className="font-medium">{loc.file}</span>
              <span className="text-gray-400"> (lines {loc.lines})</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <ChartBarIcon className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-medium">Code Quality</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Quality Score</span>
          <span className="text-2xl font-semibold text-green-600">{selectedMetrics.codeQuality.score}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm text-gray-600">
            <span className="block font-medium">Warnings</span>
            <span className="text-amber-600">{selectedMetrics.codeQuality.warnings}</span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="block font-medium">Errors</span>
            <span className="text-red-600">{selectedMetrics.codeQuality.errors}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
