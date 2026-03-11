import type React from 'react';
import type { ReviewItem } from '../../../types/repository';
import type { RepositorySourceFetcherPort } from './repositorySourceFetcher';
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
      state.setProjects([]);
      return [];
    }

    state.setProjectsLoading(true);
    diagnostics.updateDiagnostics('projects', nextConfig, null);

    try {
      const result = await fetcher.fetchProjects(nextConfig);
      state.setProjects(result);
      if (nextConfig.provider === 'github' || nextConfig.provider === 'gitlab') {
        state.setRepositories(result.map((project) => ({
          id: project.id,
          name: project.name,
        })));
      }
      state.setProjectDiscoveryWarning(null);
      return result;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : `Unknown ${activeProviderName} error.`;
      state.setProjects([]);
      diagnostics.updateDiagnostics('projects', nextConfig, message);
      state.setProjectDiscoveryWarning(
        message.includes('(404)')
          ? 'No se pudieron listar proyectos automaticamente. Puedes escribir el proyecto manualmente y seguir trabajando.'
          : message,
      );
      return [];
    } finally {
      state.setProjectsLoading(false);
    }
  }

  async function refreshRepositories(nextConfig = configRef.current) {
    if (!nextConfig.provider) {
      state.setRepositories([]);
      return [];
    }

    const needsOnlyOrganization = nextConfig.provider === 'github' || nextConfig.provider === 'gitlab';
    const hasMinimumConfig = needsOnlyOrganization
      ? Boolean(nextConfig.organization && nextConfig.personalAccessToken)
      : Boolean(nextConfig.organization && nextConfig.project && nextConfig.personalAccessToken);

    if (!hasMinimumConfig) {
      state.setRepositories([]);
      return [];
    }

    state.setRepositoriesLoading(true);
    diagnostics.updateDiagnostics('repositories', nextConfig, null);

    try {
      const result = await fetcher.fetchRepositories(nextConfig);
      state.setRepositories(result);
      return result;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : `Unknown ${activeProviderName} error.`;
      diagnostics.updateDiagnostics('repositories', nextConfig, message);
      state.setError(message);
      state.setHasSuccessfulConnection(false);
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
    diagnostics.updateDiagnostics('pullRequests', activeConfig, null);

    try {
      await refreshProjects(activeConfig);
      await refreshRepositories(activeConfig);
      const result = await fetcher.fetchPullRequests(activeConfig);
      state.setPullRequests(result);
      const snapshotTimestamp = new Date();
      state.setLastUpdatedAt(snapshotTimestamp);
      state.setHasSuccessfulConnection(true);
      state.setIsConnectionPanelOpen(false);
      onPersistSnapshot(result, snapshotTimestamp, scopeLabel, activeConfig.targetReviewer);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : `Unknown ${activeProviderName} error.`;
      diagnostics.updateDiagnostics('pullRequests', activeConfig, message);
      state.setPullRequests([]);
      state.setLastUpdatedAt(null);
      state.setHasSuccessfulConnection(false);
      state.setError(message);
    } finally {
      state.setIsLoading(false);
    }
  }

  async function discoverProjects() {
    const activeConfig = configRef.current;

    if (!activeConfig.provider) {
      const message = 'Selecciona un provider antes de cargar proyectos.';
      state.setError(message);
      diagnostics.updateDiagnostics('projects', activeConfig, message);
      return;
    }

    if (!activeConfig.organization.trim() || !activeConfig.personalAccessToken.trim()) {
      const message = `El alcance principal y el token son obligatorios para cargar ${activeProviderName}.`;
      state.setError(message);
      diagnostics.updateDiagnostics('projects', activeConfig, message);
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
