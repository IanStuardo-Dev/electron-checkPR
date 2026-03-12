import React from 'react';
import type {
  PullRequestAiReview,
  PullRequestAnalysisBatchRequest,
  PullRequestAnalysisPreview,
} from '../../../../types/analysis';
import type { RepositoryProviderKind } from '../../../../types/repository';
import type { SavedConnectionConfig, PrioritizedPullRequest } from '../types';
import {
  cancelPullRequestAiReviews,
  previewPullRequestAiReviews,
  runPullRequestAiReviews,
} from '../pullRequestAiIpc';
import { selectPullRequestsForAiReview } from '../../../../services/analysis/pull-request-analysis.selection';

interface UsePullRequestAiReviewsOptions {
  config: SavedConnectionConfig;
  pullRequests: PrioritizedPullRequest[];
  isConnectionReady: boolean;
  codexConfig: {
    apiKey: string;
    model: string;
    snapshotPolicy: {
      excludedPathPatterns: string;
      strictMode: boolean;
    };
    prReview: {
      enabled: boolean;
      maxPullRequests: number;
      selectionMode: 'top-risk' | 'oldest' | 'mixed';
      analysisDepth: 'standard' | 'deep';
      promptDirectives: {
        focusAreas: string;
        customInstructions: string;
      };
    };
  };
}

function buildAnalysisPayload(
  config: SavedConnectionConfig,
  codexConfig: UsePullRequestAiReviewsOptions['codexConfig'],
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

function buildErrorReviews(selectedPullRequests: PrioritizedPullRequest[]): PullRequestAiReview[] {
  return selectedPullRequests.map((pullRequest) => ({
    pullRequestId: pullRequest.id,
    repository: pullRequest.repository,
    status: 'error',
    topConcerns: [],
    reviewChecklist: [],
    error: 'No fue posible completar el analisis IA del PR.',
  }));
}

function upsertReviews(current: PullRequestAiReview[], nextReviews: PullRequestAiReview[]): PullRequestAiReview[] {
  const reviewMap = new Map(current.map((review) => [review.pullRequestId, review]));
  nextReviews.forEach((review) => {
    reviewMap.set(review.pullRequestId, review);
  });

  return Array.from(reviewMap.values());
}

export function usePullRequestAiReviews({
  config,
  pullRequests,
  isConnectionReady,
  codexConfig,
}: UsePullRequestAiReviewsOptions) {
  const [reviews, setReviews] = React.useState<PullRequestAiReview[]>([]);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [modalPreviews, setModalPreviews] = React.useState<PullRequestAnalysisPreview[]>([]);
  const [selectedPullRequests, setSelectedPullRequests] = React.useState<PrioritizedPullRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [snapshotAcknowledged, setSnapshotAcknowledged] = React.useState(false);
  const cacheRef = React.useRef(new Map<string, PullRequestAiReview[]>());
  const activeRequestIdRef = React.useRef<string | null>(null);

  const isConfigured = Boolean(
    isConnectionReady
    && config.provider
    && codexConfig.prReview.enabled
    && codexConfig.apiKey.trim(),
  );

  const buildCacheKey = React.useCallback((items: PrioritizedPullRequest[]) => JSON.stringify({
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
  }), [
    codexConfig.prReview.analysisDepth,
    codexConfig.prReview.promptDirectives,
    codexConfig.prReview.selectionMode,
    codexConfig.snapshotPolicy.excludedPathPatterns,
    codexConfig.snapshotPolicy.strictMode,
    config.organization,
    config.project,
    config.provider,
    config.repositoryId,
  ]);

  const openPreview = React.useCallback(async (nextPullRequests: PrioritizedPullRequest[]) => {
    if (!isConfigured || nextPullRequests.length === 0) {
      return;
    }

    setModalError(null);
    setSnapshotAcknowledged(false);
    setSelectedPullRequests(nextPullRequests);
    setModalPreviews([]);
    setIsModalOpen(true);
    setIsPreviewing(true);

    try {
      const previews = await previewPullRequestAiReviews(buildAnalysisPayload(config, codexConfig, nextPullRequests));
      setModalPreviews(previews);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'No fue posible preparar el snapshot local del PR.');
    } finally {
      setIsPreviewing(false);
    }
  }, [codexConfig, config, isConfigured]);

  const openPriorityQueueReview = React.useCallback(async () => {
    const selected = selectPullRequestsForAiReview(
      pullRequests,
      codexConfig.prReview.selectionMode,
      codexConfig.prReview.maxPullRequests,
    );

    await openPreview(selected);
  }, [codexConfig.prReview.maxPullRequests, codexConfig.prReview.selectionMode, openPreview, pullRequests]);

  const openPullRequestReview = React.useCallback(async (pullRequestId: number) => {
    const pullRequest = pullRequests.find((item) => item.id === pullRequestId);
    if (!pullRequest) {
      return;
    }

    await openPreview([pullRequest]);
  }, [openPreview, pullRequests]);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setIsPreviewing(false);
    setIsSubmitting(false);
    setModalError(null);
    setModalPreviews([]);
    setSelectedPullRequests([]);
    setSnapshotAcknowledged(false);
  }, []);

  const cancelRunningAnalysis = React.useCallback(async () => {
    const requestId = activeRequestIdRef.current;
    if (!requestId) {
      return;
    }

    try {
      await cancelPullRequestAiReviews(requestId);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'No fue posible cancelar la revision IA.');
    } finally {
      activeRequestIdRef.current = null;
      setIsSubmitting(false);
    }
  }, []);

  const eligiblePullRequests = React.useMemo(() => {
    const blockedIds = new Set(
      modalPreviews
        .filter((preview) => preview.lacksPatchCoverage || preview.strictModeWouldBlock)
        .map((preview) => preview.pullRequestId),
    );

    return selectedPullRequests.filter((pullRequest) => !blockedIds.has(pullRequest.id));
  }, [modalPreviews, selectedPullRequests]);

  const runSelectedPullRequests = React.useCallback(async () => {
    if (!isConfigured || eligiblePullRequests.length === 0) {
      return;
    }

    const cacheKey = buildCacheKey(eligiblePullRequests);
    if (cacheRef.current.has(cacheKey)) {
      const cachedReviews = cacheRef.current.get(cacheKey) || [];
      setReviews((current) => upsertReviews(current, cachedReviews));
      closeModal();
      return;
    }

    const queuedReviews = eligiblePullRequests.map((pullRequest) => ({
      pullRequestId: pullRequest.id,
      repository: pullRequest.repository,
      status: 'queued' as const,
      topConcerns: [],
      reviewChecklist: [],
    }));
    setReviews((current) => upsertReviews(current, queuedReviews));
    setIsSubmitting(true);
    setModalError(null);
    const requestId = `${Date.now()}-${eligiblePullRequests.map((pullRequest) => pullRequest.id).join('-')}`;
    activeRequestIdRef.current = requestId;

    try {
      const nextReviews = await runPullRequestAiReviews(buildAnalysisPayload(config, codexConfig, eligiblePullRequests, requestId));
      cacheRef.current.set(cacheKey, nextReviews);
      setReviews((current) => upsertReviews(current, nextReviews));
      closeModal();
    } catch (error) {
      const errorReviews = buildErrorReviews(eligiblePullRequests);
      setReviews((current) => upsertReviews(current, errorReviews));
      setModalError(error instanceof Error ? error.message : 'No fue posible ejecutar el analisis IA del PR.');
      setIsSubmitting(false);
    } finally {
      activeRequestIdRef.current = null;
    }
  }, [buildCacheKey, closeModal, codexConfig, config, eligiblePullRequests, isConfigured]);

  React.useEffect(() => {
    setReviews((current) => current.filter((review) => pullRequests.some((pullRequest) => pullRequest.id === review.pullRequestId)));
  }, [pullRequests]);

  return {
    reviews,
    isLoading: isPreviewing || isSubmitting,
    isPreviewing,
    isSubmitting,
    isConfigured,
    isModalOpen,
    modalError,
    modalPreviews,
    selectedPullRequests,
    snapshotAcknowledged,
    setSnapshotAcknowledged,
    eligiblePullRequests,
    openPriorityQueueReview,
    openPullRequestReview,
    runSelectedPullRequests,
    cancelRunningAnalysis,
    closeModal,
  };
}
