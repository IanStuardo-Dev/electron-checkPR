import React from 'react';
import { ChartBarIcon, ExclamationTriangleIcon, DocumentDuplicateIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import AnalyticsCharts from './AnalyticsCharts';

interface AnalysisMetrics {
  complexity: {
    score: number;
    issues: number;
    details: string[];
  };
  duplicates: {
    percentage: number;
    locations: { file: string; lines: string }[];
  };
  security: {
    vulnerabilities: number;
    severity: 'low' | 'medium' | 'high';
    details: string[];
  };
  codeQuality: {
    score: number;
    warnings: number;
    errors: number;
  };
}

interface HistoricalData {
  date: string;
  complexity: number;
  duplicates: number;
  security: number;
  quality: number;
}

interface TeamFilter {
  department: string;
  team: string;
}

interface RepoMetrics extends AnalysisMetrics {
  repoName: string;
  lastAnalysis: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  team: string;
  department: string;
  issueResolution: {
    averageTime: number;
    openIssues: number;
    resolvedLastWeek: number;
  };
}

interface RepositoryAnalysis {
  repositories: RepoMetrics[];
  overallHealth: {
    score: number;
    criticalRepos: number;
    totalIssues: number;
    securityVulnerabilities: number;
  };
}

const AnalysisDashboard: React.FC = () => {
  const [repoAnalysis] = React.useState<RepositoryAnalysis>({
    repositories: [
      {
        repoName: "frontend-app",
        lastAnalysis: "2024-01-29",
        status: "warning",
        trend: "declining",
        team: "Web Team",
        department: "Engineering",
        issueResolution: {
          averageTime: 48,
          openIssues: 15,
          resolvedLastWeek: 8
        },
        complexity: {
          score: 85,
          issues: 3,
          details: ['Function X is too complex (15)', 'Class Y has too many methods']
        },
        duplicates: {
          percentage: 4.2,
          locations: [
            { file: 'src/components/Auth.tsx', lines: '15-25' },
            { file: 'src/utils/validation.ts', lines: '45-55' }
          ]
        },
        security: {
          vulnerabilities: 2,
          severity: 'medium',
          details: ['Potential SQL injection', 'Insecure random number generation']
        },
        codeQuality: {
          score: 92,
          warnings: 5,
          errors: 1
        }
      },
      {
        repoName: "backend-api",
        lastAnalysis: "2024-01-29",
        status: "healthy",
        trend: "improving",
        team: "API Team",
        department: "Engineering",
        issueResolution: {
          averageTime: 24,
          openIssues: 5,
          resolvedLastWeek: 12
        },
        complexity: {
          score: 92,
          issues: 1,
          details: ['Minor complexity in auth service']
        },
        duplicates: {
          percentage: 2.1,
          locations: []
        },
        security: {
          vulnerabilities: 0,
          severity: 'low',
          details: []
        },
        codeQuality: {
          score: 95,
          warnings: 2,
          errors: 0
        }
      }
    ],
    overallHealth: {
      score: 87,
      criticalRepos: 1,
      totalIssues: 15,
      securityVulnerabilities: 3
    }
  });

  const [selectedRepo, setSelectedRepo] = React.useState<string | null>(null);
  const [historicalData] = React.useState<HistoricalData[]>([
    {
      date: '2024-01-15',
      complexity: 82,
      duplicates: 5.1,
      security: 3,
      quality: 88
    },
    {
      date: '2024-01-22',
      complexity: 85,
      duplicates: 4.2,
      security: 2,
      quality: 92
    },
    {
      date: '2024-01-29',
      complexity: 87,
      duplicates: 3.8,
      security: 1,
      quality: 94
    }
  ]);

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
            <div className="grid grid-cols-2 gap-6">
              {/* Update all card references from metrics to selectedMetrics */}
              {/* Example for Complexity Card: */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-medium">Complexity Analysis</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overall Score</span>
                    <span className="text-2xl font-semibold text-indigo-600">
                      {selectedMetrics.complexity.score}
                    </span>
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

              {/* Security Card */}
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

              {/* Duplicates Card */}
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

              {/* Code Quality Card */}
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