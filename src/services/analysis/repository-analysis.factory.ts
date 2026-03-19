import type { SnapshotProviderPort, AnalysisPromptBuilderPort, AnalysisClientPort, AnalysisResponseParserPort } from './repository-analysis.ports';
import { resolveAnalysisServiceComposition } from './analysis-service.composition';
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
  promptBuilder,
  analysisClient,
  responseParser,
}: RepositoryAnalysisServiceDependencies): RepositoryAnalysisService {
  return new RepositoryAnalysisService(resolveAnalysisServiceComposition({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  }, {
    createPromptBuilder: () => new RepositoryAnalysisPromptBuilder(),
    createAnalysisClient: () => new OpenAIRepositoryAnalysisClient(),
    createResponseParser: () => new RepositoryAnalysisResponseParser(),
  }));
}
