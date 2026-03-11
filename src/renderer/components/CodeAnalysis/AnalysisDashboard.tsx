import React from 'react';
import { Tab } from '@headlessui/react';
import AnalyticsCharts from './AnalyticsCharts';
import { AnalysisDashboardCards } from '../../features/demo/AnalysisDashboardCards';
import { historicalAnalysisDemo, repositoryAnalysisDemo } from '../../features/demo/analysis-dashboard.data';

const AnalysisDashboard: React.FC = () => {
  const [repoAnalysis] = React.useState(repositoryAnalysisDemo);

  const [selectedRepo, setSelectedRepo] = React.useState<string | null>(null);
  const [historicalData] = React.useState(historicalAnalysisDemo);

  const selectedMetrics = React.useMemo(() => {
    const found = selectedRepo 
      ? repoAnalysis.repositories.find(repo => repo.repoName === selectedRepo)
      : repoAnalysis.repositories[0];
    
    return found || repoAnalysis.repositories[0]; // Fallback to first repo if nothing is found
  }, [selectedRepo, repoAnalysis.repositories]);

  // Now update the card references to use selectedMetrics safely
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Repositories Analysis Overview</h2>
          <p className="text-sm text-gray-600 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg"
            onChange={(e) => setSelectedRepo(e.target.value)}
            value={selectedRepo || ''}
          >
            <option value="">All Repositories</option>
            {repoAnalysis.repositories.map(repo => (
              <option key={repo.repoName} value={repo.repoName}>
                {repo.repoName}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
            Run Analysis
          </button>
        </div>
      </div>

      {/* Overall Health Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Overall Health</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-indigo-600">
              {repoAnalysis.overallHealth.score}%
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Critical Repos</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-red-600">
              {repoAnalysis.overallHealth.criticalRepos}
            </span>
          </div>
        </div>
        {/* ... más métricas generales ... */}
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-indigo-50 p-1">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
            ${selected
              ? 'bg-white text-indigo-700 shadow'
              : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
            }`
          }>
            Current Analysis
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
            ${selected
              ? 'bg-white text-indigo-700 shadow'
              : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
            }`
          }>
            Historical Trends
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <AnalysisDashboardCards selectedMetrics={selectedMetrics} />
          </Tab.Panel>
          <Tab.Panel>
            <AnalyticsCharts data={historicalData} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AnalysisDashboard;
