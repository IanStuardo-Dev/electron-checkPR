import type { PullRequestAnalysisPreview, RepositorySnapshotPreview } from '../../../../../types/analysis';
import type { RepositoryAnalysisService } from '../../../../../services/analysis/repository-analysis.service';
import type { PullRequestAnalysisService } from '../../../../../services/analysis/pull-request-analysis.service';
import type { AnalysisApiKeyReaderPort } from '../ports/analysis-api-key-reader.port';
import { sanitizePullRequestAnalysisPayload } from '../services/pull-request-analysis-request-sanitizer.service';
import { sanitizeRepositoryAnalysisPayload } from '../services/repository-analysis-request-sanitizer.service';

export interface AnalysisOperations {
  previewRepositorySnapshot(payload: unknown): Promise<RepositorySnapshotPreview>;
  runRepositoryAnalysis(payload: unknown): Promise<unknown>;
  cancelRepositoryAnalysis(requestId: string): Promise<void>;
  previewPullRequestAiReviews(payload: unknown): Promise<PullRequestAnalysisPreview[]>;
  runPullRequestAiReviews(payload: unknown): Promise<unknown>;
  cancelPullRequestAiReviews(requestId: string): Promise<void>;
}

export function createAnalysisOperations(
  repositoryAnalysisService: RepositoryAnalysisService,
  pullRequestAnalysisService: PullRequestAnalysisService,
  apiKeyReader: AnalysisApiKeyReaderPort,
): AnalysisOperations {
  const readCodexApiKey = () => apiKeyReader.readCodexApiKey();

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


