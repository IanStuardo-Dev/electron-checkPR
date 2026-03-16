import type {
  PullRequestAnalysisClientPort,
  PullRequestAnalysisPromptBuilderPort,
  PullRequestAnalysisResponseParserPort,
  PullRequestAnalysisSnapshotProviderPort,
} from './pull-request-analysis.ports';
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
  promptBuilder = new PullRequestAnalysisPromptBuilder(),
  analysisClient = new OpenAIPullRequestAnalysisClient(),
  responseParser = new PullRequestAnalysisResponseParser(),
}: PullRequestAnalysisServiceDependencies): PullRequestAnalysisService {
  return new PullRequestAnalysisService({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  });
}
