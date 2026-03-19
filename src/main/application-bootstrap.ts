import { registerIpcHandlers } from './ipc/register';
import { SessionSecretsStore } from './ipc/session-secrets';
import { createWindow } from './main-window';
import { buildDefaultRepositoryProviderModules } from '../services/providers/repository-provider.bootstrap';
import { createRepositoryProviderRegistryFromModules } from '../services/providers/repository-provider.composition';
import { RepositoryAnalysisSnapshotProvider } from '../services/analysis/repository-analysis.snapshot-provider';
import { PullRequestAnalysisSnapshotProvider } from '../services/analysis/pull-request-analysis.snapshot-provider';
import { createRepositoryAnalysisService } from '../services/analysis/repository-analysis.factory';
import { createPullRequestAnalysisService } from '../services/analysis/pull-request-analysis.factory';

export function createApplicationServices() {
  const providerRegistry = createRepositoryProviderRegistryFromModules(buildDefaultRepositoryProviderModules());
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
  registerIpcHandlers(
    providerRegistry,
    repositoryAnalysisService,
    pullRequestAnalysisService,
    new SessionSecretsStore(),
  );
  return createWindow();
}
