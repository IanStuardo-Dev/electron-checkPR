import type { RepositorySourceFetcherPort } from '../data/repositorySourceFetcher';
import type {
  RepositorySourceDiagnosticsPort,
  RepositorySourceSnapshotPort,
  RepositorySourceStatePort,
} from './repositorySourceApiPorts';
import {
  clearRepositoryDiagnostics,
  failRepositoryDiagnostics,
  getRepositorySourceErrorMessage,
} from './repositorySourceDiagnosticsService';
import {
  applyProjectsFailure,
  applyProjectsSuccess,
  applyPullRequestsFailure,
  applyPullRequestsSuccess,
  applyRepositoriesFailure,
  applyRepositoriesSuccess,
  clearProjectsState,
  clearRepositoriesState,
} from './repositorySourceStateService';
import { hasMinimumProjectDiscoveryConfig, hasMinimumRepositoryConfig } from './repositorySourceRules';
import type { SavedConnectionConfig } from '../types';

interface RepositorySourceUseCaseDeps {
  fetcher: RepositorySourceFetcherPort;
  state: RepositorySourceStatePort;
  diagnostics: RepositorySourceDiagnosticsPort;
  snapshot: RepositorySourceSnapshotPort;
  configRef: { current: SavedConnectionConfig };
  activeProviderName: string;
  scopeLabel: string;
}

export function createFetchProjectsUseCase({
  fetcher,
  state,
  diagnostics,
  activeProviderName,
}: Omit<RepositorySourceUseCaseDeps, 'snapshot' | 'configRef' | 'scopeLabel'>) {
  return async function fetchProjects(nextConfig: SavedConnectionConfig) {
    if (!hasMinimumProjectDiscoveryConfig(nextConfig)) {
      clearProjectsState(state);
      return [];
    }

    state.setProjectsLoading(true);
    clearRepositoryDiagnostics(diagnostics, 'projects', nextConfig);

    try {
      const result = await fetcher.fetchProjects(nextConfig);
      applyProjectsSuccess(state, nextConfig.provider, result);
      return result;
    } catch (error) {
      const message = getRepositorySourceErrorMessage(activeProviderName, error);
      applyProjectsFailure(state, message);
      failRepositoryDiagnostics(diagnostics, 'projects', nextConfig, message);
      return [];
    } finally {
      state.setProjectsLoading(false);
    }
  };
}

export function createFetchRepositoriesUseCase({
  fetcher,
  state,
  diagnostics,
  activeProviderName,
}: Omit<RepositorySourceUseCaseDeps, 'snapshot' | 'configRef' | 'scopeLabel'>) {
  return async function fetchRepositories(nextConfig: SavedConnectionConfig) {
    if (!hasMinimumRepositoryConfig(nextConfig)) {
      clearRepositoriesState(state);
      return [];
    }

    state.setRepositoriesLoading(true);
    clearRepositoryDiagnostics(diagnostics, 'repositories', nextConfig);

    try {
      const result = await fetcher.fetchRepositories(nextConfig);
      applyRepositoriesSuccess(state, result);
      return result;
    } catch (error) {
      const message = getRepositorySourceErrorMessage(activeProviderName, error);
      failRepositoryDiagnostics(diagnostics, 'repositories', nextConfig, message);
      applyRepositoriesFailure(state, message);
      return [];
    } finally {
      state.setRepositoriesLoading(false);
    }
  };
}

export function createSyncPullRequestsUseCase({
  fetcher,
  state,
  diagnostics,
  snapshot,
  activeProviderName,
  scopeLabel,
}: Omit<RepositorySourceUseCaseDeps, 'configRef'>) {
  return async function syncPullRequests(
    activeConfig: SavedConnectionConfig,
    fetchProjects: (config: SavedConnectionConfig) => Promise<unknown[]>,
    fetchRepositories: (config: SavedConnectionConfig) => Promise<unknown[]>,
  ) {
    if (!activeConfig.provider) {
      state.setError('Selecciona un provider antes de sincronizar.');
      state.setHasSuccessfulConnection(false);
      return;
    }

    state.setIsLoading(true);
    state.setError(null);
    clearRepositoryDiagnostics(diagnostics, 'pullRequests', activeConfig);

    try {
      await fetchProjects(activeConfig);
      await fetchRepositories(activeConfig);
      const result = await fetcher.fetchPullRequests(activeConfig);
      const snapshotTimestamp = applyPullRequestsSuccess(state, result);
      snapshot.persistSnapshot(result, snapshotTimestamp, scopeLabel, activeConfig.targetReviewer);
    } catch (error) {
      const message = getRepositorySourceErrorMessage(activeProviderName, error);
      failRepositoryDiagnostics(diagnostics, 'pullRequests', activeConfig, message);
      applyPullRequestsFailure(state, message);
    } finally {
      state.setIsLoading(false);
    }
  };
}

export function createDiscoverProjectsUseCase({
  state,
  diagnostics,
  activeProviderName,
}: Pick<RepositorySourceUseCaseDeps, 'state' | 'diagnostics' | 'activeProviderName'>) {
  return async function discoverProjects(
    activeConfig: SavedConnectionConfig,
    fetchProjects: (config: SavedConnectionConfig) => Promise<unknown[]>,
  ) {
    if (!activeConfig.provider) {
      const message = 'Selecciona un provider antes de cargar proyectos.';
      state.setError(message);
      failRepositoryDiagnostics(diagnostics, 'projects', activeConfig, message);
      return;
    }

    if (!activeConfig.organization.trim() || !activeConfig.personalAccessToken.trim()) {
      const message = `El alcance principal y el token son obligatorios para cargar ${activeProviderName}.`;
      state.setError(message);
      failRepositoryDiagnostics(diagnostics, 'projects', activeConfig, message);
      return;
    }

    state.setError(null);
    await fetchProjects(activeConfig);
  };
}

export function createOpenExternalLinkUseCase({
  fetcher,
  state,
  configRef,
}: Pick<RepositorySourceUseCaseDeps, 'fetcher' | 'state' | 'configRef'>) {
  return async function openReviewItem(url: string) {
    try {
      if (!configRef.current.provider) {
        throw new Error('Selecciona un provider antes de abrir un PR.');
      }

      await fetcher.openReviewItem(url, configRef.current);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open pull request.';
      state.setError(message);
    }
  };
}
