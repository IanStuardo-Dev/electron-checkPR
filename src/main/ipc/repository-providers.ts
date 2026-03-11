import { shell } from 'electron';
import { getRepositoryProviderPort } from '../../services/providers/repository-provider.registry';
import type { RepositoryConnectionConfig, RepositoryProviderKind } from '../../types/repository';
import { validateExternalUrl } from './external-links';
import { registerHandle } from './shared';

function readProvider(config: Pick<RepositoryConnectionConfig, 'provider'>): RepositoryProviderKind {
  if (!config?.provider) {
    throw new Error('Selecciona un provider antes de ejecutar esta accion.');
  }

  return config.provider;
}

export function registerRepositoryProviderIpc(): void {
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchPullRequests', async (config) => (
    getRepositoryProviderPort(readProvider(config)).getPullRequests(config)
  ));
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchProjects', async (config) => (
    getRepositoryProviderPort(readProvider(config)).getProjects(config)
  ));
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchRepositories', async (config) => (
    getRepositoryProviderPort(readProvider(config)).getRepositories(config)
  ));
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchBranches', async (config) => (
    getRepositoryProviderPort(readProvider(config)).getBranches(config)
  ));
  registerHandle<string, void>('repository-source:openExternal', async (url) => {
    await shell.openExternal(validateExternalUrl(url));
  });
}
