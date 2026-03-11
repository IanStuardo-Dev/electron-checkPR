import type { RepositoryProviderPort } from './repository-provider.port';
import { RepositoryProviderRegistry } from './repository-provider.registry';

export function createRepositoryProviderRegistry(providers: RepositoryProviderPort[] = []) {
  const registry = new RepositoryProviderRegistry();
  registry.registerMany(providers);
  return registry;
}

