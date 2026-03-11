import type { RepositoryConnectionConfig } from './repository';

export interface RepositoryFileSnapshot {
  path: string;
  extension: string;
  size: number;
  content: string;
}

export interface RepositorySnapshot {
  repository: string;
  branch: string;
  provider: RepositoryConnectionConfig['provider'];
  files: RepositoryFileSnapshot[];
  totalFilesDiscovered: number;
  truncated: boolean;
}

export interface RepositoryAnalysisRequest {
  source: RepositoryConnectionConfig;
  repositoryId: string;
  branchName: string;
  model: string;
  apiKey: string;
  analysisDepth: 'standard' | 'deep';
  maxFilesPerRun: number;
  includeTests: boolean;
}

export interface RepositoryAnalysisFinding {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'architecture' | 'maintainability' | 'performance' | 'testing';
  filePath: string;
  detail: string;
  recommendation: string;
}

export interface RepositoryAnalysisResult {
  provider: RepositoryConnectionConfig['provider'];
  repository: string;
  branch: string;
  model: string;
  summary: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topConcerns: string[];
  recommendations: string[];
  findings: RepositoryAnalysisFinding[];
  analyzedAt: string;
  snapshot: {
    totalFilesDiscovered: number;
    filesAnalyzed: number;
    truncated: boolean;
  };
}
