export interface AnalysisMetrics {
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

export interface HistoricalData {
  date: string;
  complexity: number;
  duplicates: number;
  security: number;
  quality: number;
}

export interface RepoMetrics extends AnalysisMetrics {
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

export interface RepositoryAnalysisDemo {
  repositories: RepoMetrics[];
  overallHealth: {
    score: number;
    criticalRepos: number;
    totalIssues: number;
    securityVulnerabilities: number;
  };
}

export const repositoryAnalysisDemo: RepositoryAnalysisDemo = {
  repositories: [
    {
      repoName: 'frontend-app',
      lastAnalysis: '2024-01-29',
      status: 'warning',
      trend: 'declining',
      team: 'Web Team',
      department: 'Engineering',
      issueResolution: {
        averageTime: 48,
        openIssues: 15,
        resolvedLastWeek: 8,
      },
      complexity: {
        score: 85,
        issues: 3,
        details: ['Function X is too complex (15)', 'Class Y has too many methods'],
      },
      duplicates: {
        percentage: 4.2,
        locations: [
          { file: 'src/components/Auth.tsx', lines: '15-25' },
          { file: 'src/utils/validation.ts', lines: '45-55' },
        ],
      },
      security: {
        vulnerabilities: 2,
        severity: 'medium',
        details: ['Potential SQL injection', 'Insecure random number generation'],
      },
      codeQuality: {
        score: 92,
        warnings: 5,
        errors: 1,
      },
    },
    {
      repoName: 'backend-api',
      lastAnalysis: '2024-01-29',
      status: 'healthy',
      trend: 'improving',
      team: 'API Team',
      department: 'Engineering',
      issueResolution: {
        averageTime: 24,
        openIssues: 5,
        resolvedLastWeek: 12,
      },
      complexity: {
        score: 92,
        issues: 1,
        details: ['Minor complexity in auth service'],
      },
      duplicates: {
        percentage: 2.1,
        locations: [],
      },
      security: {
        vulnerabilities: 0,
        severity: 'low',
        details: [],
      },
      codeQuality: {
        score: 95,
        warnings: 2,
        errors: 0,
      },
    },
  ],
  overallHealth: {
    score: 87,
    criticalRepos: 1,
    totalIssues: 15,
    securityVulnerabilities: 3,
  },
};

export const historicalAnalysisDemo: HistoricalData[] = [
  {
    date: '2024-01-15',
    complexity: 82,
    duplicates: 5.1,
    security: 3,
    quality: 88,
  },
  {
    date: '2024-01-22',
    complexity: 85,
    duplicates: 4.2,
    security: 2,
    quality: 92,
  },
  {
    date: '2024-01-29',
    complexity: 87,
    duplicates: 3.8,
    security: 1,
    quality: 94,
  },
];
