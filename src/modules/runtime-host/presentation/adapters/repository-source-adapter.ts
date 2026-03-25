import {
  createRepositorySourceOperations,
  type RepositorySourceProviderRegistryPort,
  type ExternalLinkOpenerPort,
  type RepositorySourceOperations,
} from '../../application/repository-source/use-cases/repository-source.use-cases';
import type { RepositoryConnectionConfig } from '../../../../types/repository';
import { registerBridgeCommand } from './bridge-response';

export function bindRepositorySourceBridge(operations: RepositorySourceOperations): void {
  registerBridgeCommand<RepositoryConnectionConfig, unknown[]>('repository-source:fetchPullRequests', async (config) => (
    operations.fetchPullRequests(config)
  ));
  registerBridgeCommand<RepositoryConnectionConfig, unknown[]>('repository-source:fetchProjects', async (config) => (
    operations.fetchProjects(config)
  ));
  registerBridgeCommand<RepositoryConnectionConfig, unknown[]>('repository-source:fetchRepositories', async (config) => (
    operations.fetchRepositories(config)
  ));
  registerBridgeCommand<RepositoryConnectionConfig, unknown[]>('repository-source:fetchBranches', async (config) => (
    operations.fetchBranches(config)
  ));
  registerBridgeCommand<string, void>('repository-source:openExternal', async (url) => (
    operations.openExternal(url)
  ));
}

export function bindRepositorySourceProviderBridge(
  providerRegistry: RepositorySourceProviderRegistryPort,
  externalLinkOpener: ExternalLinkOpenerPort,
): void {
  const operations = createRepositorySourceOperations(
    providerRegistry,
    externalLinkOpener,
  );
  bindRepositorySourceBridge(operations);
}



