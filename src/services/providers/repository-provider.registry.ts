import type { RepositoryProviderKind } from '../../types/repository';
import type { RepositoryProviderPort } from './repository-provider.port';

export class RepositoryProviderRegistry {
  private readonly providers = new Map<RepositoryProviderKind, RepositoryProviderPort>();

  register(provider: RepositoryProviderPort): void {
    this.providers.set(provider.kind, provider);
  }

  registerMany(providers: RepositoryProviderPort[]): void {
    providers.forEach((provider) => this.register(provider));
  }

  get(kind: RepositoryProviderKind): RepositoryProviderPort {
    const provider = this.providers.get(kind);
    if (!provider) {
      throw new Error(`El provider ${kind} aun no esta registrado.`);
    }

    return provider;
  }

  list(): RepositoryProviderPort[] {
    return Array.from(this.providers.values());
  }

  clear(): void {
    this.providers.clear();
  }
}
