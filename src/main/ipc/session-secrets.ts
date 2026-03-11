import { registerHandle } from './shared';

export class SessionSecretsStore {
  private readonly sessionSecrets = new Map<string, string>();

  get(key: string): string {
    return this.sessionSecrets.get(key) || '';
  }

  set(key: string, value: string): void {
    if (value) {
      this.sessionSecrets.set(key, value);
      return;
    }

    this.sessionSecrets.delete(key);
  }
}

export function registerSessionSecretsIpc(store: SessionSecretsStore): void {
  registerHandle<string, string>('session-secrets:get', async (key) => store.get(key));
  registerHandle<{ key: string; value: string }, void>('session-secrets:set', async (payload) => {
    if (!payload?.key || typeof payload.key !== 'string') {
      throw new Error('Secret key is required.');
    }

    store.set(payload.key, payload.value);
  });
}
