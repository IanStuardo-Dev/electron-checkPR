import type { PullRequestAnalysisPromptDirectives } from '../../../types/analysis';
import type { RepositoryAnalysisSnapshotPolicy } from '../../../types/analysis/snapshot';

export interface CodexIntegrationConfig {
  enabled: boolean;
  model: string;
  analysisDepth: 'standard' | 'deep';
  maxFilesPerRun: number;
  includeTests: boolean;
  repositoryScope: 'selected' | 'all';
  apiKey: string;
  snapshotPolicy: RepositoryAnalysisSnapshotPolicy;
  prReview: {
    enabled: boolean;
    maxPullRequests: number;
    selectionMode: 'top-risk' | 'oldest' | 'mixed';
    analysisDepth: 'standard' | 'deep';
    promptDirectives: PullRequestAnalysisPromptDirectives;
  };
  promptDirectives: {
    architectureReviewEnabled: boolean;
    architecturePattern: string;
    requiredPractices: string;
    forbiddenPractices: string;
    domainContext: string;
    customInstructions: string;
  };
}
