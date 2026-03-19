import type { RepositoryProviderDefinition, RepositoryProviderSelection } from '../../../types/repository';
import { getRepositorySourceProviderEntry, listRepositorySourceProviders } from './application/repositorySourceProviderRegistry';

export const repositoryProviders: RepositoryProviderDefinition[] = listRepositorySourceProviders();

export function getRepositoryProvider(kind: RepositoryProviderSelection): RepositoryProviderDefinition | null {
  if (!kind) {
    return null;
  }

  const provider = getRepositorySourceProviderEntry(kind);
  if (!provider) {
    return null;
  }

  const { behavior: _behavior, ...definition } = provider;
  return definition;
}

export function countAvailableRepositoryProviders(): number {
  return repositoryProviders.filter((provider) => provider.status === 'available').length;
}
