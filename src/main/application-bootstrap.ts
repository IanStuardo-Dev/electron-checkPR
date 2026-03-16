import { registerIpcHandlers } from './ipc/register';
import { createWindow } from './main-window';
import { buildDefaultRepositoryProviderPorts } from '../services/providers/repository-provider.bootstrap';
import { createRepositoryProviderRegistry } from '../services/providers/repository-provider.composition';
import { RepositoryAnalysisSnapshotProvider } from '../services/analysis/repository-analysis.snapshot-provider';
import { RepositoryAnalysisService } from '../services/analysis/repository-analysis.service';
import { PullRequestAnalysisSnapshotProvider } from '../services/analysis/pull-request-analysis.snapshot-provider';
import { PullRequestAnalysisService } from '../services/analysis/pull-request-analysis.service';
import { RepositoryAnalysisPromptBuilder } from '../services/analysis/repository-analysis.prompt-builder';
import { OpenAIRepositoryAnalysisClient } from '../services/analysis/repository-analysis.openai-client';
import { RepositoryAnalysisResponseParser } from '../services/analysis/repository-analysis.response-parser';
import { PullRequestAnalysisPromptBuilder } from '../services/analysis/pull-request-analysis.prompt-builder';
import { OpenAIPullRequestAnalysisClient } from '../services/analysis/pull-request-analysis.openai-client';
import { PullRequestAnalysisResponseParser } from '../services/analysis/pull-request-analysis.response-parser';

export function createApplicationServices() {
  const providerRegistry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
  const repositoryAnalysisService = new RepositoryAnalysisService(
    new RepositoryAnalysisSnapshotProvider(providerRegistry),
    new RepositoryAnalysisPromptBuilder(),
    new OpenAIRepositoryAnalysisClient(),
    new RepositoryAnalysisResponseParser(),
  );
  const pullRequestAnalysisService = new PullRequestAnalysisService(
    new PullRequestAnalysisSnapshotProvider(providerRegistry),
    new PullRequestAnalysisPromptBuilder(),
    new OpenAIPullRequestAnalysisClient(),
    new PullRequestAnalysisResponseParser(),
  );

  return {
    providerRegistry,
    repositoryAnalysisService,
    pullRequestAnalysisService,
  };
}

export function bootstrapMainProcess() {
  const { providerRegistry, repositoryAnalysisService, pullRequestAnalysisService } = createApplicationServices();
  registerIpcHandlers(providerRegistry, repositoryAnalysisService, pullRequestAnalysisService);
  return createWindow();
}
