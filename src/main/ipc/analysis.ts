import type { PullRequestAnalysisPreview, RepositorySnapshotPreview } from '../../types/analysis';
import { registerHandle } from './shared';
import type { AnalysisIpcHandlers } from './analysis-handlers';
import { sanitizePullRequestAnalysisPayload } from './pull-request-analysis.sanitizer';
import { sanitizeRepositoryAnalysisPayload } from './repository-analysis.sanitizer';

export const sanitizeAnalysisPayload = sanitizeRepositoryAnalysisPayload;
export { sanitizePullRequestAnalysisPayload };

export function registerAnalysisIpc(handlers: AnalysisIpcHandlers): void {
  registerHandle<unknown, RepositorySnapshotPreview>('analysis:previewRepositorySnapshot', async (payload) => (
    handlers.previewRepositorySnapshot(payload)
  ));
  registerHandle<unknown, unknown>('analysis:runRepositoryAnalysis', async (payload) => (
    handlers.runRepositoryAnalysis(payload)
  ));
  registerHandle<string, void>('analysis:cancelRepositoryAnalysis', async (requestId) => {
    await handlers.cancelRepositoryAnalysis(requestId);
  });
  registerHandle<unknown, PullRequestAnalysisPreview[]>('analysis:previewPullRequestAiReviews', async (payload) => (
    handlers.previewPullRequestAiReviews(payload)
  ));
  registerHandle<unknown, unknown>('analysis:runPullRequestAiReviews', async (payload) => (
    handlers.runPullRequestAiReviews(payload)
  ));
  registerHandle<string, void>('analysis:cancelPullRequestAiReviews', async (requestId) => {
    await handlers.cancelPullRequestAiReviews(requestId);
  });
}
