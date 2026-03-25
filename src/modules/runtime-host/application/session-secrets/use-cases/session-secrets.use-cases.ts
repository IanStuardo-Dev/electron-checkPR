import type { SessionSecretsStore } from '../services/session-secrets-store.service';
import {
  CODEX_SESSION_API_KEY,
  LEGACY_REPOSITORY_SOURCE_SESSION_SECRET_KEY,
  REPOSITORY_SOURCE_SESSION_SECRET_KEY,
} from '../../../../../constants/session-secrets';

export interface SessionSecretsOperations {
  get(key: string): Promise<string>;
  has(key: string): Promise<boolean>;
  set(payload: { key: string; value: string }): Promise<void>;
}

const ALLOWED_SESSION_SECRET_KEYS = new Set([
  CODEX_SESSION_API_KEY,
  REPOSITORY_SOURCE_SESSION_SECRET_KEY,
  LEGACY_REPOSITORY_SOURCE_SESSION_SECRET_KEY,
]);

function assertAllowedSecretKey(key: string): string {
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) {
    throw new Error('Secret key is required.');
  }

  if (!ALLOWED_SESSION_SECRET_KEYS.has(normalizedKey)) {
    throw new Error(`Secret key ${normalizedKey} is not allowed.`);
  }

  return normalizedKey;
}

export function createSessionSecretsOperations(store: SessionSecretsStore): SessionSecretsOperations {
  return {
    async get(key) {
      return store.get(assertAllowedSecretKey(key));
    },
    async has(key) {
      return store.has(assertAllowedSecretKey(key));
    },
    async set(payload) {
      const secretKey = assertAllowedSecretKey(payload?.key ?? '');
      store.set(secretKey, payload.value);
    },
  };
}
