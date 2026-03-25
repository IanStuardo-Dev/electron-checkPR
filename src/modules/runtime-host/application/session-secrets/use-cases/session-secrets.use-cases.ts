import type { SessionSecretsStore } from '../services/session-secrets-store.service';
import { CODEX_SESSION_API_KEY } from '../../../../../constants/session-secrets';

export interface SessionSecretsOperations {
  get(key: string): Promise<string>;
  has(key: string): Promise<boolean>;
  hasCodexApiKey(): Promise<boolean>;
  set(payload: { key: string; value: string }): Promise<void>;
}

function ensureCodexKeyIsNotReadable(key: string): void {
  if (key === CODEX_SESSION_API_KEY) {
    throw new Error('La API key de Codex no puede leerse desde renderer.');
  }
}

export function createSessionSecretsOperations(store: SessionSecretsStore): SessionSecretsOperations {
  return {
    async get(key) {
      ensureCodexKeyIsNotReadable(key);
      return store.get(key);
    },
    async has(key) {
      return store.has(key);
    },
    async hasCodexApiKey() {
      return store.has(CODEX_SESSION_API_KEY);
    },
    async set(payload) {
      if (!payload?.key || typeof payload.key !== 'string') {
        throw new Error('Secret key is required.');
      }

      store.set(payload.key, payload.value);
    },
  };
}
