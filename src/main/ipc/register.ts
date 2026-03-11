import { registerAnalysisIpc } from './analysis';
import { registerRepositoryProviderIpc } from './repository-providers';
import { registerSessionSecretsIpc, SessionSecretsStore } from './session-secrets';

export function registerIpcHandlers(): void {
  registerRepositoryProviderIpc();
  registerAnalysisIpc();
  registerSessionSecretsIpc(new SessionSecretsStore());
}
