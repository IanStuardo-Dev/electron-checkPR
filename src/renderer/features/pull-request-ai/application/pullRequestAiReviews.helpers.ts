import type {
  PullRequestAiReview,
  PullRequestAnalysisBatchRequest,
  PullRequestAnalysisPreview,
} from '../../../../types/analysis';
import type { RepositoryProviderKind, PrioritizedPullRequest } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../../repository-source';
import type { CodexIntegrationConfig } from '../../settings';

export function buildPullRequestAnalysisPayload(
  config: SavedConnectionConfig,
  codexConfig: Pick<CodexIntegrationConfig, 'model' | 'snapshotPolicy' | 'prReview'>,
  selectedPullRequests: PrioritizedPullRequest[],
  requestId = '',
): PullRequestAnalysisBatchRequest {
  return {
    requestId,
    source: {
      ...config,
      provider: config.provider as RepositoryProviderKind,
    },
    apiKey: '',
    model: codexConfig.model,
    analysisDepth: codexConfig.prReview.analysisDepth,
    timeoutMs: 60_000,
    snapshotPolicy: codexConfig.snapshotPolicy,
    promptDirectives: codexConfig.prReview.promptDirectives,
    items: selectedPullRequests.map((pullRequest) => ({ pullRequest })),
  };
}

export function buildPullRequestReviewCacheKey(
  config: SavedConnectionConfig,
  codexConfig: Pick<CodexIntegrationConfig, 'snapshotPolicy' | 'prReview'>,
  items: PrioritizedPullRequest[],
): string {
  return JSON.stringify({
    provider: config.provider,
    organization: config.organization,
    project: config.project,
    repositoryId: config.repositoryId,
    mode: codexConfig.prReview.selectionMode,
    depth: codexConfig.prReview.analysisDepth,
    strictMode: codexConfig.snapshotPolicy.strictMode,
    excludedPathPatterns: codexConfig.snapshotPolicy.excludedPathPatterns,
    promptDirectives: codexConfig.prReview.promptDirectives,
    items: items.map((pullRequest) => ({
      id: pullRequest.id,
      createdAt: pullRequest.createdAt,
      riskScore: pullRequest.riskScore,
      ageHours: pullRequest.ageHours,
    })),
  });
}

export function buildErrorReviews(selectedPullRequests: PrioritizedPullRequest[]): PullRequestAiReview[] {
  return selectedPullRequests.map((pullRequest) => ({
    pullRequestId: pullRequest.id,
    repository: pullRequest.repository,
    status: 'error',
    topConcerns: [],
    reviewChecklist: [],
    error: 'No fue posible completar el analisis IA del PR.',
  }));
}

export function buildQueuedReviews(selectedPullRequests: PrioritizedPullRequest[]): PullRequestAiReview[] {
  return selectedPullRequests.map((pullRequest) => ({
    pullRequestId: pullRequest.id,
    repository: pullRequest.repository,
    status: 'queued' as const,
    topConcerns: [],
    reviewChecklist: [],
  }));
}

export function filterReviewsByPullRequests(
  current: PullRequestAiReview[],
  pullRequests: PrioritizedPullRequest[],
): PullRequestAiReview[] {
  return current.filter((review) => pullRequests.some((pullRequest) => pullRequest.id === review.pullRequestId));
}

export function upsertReviews(
  current: PullRequestAiReview[],
  nextReviews: PullRequestAiReview[],
): PullRequestAiReview[] {
  const reviewMap = new Map(current.map((review) => [review.pullRequestId, review]));
  nextReviews.forEach((review) => {
    reviewMap.set(review.pullRequestId, review);
  });

  return Array.from(reviewMap.values());
}

export function getEligiblePullRequests(
  selectedPullRequests: PrioritizedPullRequest[],
  modalPreviews: PullRequestAnalysisPreview[],
): PrioritizedPullRequest[] {
  const blockedIds = new Set(
    modalPreviews
      .filter((preview) => preview.lacksPatchCoverage || preview.strictModeWouldBlock)
      .map((preview) => preview.pullRequestId),
  );

  return selectedPullRequests.filter((pullRequest) => !blockedIds.has(pullRequest.id));
}
