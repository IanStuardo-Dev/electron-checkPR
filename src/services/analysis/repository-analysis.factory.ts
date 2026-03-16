import type { SnapshotProviderPort, AnalysisPromptBuilderPort, AnalysisClientPort, AnalysisResponseParserPort } from './repository-analysis.ports';
import { OpenAIRepositoryAnalysisClient } from './repository-analysis.openai-client';
import { RepositoryAnalysisPromptBuilder } from './repository-analysis.prompt-builder';
import { RepositoryAnalysisResponseParser } from './repository-analysis.response-parser';
import { RepositoryAnalysisService } from './repository-analysis.service';

export interface RepositoryAnalysisServiceDependencies {
  snapshotProvider: SnapshotProviderPort;
  promptBuilder?: AnalysisPromptBuilderPort;
  analysisClient?: AnalysisClientPort;
  responseParser?: AnalysisResponseParserPort;
}

export function createRepositoryAnalysisService({
  snapshotProvider,
  promptBuilder = new RepositoryAnalysisPromptBuilder(),
  analysisClient = new OpenAIRepositoryAnalysisClient(),
  responseParser = new RepositoryAnalysisResponseParser(),
}: RepositoryAnalysisServiceDependencies): RepositoryAnalysisService {
  return new RepositoryAnalysisService({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  });
}
