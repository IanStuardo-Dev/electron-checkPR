import type { PullRequestAnalysisPreview, RepositorySnapshotPreview } from '../../types/analysis';
import type { RepositoryAnalysisService } from '../../services/analysis/repository-analysis.service';
import type { PullRequestAnalysisService } from '../../services/analysis/pull-request-analysis.service';
import type { AnalysisApiKeyResolverPort } from './analysis-api-key-resolver';
import { sanitizePullRequestAnalysisPayload } from './pull-request-analysis.sanitizer';
import { sanitizeRepositoryAnalysisPayload } from './repository-analysis.sanitizer';

export interface AnalysisIpcHandlers {
  previewRepositorySnapshot(payload: unknown): Promise<RepositorySnapshotPreview>;
  runRepositoryAnalysis(payload: unknown): Promise<unknown>;
  cancelRepositoryAnalysis(requestId: string): Promise<void>;
  previewPullRequestAiReviews(payload: unknown): Promise<PullRequestAnalysisPreview[]>;
  runPullRequestAiReviews(payload: unknown): Promise<unknown>;
  cancelPullRequestAiReviews(requestId: string): Promise<void>;
}

export function createAnalysisIpcHandlers(
  repositoryAnalysisService: RepositoryAnalysisService,
  pullRequestAnalysisService: PullRequestAnalysisService,
  apiKeyResolver: AnalysisApiKeyResolverPort,
): AnalysisIpcHandlers {
  const readCodexApiKey = () => apiKeyResolver.readCodexApiKey();

  return {
    previewRepositorySnapshot(payload) {
      return repositoryAnalysisService.previewSnapshot(
        sanitizeRepositoryAnalysisPayload(payload, readCodexApiKey()),
      );
    },
    runRepositoryAnalysis(payload) {
      return repositoryAnalysisService.runAnalysis(
        sanitizeRepositoryAnalysisPayload(payload, readCodexApiKey()),
      );
    },
    async cancelRepositoryAnalysis(requestId) {
      repositoryAnalysisService.cancelAnalysis(requestId);
    },
    previewPullRequestAiReviews(payload) {
      return pullRequestAnalysisService.previewBatch(
        sanitizePullRequestAnalysisPayload(payload, readCodexApiKey()),
      );
    },
    runPullRequestAiReviews(payload) {
      return pullRequestAnalysisService.analyzeBatch(
        sanitizePullRequestAnalysisPayload(payload, readCodexApiKey()),
      );
    },
    async cancelPullRequestAiReviews(requestId) {
      pullRequestAnalysisService.cancelAnalysis(requestId);
    },
  };
}
