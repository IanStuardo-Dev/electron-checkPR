import { registerAnalysisIpc } from './analysis';
import { createAnalysisIpcHandlers } from './analysis-handlers';
import { createAnalysisApiKeyResolver } from './analysis-api-key-resolver';
import { registerRepositoryProviderIpc } from './repository-providers';
import { registerSessionSecretsIpc } from './session-secrets';
import { registerWindowControlsIpc } from './window-controls';
import type { RepositoryProviderRegistry } from '../../services/providers/repository-provider.registry';
import type { RepositoryAnalysisService } from '../../services/analysis/repository-analysis.service';
import type { PullRequestAnalysisService } from '../../services/analysis/pull-request-analysis.service';
import type { SessionSecretsStore } from './session-secrets';

export function registerIpcHandlers(
  providerRegistry: RepositoryProviderRegistry,
  repositoryAnalysisService: RepositoryAnalysisService,
  pullRequestAnalysisService: PullRequestAnalysisService,
  sessionSecretsStore: SessionSecretsStore,
): void {
  registerRepositoryProviderIpc(providerRegistry);
  registerAnalysisIpc(createAnalysisIpcHandlers(
    repositoryAnalysisService,
    pullRequestAnalysisService,
    createAnalysisApiKeyResolver(sessionSecretsStore),
  ));
  registerSessionSecretsIpc(sessionSecretsStore);
  registerWindowControlsIpc();
}
