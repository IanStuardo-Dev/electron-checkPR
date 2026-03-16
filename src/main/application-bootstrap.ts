import { registerIpcHandlers } from './ipc/register';
import { createWindow } from './main-window';
import { buildDefaultRepositoryProviderPorts } from '../services/providers/repository-provider.bootstrap';
import { createRepositoryProviderRegistry } from '../services/providers/repository-provider.composition';
import { RepositoryAnalysisSnapshotProvider } from '../services/analysis/repository-analysis.snapshot-provider';
import { PullRequestAnalysisSnapshotProvider } from '../services/analysis/pull-request-analysis.snapshot-provider';
import { createRepositoryAnalysisService } from '../services/analysis/repository-analysis.factory';
import { createPullRequestAnalysisService } from '../services/analysis/pull-request-analysis.factory';

export function createApplicationServices() {
  const providerRegistry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
  const repositoryAnalysisService = createRepositoryAnalysisService({
    snapshotProvider: new RepositoryAnalysisSnapshotProvider(providerRegistry),
  });
  const pullRequestAnalysisService = createPullRequestAnalysisService({
    snapshotProvider: new PullRequestAnalysisSnapshotProvider(providerRegistry),
  });

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
