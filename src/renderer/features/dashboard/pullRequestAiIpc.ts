import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview } from '../../../types/analysis';

interface IpcSuccessResponse<T> {
  ok: true;
  data: T;
}

interface IpcErrorResponse {
  ok: false;
  error: string;
}

type IpcResponse<T> = IpcSuccessResponse<T> | IpcErrorResponse;

export async function previewPullRequestAiReviews(payload: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]> {
  const response = await window.electronApi.invoke('analysis:previewPullRequestAiReviews', payload) as IpcResponse<PullRequestAnalysisPreview[]>;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

export async function runPullRequestAiReviews(payload: PullRequestAnalysisBatchRequest): Promise<PullRequestAiReview[]> {
  const response = await window.electronApi.invoke('analysis:runPullRequestAiReviews', payload) as IpcResponse<PullRequestAiReview[]>;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}
