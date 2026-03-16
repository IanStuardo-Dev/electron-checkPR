import React from 'react';
import type { PullRequestAiReview, PullRequestAnalysisPreview } from '../../../../types/analysis';
import type { SavedConnectionConfig, PrioritizedPullRequest } from '../types';
import {
  cancelPullRequestAiReviews,
  previewPullRequestAiReviews,
  runPullRequestAiReviews,
} from '../pullRequestAiIpc';
import { selectPullRequestsForAiReview } from '../../../../services/analysis/pull-request-analysis.selection';
import {
  buildErrorReviews,
  buildPullRequestAnalysisPayload,
  buildPullRequestReviewCacheKey,
  getEligiblePullRequests,
  upsertReviews,
} from '../pullRequestAiReviews.helpers';

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

  const buildCacheKey = React.useCallback((items: PrioritizedPullRequest[]) => (
    buildPullRequestReviewCacheKey(config, codexConfig, items)
  ), [codexConfig, config]);

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
      const previews = await previewPullRequestAiReviews(buildPullRequestAnalysisPayload(config, codexConfig, nextPullRequests));
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
    return getEligiblePullRequests(selectedPullRequests, modalPreviews);
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
      const nextReviews = await runPullRequestAiReviews(
        buildPullRequestAnalysisPayload(config, codexConfig, eligiblePullRequests, requestId),
      );
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
