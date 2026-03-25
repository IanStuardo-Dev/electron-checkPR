import type {
  PullRequestAiReview,
  PullRequestAnalysisBatchRequest,
  PullRequestAnalysisPreview,
  RepositoryAnalysisRequest,
  RepositoryAnalysisResult,
  RepositorySnapshotPreview,
} from '../../../../../types/analysis';

export interface RepositoryAnalysisPort {
  previewSnapshot(request: RepositoryAnalysisRequest): Promise<RepositorySnapshotPreview>;
  runAnalysis(request: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResult>;
  cancelAnalysis(requestId: string): void;
}

export interface PullRequestAnalysisPort {
  previewBatch(request: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]>;
  analyzeBatch(request: PullRequestAnalysisBatchRequest): Promise<PullRequestAiReview[]>;
  cancelAnalysis(requestId: string): void;
}
