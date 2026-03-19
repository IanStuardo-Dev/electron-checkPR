import type { RepositoryProviderPort } from './repository-provider.port';
import type { RepositoryProviderModule } from './repository-provider.module';
import { RepositoryProviderRegistry } from './repository-provider.registry';

export function createRepositoryProviderRegistry(providers: RepositoryProviderPort[] = []) {
  const registry = new RepositoryProviderRegistry();
  registry.registerMany(providers);
  return registry;
}

export function createRepositoryProviderRegistryFromModules(modules: RepositoryProviderModule[] = []) {
  return createRepositoryProviderRegistry(modules.map((module) => module.createPort()));
}
