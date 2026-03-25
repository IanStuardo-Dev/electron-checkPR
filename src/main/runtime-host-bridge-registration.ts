import { createAnalysisOperations } from '../modules/runtime-host/application/analysis/use-cases/analysis.use-cases';
import type { SessionSecretsStore } from '../modules/runtime-host/application/session-secrets/services/session-secrets-store.service';
import { createAnalysisApiKeyResolver } from '../modules/runtime-host/infrastructure/electron/adapters/session-secrets-analysis-api-key-resolver';
import { createShellExternalLinkOpener } from '../modules/runtime-host/infrastructure/electron/adapters/shell-external-link-opener';
import { bindAnalysisBridge } from '../modules/runtime-host/presentation/adapters/analysis-adapter';
import { bindRepositorySourceProviderBridge } from '../modules/runtime-host/presentation/adapters/repository-source-adapter';
import { bindSessionSecretsStoreBridge } from '../modules/runtime-host/presentation/adapters/session-secrets-adapter';
import { bindWindowControlsBridge } from '../modules/runtime-host/presentation/adapters/window-controls-adapter';
import type { PullRequestAnalysisPort, RepositoryAnalysisPort } from '../modules/runtime-host/application/analysis/ports/analysis-services.port';
import type { RepositoryProviderRegistry } from '../services/providers/repository-provider.registry';

export function wireRuntimeHostBridge(
  providerRegistry: RepositoryProviderRegistry,
  repositoryAnalysisService: RepositoryAnalysisPort,
  pullRequestAnalysisService: PullRequestAnalysisPort,
  sessionSecretsStore: SessionSecretsStore,
): void {
  bindRepositorySourceProviderBridge(providerRegistry, createShellExternalLinkOpener());
  bindAnalysisBridge(createAnalysisOperations(
    repositoryAnalysisService,
    pullRequestAnalysisService,
    createAnalysisApiKeyResolver(sessionSecretsStore),
  ));
  bindSessionSecretsStoreBridge(sessionSecretsStore);
  bindWindowControlsBridge();
}

