import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview } from '../../../types/analysis';
import { invokeIpcResponse } from '../../shared/electron/ipcResponse';

export async function previewPullRequestAiReviews(payload: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]> {
  return invokeIpcResponse<PullRequestAnalysisPreview[]>('analysis:previewPullRequestAiReviews', payload);
}

export async function runPullRequestAiReviews(payload: PullRequestAnalysisBatchRequest): Promise<PullRequestAiReview[]> {
  return invokeIpcResponse<PullRequestAiReview[]>('analysis:runPullRequestAiReviews', payload);
}

export async function cancelPullRequestAiReviews(requestId: string): Promise<void> {
  await invokeIpcResponse<void>('analysis:cancelPullRequestAiReviews', requestId);
}
