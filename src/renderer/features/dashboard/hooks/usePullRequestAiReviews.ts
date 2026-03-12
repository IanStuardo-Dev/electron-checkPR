import React from 'react';
import type { PullRequestAiReview, PullRequestAnalysisBatchRequest } from '../../../../types/analysis';
import type { RepositoryProviderKind } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';
import type { PrioritizedPullRequest } from '../types';
import { runPullRequestAiReviews } from '../pullRequestAiIpc';
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
): PullRequestAnalysisBatchRequest {
  return {
    source: {
      ...config,
      provider: config.provider as RepositoryProviderKind,
    },
    apiKey: codexConfig.apiKey,
    model: codexConfig.model,
    analysisDepth: codexConfig.prReview.analysisDepth,
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
  const [isRunningQueue, setIsRunningQueue] = React.useState(false);
  const [activePullRequestId, setActivePullRequestId] = React.useState<number | null>(null);
  const cacheRef = React.useRef(new Map<string, PullRequestAiReview[]>());
  const activeRequestIdRef = React.useRef(0);
  const autoRunTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isConfigured = Boolean(
    isConnectionReady
    && config.provider
    && codexConfig.prReview.enabled
    && codexConfig.apiKey.trim(),
  );

  const autoSelection = React.useMemo(
    () => selectPullRequestsForAiReview(
      pullRequests,
      codexConfig.prReview.selectionMode,
      codexConfig.prReview.maxPullRequests,
    ),
    [codexConfig.prReview.maxPullRequests, codexConfig.prReview.selectionMode, pullRequests],
  );

  const buildCacheKey = React.useCallback((selectedPullRequests: PrioritizedPullRequest[]) => JSON.stringify({
    provider: config.provider,
    organization: config.organization,
    project: config.project,
    repositoryId: config.repositoryId,
    mode: codexConfig.prReview.selectionMode,
    depth: codexConfig.prReview.analysisDepth,
    strictMode: codexConfig.snapshotPolicy.strictMode,
    excludedPathPatterns: codexConfig.snapshotPolicy.excludedPathPatterns,
    promptDirectives: codexConfig.prReview.promptDirectives,
    items: selectedPullRequests.map((pullRequest) => ({
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

  const runBatch = React.useCallback(async (
    selectedPullRequests: PrioritizedPullRequest[],
    options: { mode: 'queue' | 'single'; replace?: boolean; force?: boolean },
  ) => {
    if (!isConfigured || selectedPullRequests.length === 0) {
      return;
    }

    const cacheKey = buildCacheKey(selectedPullRequests);
    if (!options.force && cacheRef.current.has(cacheKey)) {
      const cachedReviews = cacheRef.current.get(cacheKey) || [];
      setReviews((current) => (options.replace ? cachedReviews : upsertReviews(current, cachedReviews)));
      return;
    }

    const queuedReviews = selectedPullRequests.map((pullRequest) => ({
      pullRequestId: pullRequest.id,
      repository: pullRequest.repository,
      status: 'queued' as const,
      topConcerns: [],
      reviewChecklist: [],
    }));

    setReviews((current) => (options.replace ? queuedReviews : upsertReviews(current, queuedReviews)));

    if (options.mode === 'queue') {
      setIsRunningQueue(true);
    } else {
      setActivePullRequestId(selectedPullRequests[0]?.id ?? null);
    }
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    try {
      const nextReviews = await runPullRequestAiReviews(buildAnalysisPayload(config, codexConfig, selectedPullRequests));
      cacheRef.current.set(cacheKey, nextReviews);
      if (activeRequestIdRef.current === requestId) {
        setReviews((current) => (options.replace ? nextReviews : upsertReviews(current, nextReviews)));
      }
    } catch {
      const errorReviews = buildErrorReviews(selectedPullRequests);
      if (activeRequestIdRef.current === requestId) {
        setReviews((current) => (options.replace ? errorReviews : upsertReviews(current, errorReviews)));
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        if (options.mode === 'queue') {
          setIsRunningQueue(false);
        } else {
          setActivePullRequestId(null);
        }
      }
    }
  }, [buildCacheKey, codexConfig, config, isConfigured]);

  const runPriorityQueue = React.useCallback(async () => {
    await runBatch(autoSelection, { mode: 'queue', replace: true, force: true });
  }, [autoSelection, runBatch]);

  const runPullRequest = React.useCallback(async (pullRequestId: number) => {
    const pullRequest = pullRequests.find((item) => item.id === pullRequestId);
    if (!pullRequest) {
      return;
    }

    await runBatch([pullRequest], { mode: 'single', replace: false, force: true });
  }, [pullRequests, runBatch]);

  React.useEffect(() => {
    if (!isConfigured || pullRequests.length === 0) {
      setReviews([]);
      setIsRunningQueue(false);
      setActivePullRequestId(null);
      return;
    }
    const selectedPullRequests = autoSelection;

    if (selectedPullRequests.length === 0) {
      setReviews([]);
      setIsRunningQueue(false);
      setActivePullRequestId(null);
      return;
    }

    const cacheKey = buildCacheKey(selectedPullRequests);
    if (cacheRef.current.has(cacheKey)) {
      setReviews(cacheRef.current.get(cacheKey) || []);
      setIsRunningQueue(false);
      return undefined;
    }

    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
    }

    autoRunTimerRef.current = setTimeout(() => {
      void runBatch(selectedPullRequests, { mode: 'queue', replace: true, force: false });
    }, 350);

    return () => {
      if (autoRunTimerRef.current) {
        clearTimeout(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
    };
  }, [autoSelection, buildCacheKey, isConfigured, pullRequests.length, runBatch]);

  React.useEffect(() => () => {
    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
    }
  }, []);

  return {
    reviews,
    isLoading: isRunningQueue || activePullRequestId !== null,
    isRunningQueue,
    activePullRequestId,
    isConfigured,
    runPriorityQueue,
    runPullRequest,
  };
}
