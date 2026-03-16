import { registerAnalysisIpc } from './analysis';
import { registerRepositoryProviderIpc } from './repository-providers';
import { registerSessionSecretsIpc, SessionSecretsStore } from './session-secrets';
import { registerWindowControlsIpc } from './window-controls';
import type { RepositoryProviderRegistry } from '../../services/providers/repository-provider.registry';
import type { RepositoryAnalysisService } from '../../services/analysis/repository-analysis.service';
import type { PullRequestAnalysisService } from '../../services/analysis/pull-request-analysis.service';

export function registerIpcHandlers(
  providerRegistry: RepositoryProviderRegistry,
  repositoryAnalysisService: RepositoryAnalysisService,
  pullRequestAnalysisService: PullRequestAnalysisService,
): void {
  const sessionSecretsStore = new SessionSecretsStore();
  registerRepositoryProviderIpc(providerRegistry);
  registerAnalysisIpc(repositoryAnalysisService, pullRequestAnalysisService, sessionSecretsStore);
  registerSessionSecretsIpc(sessionSecretsStore);
  registerWindowControlsIpc();
}
