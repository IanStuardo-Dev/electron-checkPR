import type { RepositorySourceFetcherPort } from '../data/repositorySourceFetcher';
import type {
  RepositorySourceDiagnosticsPort,
  RepositorySourceSnapshotPort,
  RepositorySourceStatePort,
} from './repositorySourceApiPorts';
import {
  createDiscoverProjectsUseCase,
  createFetchProjectsUseCase,
  createFetchRepositoriesUseCase,
  createOpenExternalLinkUseCase,
  createSyncPullRequestsUseCase,
} from './repositorySourceUseCases';
import type { SavedConnectionConfig } from '../types';

interface CreateRepositorySourceApiOptions {
  configRef: { current: SavedConnectionConfig };
  activeProviderName: string;
  scopeLabel: string;
  state: RepositorySourceStatePort;
  diagnostics: RepositorySourceDiagnosticsPort;
  snapshot: RepositorySourceSnapshotPort;
  fetcher: RepositorySourceFetcherPort;
}

export function createRepositorySourceApi({
  configRef,
  activeProviderName,
  scopeLabel,
  state,
  diagnostics,
  snapshot,
  fetcher,
}: CreateRepositorySourceApiOptions) {
  const fetchProjectsUseCase = createFetchProjectsUseCase({
    fetcher,
    state,
    diagnostics,
    activeProviderName,
  });

  const fetchRepositoriesUseCase = createFetchRepositoriesUseCase({
    fetcher,
    state,
    diagnostics,
    activeProviderName,
  });

  const syncPullRequestsUseCase = createSyncPullRequestsUseCase({
    fetcher,
    state,
    diagnostics,
    snapshot,
    activeProviderName,
    scopeLabel,
  });

  const discoverProjectsUseCase = createDiscoverProjectsUseCase({
    state,
    diagnostics,
    activeProviderName,
  });

  const openExternalLinkUseCase = createOpenExternalLinkUseCase({
    fetcher,
    state,
    configRef,
  });

  return {
    refreshProjects: (nextConfig = configRef.current) => fetchProjectsUseCase(nextConfig),
    refreshRepositories: (nextConfig = configRef.current) => fetchRepositoriesUseCase(nextConfig),
    refreshPullRequests: () => syncPullRequestsUseCase(configRef.current, fetchProjectsUseCase, fetchRepositoriesUseCase),
    discoverProjects: () => discoverProjectsUseCase(configRef.current, fetchProjectsUseCase),
    openPullRequest: (url: string) => openExternalLinkUseCase(url),
  };
}
