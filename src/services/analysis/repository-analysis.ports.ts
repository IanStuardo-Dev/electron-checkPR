import type { RepositoryAnalysisRequest, RepositoryAnalysisResult, RepositorySnapshot } from '../../types/analysis';

export interface AnalysisPromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

export interface SnapshotProviderPort {
  getSnapshot(request: RepositoryAnalysisRequest): Promise<RepositorySnapshot>;
}

export interface AnalysisPromptBuilderPort {
  build(request: RepositoryAnalysisRequest, snapshot: RepositorySnapshot): AnalysisPromptPayload;
}

export interface AnalysisClientPort {
  analyze(input: {
    request: RepositoryAnalysisRequest;
    prompt: AnalysisPromptPayload;
    signal: AbortSignal;
  }): Promise<string>;
}

export interface AnalysisResponseParserPort {
  parse(rawText: string): Omit<
    RepositoryAnalysisResult,
    'provider' | 'repository' | 'branch' | 'model' | 'analyzedAt' | 'snapshot'
  >;
}
