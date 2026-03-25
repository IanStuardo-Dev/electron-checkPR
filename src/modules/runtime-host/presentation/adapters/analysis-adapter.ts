import type { PullRequestAnalysisPreview, RepositorySnapshotPreview } from '../../../../types/analysis';
import type { AnalysisOperations } from '../../application/analysis/use-cases/analysis.use-cases';
import { sanitizePullRequestAnalysisPayload } from '../../application/analysis/services/pull-request-analysis-request-sanitizer.service';
import { sanitizeRepositoryAnalysisPayload } from '../../application/analysis/services/repository-analysis-request-sanitizer.service';
import { registerBridgeCommand } from './bridge-response';

export const sanitizeAnalysisPayload = sanitizeRepositoryAnalysisPayload;
export { sanitizePullRequestAnalysisPayload };

export function bindAnalysisBridge(handlers: AnalysisOperations): void {
  registerBridgeCommand<unknown, RepositorySnapshotPreview>('analysis:previewRepositorySnapshot', async (payload) => (
    handlers.previewRepositorySnapshot(payload)
  ));
  registerBridgeCommand<unknown, unknown>('analysis:runRepositoryAnalysis', async (payload) => (
    handlers.runRepositoryAnalysis(payload)
  ));
  registerBridgeCommand<string, void>('analysis:cancelRepositoryAnalysis', async (requestId) => {
    await handlers.cancelRepositoryAnalysis(requestId);
  });
  registerBridgeCommand<unknown, PullRequestAnalysisPreview[]>('analysis:previewPullRequestAiReviews', async (payload) => (
    handlers.previewPullRequestAiReviews(payload)
  ));
  registerBridgeCommand<unknown, unknown>('analysis:runPullRequestAiReviews', async (payload) => (
    handlers.runPullRequestAiReviews(payload)
  ));
  registerBridgeCommand<string, void>('analysis:cancelPullRequestAiReviews', async (requestId) => {
    await handlers.cancelPullRequestAiReviews(requestId);
  });
}



