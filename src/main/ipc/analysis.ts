import type { PullRequestAnalysisPreview, RepositorySnapshotPreview } from '../../types/analysis';
import type { RepositoryAnalysisService } from '../../services/analysis/repository-analysis.service';
import type { PullRequestAnalysisService } from '../../services/analysis/pull-request-analysis.service';
import type { SessionSecretsStore } from './session-secrets';
import { CODEX_SESSION_API_KEY } from '../../constants/session-secrets';
import { registerHandle } from './shared';
import { sanitizePullRequestAnalysisPayload } from './pull-request-analysis.sanitizer';
import { sanitizeRepositoryAnalysisPayload } from './repository-analysis.sanitizer';

export const sanitizeAnalysisPayload = sanitizeRepositoryAnalysisPayload;
export { sanitizePullRequestAnalysisPayload };

export function registerAnalysisIpc(
  repositoryAnalysisService: RepositoryAnalysisService,
  pullRequestAnalysisService: PullRequestAnalysisService,
  sessionSecretsStore: SessionSecretsStore,
): void {
  const readCodexApiKey = () => sessionSecretsStore.get(CODEX_SESSION_API_KEY);
  registerHandle<unknown, RepositorySnapshotPreview>('analysis:previewRepositorySnapshot', async (payload) => (
    repositoryAnalysisService.previewSnapshot(sanitizeRepositoryAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<unknown, unknown>('analysis:runRepositoryAnalysis', async (payload) => (
    repositoryAnalysisService.runAnalysis(sanitizeRepositoryAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<string, void>('analysis:cancelRepositoryAnalysis', async (requestId) => {
    repositoryAnalysisService.cancelAnalysis(requestId);
  });
  registerHandle<unknown, PullRequestAnalysisPreview[]>('analysis:previewPullRequestAiReviews', async (payload) => (
    pullRequestAnalysisService.previewBatch(sanitizePullRequestAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<unknown, unknown>('analysis:runPullRequestAiReviews', async (payload) => (
    pullRequestAnalysisService.analyzeBatch(sanitizePullRequestAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<string, void>('analysis:cancelPullRequestAiReviews', async (requestId) => {
    pullRequestAnalysisService.cancelAnalysis(requestId);
  });
}
