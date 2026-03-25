import type { SessionSecretsStore } from '../services/session-secrets-store.service';

export interface SessionSecretsOperations {
  get(key: string): Promise<string>;
  has(key: string): Promise<boolean>;
  set(payload: { key: string; value: string }): Promise<void>;
}

export function createSessionSecretsOperations(store: SessionSecretsStore): SessionSecretsOperations {
  return {
    async get(key) {
      return store.get(key);
    },
    async has(key) {
      return store.has(key);
    },
    async set(payload) {
      if (!payload?.key || typeof payload.key !== 'string') {
        throw new Error('Secret key is required.');
      }

      store.set(payload.key, payload.value);
    },
  };
}

