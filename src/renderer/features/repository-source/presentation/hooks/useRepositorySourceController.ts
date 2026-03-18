import type React from 'react';
import type { ReviewItem } from '../../../../../types/repository';
import type { SavedConnectionConfig } from '../../types';
import { useRepositorySourceActions } from './useRepositorySourceActions';
import { useRepositoryDiagnostics } from './useRepositoryDiagnostics';
import { useRepositorySourceApi } from './useRepositorySourceApi';
import { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceControllerOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
}

export function useRepositorySourceController({
  config,
  configRef,
  activeProviderName,
  scopeLabel,
  onPersistSnapshot,
}: UseRepositorySourceControllerOptions) {
  const state = useRepositorySourceState(config.provider);
  const diagnostics = useRepositoryDiagnostics(config);
  const actions = useRepositorySourceActions({
    state,
    diagnostics,
  });
  const api = useRepositorySourceApi({
    config,
    configRef,
    activeProviderName,
    scopeLabel,
    state,
    diagnostics,
    onPersistSnapshot,
  });

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
    resetForConfigChange: actions.resetForConfigChange,
    refreshPullRequests: api.refreshPullRequests,
    refreshProjects: api.refreshProjects,
    refreshRepositories: api.refreshRepositories,
    discoverProjects: api.discoverProjects,
    selectProject: actions.selectProject,
    openPullRequest: api.openPullRequest,
    openConnectionPanel: actions.openConnectionPanel,
  };
}
