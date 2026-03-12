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

export function usePullRequestAiReviews({
  config,
  pullRequests,
  isConnectionReady,
  codexConfig,
}: UsePullRequestAiReviewsOptions) {
  const [reviews, setReviews] = React.useState<PullRequestAiReview[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const isConfigured = Boolean(
    isConnectionReady
    && config.provider
    && codexConfig.prReview.enabled
    && codexConfig.apiKey.trim(),
  );

  React.useEffect(() => {
    if (!isConfigured || pullRequests.length === 0) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    const selectedPullRequests = selectPullRequestsForAiReview(
      pullRequests,
      codexConfig.prReview.selectionMode,
      codexConfig.prReview.maxPullRequests,
    );

    if (selectedPullRequests.length === 0) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const payload: PullRequestAnalysisBatchRequest = {
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

    void runPullRequestAiReviews(payload)
      .then((nextReviews) => {
        if (!cancelled) {
          setReviews(nextReviews);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviews(selectedPullRequests.map((pullRequest) => ({
            pullRequestId: pullRequest.id,
            repository: pullRequest.repository,
            status: 'error',
            topConcerns: [],
            reviewChecklist: [],
            error: 'No fue posible completar el analisis IA del PR.',
          })));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codexConfig, config, isConfigured, pullRequests]);

  return {
    reviews,
    isLoading,
    isConfigured,
  };
}
