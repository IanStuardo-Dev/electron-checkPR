import type { RepositoryConnectionConfig } from './repository';
import type { ReviewItem } from './repository';

export interface RepositoryAnalysisPromptDirectives {
  architectureReviewEnabled: boolean;
  architecturePattern: string;
  requiredPractices: string;
  forbiddenPractices: string;
  domainContext: string;
  customInstructions: string;
}

export interface PullRequestAnalysisPromptDirectives {
  focusAreas: string;
  customInstructions: string;
}

export interface RepositoryAnalysisSnapshotPolicy {
  excludedPathPatterns: string;
  strictMode: boolean;
}

export interface RepositoryFileSnapshot {
  path: string;
  extension: string;
  size: number;
  content: string;
}

export interface RepositorySnapshotExclusions {
  omittedByPrioritization: string[];
  omittedBySize: string[];
  omittedByBinaryDetection: string[];
}

export interface RepositorySnapshotSensitivityFinding {
  kind: 'sensitive-config' | 'secret-pattern';
  path: string;
  reason: string;
  confidence: 'medium' | 'high';
  lineNumber?: number;
  codeSnippet?: string;
}

export interface RepositorySnapshotSensitivitySummary {
  findings: RepositorySnapshotSensitivityFinding[];
  hasSensitiveConfigFiles: boolean;
  hasSecretPatterns: boolean;
  noSensitiveConfigFilesDetected: boolean;
  summary: string;
}

export interface RepositorySnapshot {
  repository: string;
  branch: string;
  provider: RepositoryConnectionConfig['provider'];
  files: RepositoryFileSnapshot[];
  totalFilesDiscovered: number;
  truncated: boolean;
  partialReason?: string;
  exclusions?: RepositorySnapshotExclusions;
  metrics?: {
    durationMs: number;
    retryCount: number;
    discardedByPrioritization: number;
    discardedBySize: number;
    discardedByBinaryDetection: number;
  };
}

export interface RepositorySnapshotPreview {
  provider: RepositoryConnectionConfig['provider'];
  repository: string;
  branch: string;
  includedFiles: string[];
  filesPrepared: number;
  totalFilesDiscovered: number;
  truncated: boolean;
  partialReason?: string;
  exclusions: RepositorySnapshotExclusions;
  sensitivity: RepositorySnapshotSensitivitySummary;
  disclaimer: string;
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
  snapshotPolicy?: RepositoryAnalysisSnapshotPolicy;
  timeoutMs?: number;
  promptDirectives?: RepositoryAnalysisPromptDirectives;
}

export interface PullRequestChangedFileSnapshot {
  path: string;
  status: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

export interface PullRequestSnapshot {
  provider: RepositoryConnectionConfig['provider'];
  repository: string;
  pullRequestId: number;
  title: string;
  description: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  reviewers: Array<{
    displayName: string;
    vote: number;
    isRequired?: boolean;
  }>;
  files: PullRequestChangedFileSnapshot[];
  totalFilesChanged: number;
  truncated: boolean;
  partialReason?: string;
}

export interface PullRequestAnalysisItemRequest {
  pullRequest: ReviewItem;
}

export interface PullRequestAnalysisBatchRequest {
  source: RepositoryAnalysisRequest['source'];
  apiKey: string;
  model: string;
  analysisDepth: 'standard' | 'deep';
  promptDirectives?: PullRequestAnalysisPromptDirectives;
  snapshotPolicy?: RepositoryAnalysisSnapshotPolicy;
  items: PullRequestAnalysisItemRequest[];
}

export interface PullRequestAiReview {
  pullRequestId: number;
  repository: string;
  status: 'not-configured' | 'queued' | 'analyzed' | 'error' | 'omitted';
  riskScore?: number;
  shortSummary?: string;
  topConcerns: string[];
  reviewChecklist: string[];
  coverageNote?: string;
  error?: string;
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
