import type { PullRequestAnalysisPromptDirectives } from '../../../types/analysis';

export interface CodexIntegrationConfig {
  enabled: boolean;
  model: string;
  analysisDepth: 'standard' | 'deep';
  maxFilesPerRun: number;
  includeTests: boolean;
  repositoryScope: 'selected' | 'all';
  apiKey: string;
  snapshotPolicy: {
    excludedPathPatterns: string;
    strictMode: boolean;
  };
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
