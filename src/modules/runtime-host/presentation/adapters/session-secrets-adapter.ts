import { createSessionSecretsOperations } from '../../application/session-secrets/use-cases/session-secrets.use-cases';
import type { SessionSecretsStore } from '../../application/session-secrets/services/session-secrets-store.service';
import type { SessionSecretsOperations } from '../../application/session-secrets/use-cases/session-secrets.use-cases';
import { registerBridgeCommand } from './bridge-response';

export function bindSessionSecretsBridge(operations: SessionSecretsOperations): void {
  registerBridgeCommand<string, string>('session-secrets:get', async (key) => operations.get(key));
  registerBridgeCommand<string, boolean>('session-secrets:has', async (key) => operations.has(key));
  registerBridgeCommand<void, boolean>('session-secrets:codex-has', async () => operations.hasCodexApiKey());
  registerBridgeCommand<{ key: string; value: string }, void>('session-secrets:set', async (payload) => {
    await operations.set(payload);
  });
}

export function bindSessionSecretsStoreBridge(store: SessionSecretsStore): void {
  bindSessionSecretsBridge(createSessionSecretsOperations(store));
}


