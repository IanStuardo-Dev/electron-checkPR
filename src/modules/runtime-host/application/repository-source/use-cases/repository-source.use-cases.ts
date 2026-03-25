import type { RepositorySourceProviderPort } from '../../../../../services/providers/repository-provider.port';
import type { RepositoryConnectionConfig, RepositoryProviderKind } from '../../../../../types/repository';
import { supportsRepositoryProviderCapability } from '../../../../../services/providers/repository-provider.capabilities';
import { validateExternalUrl } from '../services/external-link-policy.service';

export interface RepositorySourceProviderRegistryPort {
  get(kind: RepositoryProviderKind): RepositorySourceProviderPort;
}

export interface ExternalLinkOpenerPort {
  openExternal(url: string): Promise<void>;
}

export interface RepositorySourceOperations {
  fetchPullRequests(config: RepositoryConnectionConfig): Promise<unknown[]>;
  fetchProjects(config: RepositoryConnectionConfig): Promise<unknown[]>;
  fetchRepositories(config: RepositoryConnectionConfig): Promise<unknown[]>;
  fetchBranches(config: RepositoryConnectionConfig): Promise<unknown[]>;
  openExternal(url: string): Promise<void>;
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

export function createRepositorySourceOperations(
  providerRegistry: RepositorySourceProviderRegistryPort,
  externalLinkOpener: ExternalLinkOpenerPort,
): RepositorySourceOperations {
  return {
    fetchPullRequests(config) {
      return resolveRepositorySourceProvider(providerRegistry, config).getPullRequests(config);
    },
    fetchProjects(config) {
      return resolveRepositorySourceProvider(providerRegistry, config).getProjects(config);
    },
    fetchRepositories(config) {
      return resolveRepositorySourceProvider(providerRegistry, config).getRepositories(config);
    },
    fetchBranches(config) {
      return resolveRepositorySourceProvider(providerRegistry, config).getBranches(config);
    },
    async openExternal(url) {
      await externalLinkOpener.openExternal(validateExternalUrl(url));
    },
  };
}

