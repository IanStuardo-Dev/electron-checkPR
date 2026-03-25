import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview } from '../../../../types/analysis';
import { invokeBridgeResponse } from '../../../shared/electron/bridgeResponse';

export async function previewPullRequestAiReviews(payload: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]> {
  return invokeBridgeResponse<PullRequestAnalysisPreview[]>('analysis:previewPullRequestAiReviews', payload);
}

export async function runPullRequestAiReviews(payload: PullRequestAnalysisBatchRequest): Promise<PullRequestAiReview[]> {
  return invokeBridgeResponse<PullRequestAiReview[]>('analysis:runPullRequestAiReviews', payload);
}

export async function cancelPullRequestAiReviews(requestId: string): Promise<void> {
  await invokeBridgeResponse<void>('analysis:cancelPullRequestAiReviews', requestId);
}


