import type { RepositoryProviderPort } from './repository-provider.port';
import type { RepositoryProviderModule } from './repository-provider.module';
import { RepositoryProviderRegistryBuilder } from './repository-provider.registry';

export function createRepositoryProviderRegistry(providers: RepositoryProviderPort[] = []) {
  const registryBuilder = new RepositoryProviderRegistryBuilder();
  registryBuilder.registerMany(providers);
  return registryBuilder.build();
}

export function createRepositoryProviderRegistryFromModules(modules: RepositoryProviderModule[] = []) {
  return createRepositoryProviderRegistry(modules.map((module) => module.createPort()));
}
