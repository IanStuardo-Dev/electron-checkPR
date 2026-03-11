import type { RepositoryConnectionConfig } from './repository';

export interface RepositoryAnalysisPromptDirectives {
  architectureReviewEnabled: boolean;
  architecturePattern: string;
  requiredPractices: string;
  forbiddenPractices: string;
  domainContext: string;
  customInstructions: string;
}

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
  partialReason?: string;
  metrics?: {
    durationMs: number;
    retryCount: number;
    discardedByPrioritization: number;
    discardedBySize: number;
    discardedByBinaryDetection: number;
  };
}

export interface RepositoryAnalysisRequest {
  requestId: string;
  source: RepositoryConnectionConfig;
  repositoryId: string;
  branchName: string;
  model: string;
  apiKey: string;
  analysisDepth: 'standard' | 'deep';
  maxFilesPerRun: number;
  includeTests: boolean;
  timeoutMs?: number;
  promptDirectives?: RepositoryAnalysisPromptDirectives;
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
    partialReason?: string;
    durationMs?: number;
    retryCount?: number;
    discardedByPrioritization?: number;
    discardedBySize?: number;
    discardedByBinaryDetection?: number;
  };
}
