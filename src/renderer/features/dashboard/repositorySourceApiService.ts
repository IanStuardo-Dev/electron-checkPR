import type React from 'react';
import type { ReviewItem } from '../../../types/repository';
import type { RepositorySourceFetcherPort } from './repositorySourceFetcher';
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
import type { useRepositoryDiagnostics } from './hooks/useRepositoryDiagnostics';
import type { useRepositorySourceState } from './hooks/useRepositorySourceState';
import type { SavedConnectionConfig } from './types';

type RepositorySourceState = ReturnType<typeof useRepositorySourceState>;
type RepositorySourceDiagnostics = ReturnType<typeof useRepositoryDiagnostics>;

interface CreateRepositorySourceApiOptions {
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  state: RepositorySourceState;
  diagnostics: RepositorySourceDiagnostics;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
  fetcher: RepositorySourceFetcherPort;
}

export function createRepositorySourceApi({
  configRef,
  activeProviderName,
  scopeLabel,
  state,
  diagnostics,
  onPersistSnapshot,
  fetcher,
}: CreateRepositorySourceApiOptions) {
  async function refreshProjects(nextConfig = configRef.current) {
    if (!nextConfig.provider || !nextConfig.organization || !nextConfig.personalAccessToken) {
      clearProjectsState(state);
      return [];
    }

    state.setProjectsLoading(true);
    clearRepositoryDiagnostics(diagnostics, 'projects', nextConfig);

    try {
      const result = await fetcher.fetchProjects(nextConfig);
      applyProjectsSuccess(state, nextConfig.provider, result);
      return result;
    } catch (fetchError) {
      const message = getRepositorySourceErrorMessage(activeProviderName, fetchError);
      applyProjectsFailure(state, message);
      failRepositoryDiagnostics(diagnostics, 'projects', nextConfig, message);
      return [];
    } finally {
      state.setProjectsLoading(false);
    }
  }

  async function refreshRepositories(nextConfig = configRef.current) {
    if (!nextConfig.provider) {
      clearRepositoriesState(state);
      return [];
    }

    const needsOnlyOrganization = nextConfig.provider === 'github' || nextConfig.provider === 'gitlab';
    const hasMinimumConfig = needsOnlyOrganization
      ? Boolean(nextConfig.organization && nextConfig.personalAccessToken)
      : Boolean(nextConfig.organization && nextConfig.project && nextConfig.personalAccessToken);

    if (!hasMinimumConfig) {
      clearRepositoriesState(state);
      return [];
    }

    state.setRepositoriesLoading(true);
    clearRepositoryDiagnostics(diagnostics, 'repositories', nextConfig);

    try {
      const result = await fetcher.fetchRepositories(nextConfig);
      applyRepositoriesSuccess(state, result);
      return result;
    } catch (fetchError) {
      const message = getRepositorySourceErrorMessage(activeProviderName, fetchError);
      failRepositoryDiagnostics(diagnostics, 'repositories', nextConfig, message);
      applyRepositoriesFailure(state, message);
      return [];
    } finally {
      state.setRepositoriesLoading(false);
    }
  }

  async function refreshPullRequests() {
    const activeConfig = configRef.current;

    if (!activeConfig.provider) {
      state.setError('Selecciona un provider antes de sincronizar.');
      state.setHasSuccessfulConnection(false);
      return;
    }

    state.setIsLoading(true);
    state.setError(null);
    clearRepositoryDiagnostics(diagnostics, 'pullRequests', activeConfig);

    try {
      await refreshProjects(activeConfig);
      await refreshRepositories(activeConfig);
      const result = await fetcher.fetchPullRequests(activeConfig);
      const snapshotTimestamp = applyPullRequestsSuccess(state, result);
      onPersistSnapshot(result, snapshotTimestamp, scopeLabel, activeConfig.targetReviewer);
    } catch (fetchError) {
      const message = getRepositorySourceErrorMessage(activeProviderName, fetchError);
      failRepositoryDiagnostics(diagnostics, 'pullRequests', activeConfig, message);
      applyPullRequestsFailure(state, message);
    } finally {
      state.setIsLoading(false);
    }
  }

  async function discoverProjects() {
    const activeConfig = configRef.current;

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
    await refreshProjects(activeConfig);
  }

  async function openPullRequest(url: string) {
    try {
      if (!configRef.current.provider) {
        throw new Error('Selecciona un provider antes de abrir un PR.');
      }

      await fetcher.openReviewItem(url, configRef.current);
    } catch (openError) {
      const message = openError instanceof Error ? openError.message : 'Unable to open pull request.';
      state.setError(message);
    }
  }

  return {
    refreshProjects,
    refreshRepositories,
    refreshPullRequests,
    discoverProjects,
    openPullRequest,
  };
}
