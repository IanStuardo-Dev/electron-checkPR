import React from 'react';
import type { ReviewItem } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';
import { useRepositoryDiagnostics } from './useRepositoryDiagnostics';
import { useRepositorySourceApi } from './useRepositorySourceApi';
import { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceOperationsOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
}

export function useRepositorySourceOperations({
  config,
  configRef,
  activeProviderName,
  scopeLabel,
  onPersistSnapshot,
}: UseRepositorySourceOperationsOptions) {
  const state = useRepositorySourceState(config.provider);
  const diagnostics = useRepositoryDiagnostics(config);
  const api = useRepositorySourceApi({
    config,
    configRef,
    activeProviderName,
    scopeLabel,
    state,
    diagnostics,
    onPersistSnapshot,
  });

  const resetForConfigChange = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    state.resetForConfigChange(name, value);
    diagnostics.resetDiagnosticsError();
  }, [diagnostics, state]);

  const handleConfigChanged = React.useCallback(() => undefined, []);

  const openConnectionPanel = React.useCallback(() => {
    state.setIsConnectionPanelOpen(true);
  }, [state]);

  const selectProject = React.useCallback((project: string) => {
    state.markProjectSelection(project);
  }, [state]);

  return {
    pullRequests: state.pullRequests,
    projects: state.projects,
    repositories: state.repositories,
    error: state.error,
    projectDiscoveryWarning: state.projectDiscoveryWarning,
    isLoading: state.isLoading,
    projectsLoading: state.projectsLoading,
    repositoriesLoading: state.repositoriesLoading,
    lastUpdatedAt: state.lastUpdatedAt,
    hasSuccessfulConnection: state.hasSuccessfulConnection,
    diagnostics: diagnostics.diagnostics,
    isConnectionPanelOpen: state.isConnectionPanelOpen,
    resetForConfigChange,
    handleConfigChanged,
    refreshPullRequests: api.refreshPullRequests,
    refreshProjects: api.refreshProjects,
    refreshRepositories: api.refreshRepositories,
    discoverProjects: api.discoverProjects,
    selectProject,
    openPullRequest: api.openPullRequest,
    openConnectionPanel,
  };
}
