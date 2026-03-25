import type { RepositoryConnectionConfig, ReviewItem } from '../repository';
import type { PullRequestAnalysisPromptDirectives } from './prompt-directives';
import type { RepositoryAnalysisSnapshotPolicy } from './snapshot';

export interface PullRequestAnalysisItemRequest {
  pullRequest: ReviewItem;
}

export interface PullRequestAnalysisBatchRequest {
  requestId?: string;
  source: RepositoryConnectionConfig;
  apiKey: string;
  model: string;
  analysisDepth: 'standard' | 'deep';
  timeoutMs?: number;
  maxItems?: number;
  previewConcurrency?: number;
  analysisConcurrency?: number;
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
