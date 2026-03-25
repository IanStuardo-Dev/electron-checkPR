import { SessionSecretsStore } from '../modules/runtime-host/application/session-secrets/services/session-secrets-store.service';
import { wireRuntimeHostBridge } from './runtime-host-bridge-registration';
import { createWindow } from './main-window';
import { buildDefaultRepositoryProviderModules } from '../services/providers/repository-provider.bootstrap';
import { createRepositoryProviderCapabilityRegistriesFromModules } from '../services/providers/repository-provider.composition';
import { RepositoryAnalysisSnapshotProvider } from '../services/analysis/repository-analysis.snapshot-provider';
import { PullRequestAnalysisSnapshotProvider } from '../services/analysis/pull-request-analysis.snapshot-provider';
import { createRepositoryAnalysisService } from '../services/analysis/repository-analysis.factory';
import { createPullRequestAnalysisService } from '../services/analysis/pull-request-analysis.factory';

export function createApplicationServices() {
  const providerRegistries = createRepositoryProviderCapabilityRegistriesFromModules(buildDefaultRepositoryProviderModules());
  const repositoryAnalysisService = createRepositoryAnalysisService({
    snapshotProvider: new RepositoryAnalysisSnapshotProvider(providerRegistries.repositorySnapshots),
  });
  const pullRequestAnalysisService = createPullRequestAnalysisService({
    snapshotProvider: new PullRequestAnalysisSnapshotProvider(providerRegistries.pullRequestSnapshots),
  });

  return {
    providerRegistry: providerRegistries.source,
    repositoryAnalysisService,
    pullRequestAnalysisService,
  };
}

export function bootstrapMainProcess() {
  const { providerRegistry, repositoryAnalysisService, pullRequestAnalysisService } = createApplicationServices();
  wireRuntimeHostBridge(
    providerRegistry,
    repositoryAnalysisService,
    pullRequestAnalysisService,
    new SessionSecretsStore(),
  );
  return createWindow();
}


