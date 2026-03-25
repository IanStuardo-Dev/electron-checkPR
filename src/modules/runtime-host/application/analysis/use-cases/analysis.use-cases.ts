import type {
  PullRequestAiReview,
  PullRequestAnalysisPreview,
  RepositoryAnalysisResult,
  RepositorySnapshotPreview,
} from '../../../../../types/analysis';
import type { AnalysisApiKeyReaderPort } from '../ports/analysis-api-key-reader.port';
import type { PullRequestAnalysisPort, RepositoryAnalysisPort } from '../ports/analysis-services.port';
import { sanitizePullRequestAnalysisPayload } from '../services/pull-request-analysis-request-sanitizer.service';
import { sanitizeRepositoryAnalysisPayload } from '../services/repository-analysis-request-sanitizer.service';

export interface AnalysisOperations {
  previewRepositorySnapshot(payload: unknown): Promise<RepositorySnapshotPreview>;
  runRepositoryAnalysis(payload: unknown): Promise<RepositoryAnalysisResult>;
  cancelRepositoryAnalysis(requestId: string): Promise<void>;
  previewPullRequestAiReviews(payload: unknown): Promise<PullRequestAnalysisPreview[]>;
  runPullRequestAiReviews(payload: unknown): Promise<PullRequestAiReview[]>;
  cancelPullRequestAiReviews(requestId: string): Promise<void>;
}

export function createAnalysisOperations(
  repositoryAnalysisService: RepositoryAnalysisPort,
  pullRequestAnalysisService: PullRequestAnalysisPort,
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

