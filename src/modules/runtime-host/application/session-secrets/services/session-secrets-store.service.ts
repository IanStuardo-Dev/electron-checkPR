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

  has(key: string): boolean {
    return this.sessionSecrets.has(key);
  }
}

