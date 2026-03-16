import type { PullRequestAnalysisBatchRequest, PullRequestSnapshot } from '../../types/analysis';
import type { ReviewItem } from '../../types/repository';

export interface PullRequestAnalysisPromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

export interface PullRequestAnalysisSnapshotProviderPort {
  getSnapshot(
    source: PullRequestAnalysisBatchRequest['source'],
    pullRequest: ReviewItem,
    snapshotPolicy: PullRequestAnalysisBatchRequest['snapshotPolicy'],
  ): Promise<PullRequestSnapshot>;
}

export interface PullRequestAnalysisPromptBuilderPort {
  build(
    request: PullRequestAnalysisBatchRequest,
    snapshot: PullRequestSnapshot,
  ): PullRequestAnalysisPromptPayload;
}

export interface PullRequestAnalysisClientPort {
  analyze(input: {
    request: PullRequestAnalysisBatchRequest;
    prompt: PullRequestAnalysisPromptPayload;
    signal: AbortSignal;
  }): Promise<string>;
}

export interface PullRequestAnalysisResponseParserPort {
  parse(rawText: string): {
    riskScore: number;
    shortSummary: string;
    topConcerns: string[];
    reviewChecklist: string[];
  };
}
