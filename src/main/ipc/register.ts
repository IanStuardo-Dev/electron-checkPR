import { registerAnalysisIpc } from './analysis';
import { registerRepositoryProviderIpc } from './repository-providers';
import { registerSessionSecretsIpc, SessionSecretsStore } from './session-secrets';
import type { RepositoryProviderRegistry } from '../../services/providers/repository-provider.registry';
import type { RepositoryAnalysisService } from '../../services/analysis/repository-analysis.service';

export function registerIpcHandlers(
  providerRegistry: RepositoryProviderRegistry,
  repositoryAnalysisService: RepositoryAnalysisService,
): void {
  registerRepositoryProviderIpc(providerRegistry);
  registerAnalysisIpc(repositoryAnalysisService);
  registerSessionSecretsIpc(new SessionSecretsStore());
}
