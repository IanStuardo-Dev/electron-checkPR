import React from 'react';
import type { ReviewItem } from '../../../../types/repository';
import { fetchProjects, fetchPullRequests, fetchRepositories, openReviewItem } from '../ipc';
import type { SavedConnectionConfig } from '../types';
import { useRepositoryDiagnostics } from './useRepositoryDiagnostics';
import { useRepositorySourceEffects } from './useRepositorySourceEffects';
import { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceApiOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  state: ReturnType<typeof useRepositorySourceState>;
  diagnostics: ReturnType<typeof useRepositoryDiagnostics>;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
}

export function useRepositorySourceApi({
  config,
  configRef,
  activeProviderName,
  scopeLabel,
  state,
  diagnostics,
  onPersistSnapshot,
}: UseRepositorySourceApiOptions) {
  const refreshProjects = React.useCallback(async (nextConfig = configRef.current) => {
    if (!nextConfig.provider || !nextConfig.organization || !nextConfig.personalAccessToken) {
      state.setProjects([]);
      return [];
    }

    state.setProjectsLoading(true);
    diagnostics.updateDiagnostics('projects', nextConfig, null);

    try {
      const result = await fetchProjects(nextConfig);
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
          ? 'No se pudieron listar proyectos automáticamente. Puedes escribir el proyecto manualmente y seguir trabajando.'
          : message,
      );
      return [];
    } finally {
      state.setProjectsLoading(false);
    }
  }, [activeProviderName, configRef, diagnostics, state]);

  const refreshRepositories = React.useCallback(async (nextConfig = configRef.current) => {
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
      const result = await fetchRepositories(nextConfig);
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
  }, [activeProviderName, configRef, diagnostics, state]);

  const refreshPullRequests = React.useCallback(async () => {
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
      const result = await fetchPullRequests(activeConfig);
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
  }, [activeProviderName, configRef, diagnostics, onPersistSnapshot, refreshProjects, refreshRepositories, scopeLabel, state]);

  const discoverProjects = React.useCallback(async () => {
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
  }, [activeProviderName, configRef, diagnostics, refreshProjects, state]);

  const openPullRequest = React.useCallback(async (url: string) => {
    try {
      if (!configRef.current.provider) {
        throw new Error('Selecciona un provider antes de abrir un PR.');
      }

      await openReviewItem(url, configRef.current);
    } catch (openError) {
      const message = openError instanceof Error ? openError.message : 'Unable to open pull request.';
      state.setError(message);
    }
  }, [configRef, state]);

  useRepositorySourceEffects({
    config,
    configRef,
    state,
    refreshRepositories,
  });

  return {
    refreshProjects,
    refreshRepositories,
    refreshPullRequests,
    discoverProjects,
    openPullRequest,
  };
}
