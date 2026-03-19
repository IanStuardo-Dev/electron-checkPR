import type {
  PullRequestAnalysisClientPort,
  PullRequestAnalysisPromptBuilderPort,
  PullRequestAnalysisResponseParserPort,
  PullRequestAnalysisSnapshotProviderPort,
} from './pull-request-analysis.ports';
import { resolveAnalysisServiceComposition } from './analysis-service.composition';
import { OpenAIPullRequestAnalysisClient } from './pull-request-analysis.openai-client';
import { PullRequestAnalysisPromptBuilder } from './pull-request-analysis.prompt-builder';
import { PullRequestAnalysisResponseParser } from './pull-request-analysis.response-parser';
import { PullRequestAnalysisService } from './pull-request-analysis.service';

export interface PullRequestAnalysisServiceDependencies {
  snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  promptBuilder?: PullRequestAnalysisPromptBuilderPort;
  analysisClient?: PullRequestAnalysisClientPort;
  responseParser?: PullRequestAnalysisResponseParserPort;
}

export function createPullRequestAnalysisService({
  snapshotProvider,
  promptBuilder,
  analysisClient,
  responseParser,
}: PullRequestAnalysisServiceDependencies): PullRequestAnalysisService {
  return new PullRequestAnalysisService(resolveAnalysisServiceComposition({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  }, {
    createPromptBuilder: () => new PullRequestAnalysisPromptBuilder(),
    createAnalysisClient: () => new OpenAIPullRequestAnalysisClient(),
    createResponseParser: () => new PullRequestAnalysisResponseParser(),
  }));
}
