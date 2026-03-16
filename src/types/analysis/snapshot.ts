import type { RepositoryConnectionConfig } from '../repository';

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

export interface PullRequestAnalysisPreview {
  pullRequestId: number;
  repository: string;
  title: string;
  filesPrepared: number;
  totalFilesChanged: number;
  includedFiles: string[];
  truncated: boolean;
  partialReason?: string;
  sensitivity: RepositorySnapshotSensitivitySummary;
  disclaimer: string;
  lacksPatchCoverage: boolean;
  strictModeWouldBlock: boolean;
}
