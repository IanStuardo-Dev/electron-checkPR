import { shell } from 'electron';
import type { RepositorySourceProviderPort } from '../../services/providers/repository-provider.port';
import type { RepositoryConnectionConfig, RepositoryProviderKind } from '../../types/repository';
import { supportsRepositoryProviderCapability } from '../../services/providers/repository-provider.capabilities';
import { validateExternalUrl } from './external-links';
import { registerHandle } from './shared';

interface RepositorySourceProviderRegistryPort {
  get(kind: RepositoryProviderKind): RepositorySourceProviderPort;
}

function readProvider(config: Pick<RepositoryConnectionConfig, 'provider'>): RepositoryProviderKind {
  if (!config?.provider) {
    throw new Error('Selecciona un provider antes de ejecutar esta accion.');
  }

  return config.provider;
}

function resolveRepositorySourceProvider(
  providerRegistry: RepositorySourceProviderRegistryPort,
  config: Pick<RepositoryConnectionConfig, 'provider'>,
) {
  const providerKind = readProvider(config);

  if (!supportsRepositoryProviderCapability(providerKind, 'supportsRepositorySource')) {
    throw new Error(`El provider ${providerKind} aun no soporta operaciones de repository source.`);
  }

  return providerRegistry.get(providerKind);
}

export function registerRepositoryProviderIpc(providerRegistry: RepositorySourceProviderRegistryPort): void {
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchPullRequests', async (config) => (
    resolveRepositorySourceProvider(providerRegistry, config).getPullRequests(config)
  ));
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchProjects', async (config) => (
    resolveRepositorySourceProvider(providerRegistry, config).getProjects(config)
  ));
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchRepositories', async (config) => (
    resolveRepositorySourceProvider(providerRegistry, config).getRepositories(config)
  ));
  registerHandle<RepositoryConnectionConfig, unknown[]>('repository-source:fetchBranches', async (config) => (
    resolveRepositorySourceProvider(providerRegistry, config).getBranches(config)
  ));
  registerHandle<string, void>('repository-source:openExternal', async (url) => {
    await shell.openExternal(validateExternalUrl(url));
  });
}
