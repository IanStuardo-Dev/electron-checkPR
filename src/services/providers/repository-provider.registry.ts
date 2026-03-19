import type { RepositoryProviderKind } from '../../types/repository';
import type { RepositoryProviderPort } from './repository-provider.port';

export interface RepositoryProviderRegistry {
  get(kind: RepositoryProviderKind): RepositoryProviderPort;
  list(): RepositoryProviderPort[];
}

class InMemoryRepositoryProviderRegistry implements RepositoryProviderRegistry {
  constructor(
    private readonly providers: ReadonlyMap<RepositoryProviderKind, RepositoryProviderPort>,
  ) {}

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
}

export class RepositoryProviderRegistryBuilder {
  private readonly providers = new Map<RepositoryProviderKind, RepositoryProviderPort>();

  register(provider: RepositoryProviderPort): void {
    this.providers.set(provider.kind, provider);
  }

  registerMany(providers: RepositoryProviderPort[]): void {
    providers.forEach((provider) => this.register(provider));
  }

  clear(): void {
    this.providers.clear();
  }

  build(): RepositoryProviderRegistry {
    return new InMemoryRepositoryProviderRegistry(new Map(this.providers));
  }
}
