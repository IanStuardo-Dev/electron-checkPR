import type React from 'react';
import type { ReviewItem } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';
import { useRepositorySourceActions } from './useRepositorySourceActions';
import { useRepositoryDiagnostics } from './useRepositoryDiagnostics';
import { useRepositorySourceApi } from './useRepositorySourceApi';
import { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceOperationsOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
  dependencies?: {
    useStateHook?: typeof useRepositorySourceState;
    useDiagnosticsHook?: typeof useRepositoryDiagnostics;
    useActionsHook?: typeof useRepositorySourceActions;
    useApiHook?: typeof useRepositorySourceApi;
  };
}

export function useRepositorySourceOperations({
  config,
  configRef,
  activeProviderName,
  scopeLabel,
  onPersistSnapshot,
  dependencies,
}: UseRepositorySourceOperationsOptions) {
  const useStateHook = dependencies?.useStateHook ?? useRepositorySourceState;
  const useDiagnosticsHook = dependencies?.useDiagnosticsHook ?? useRepositoryDiagnostics;
  const useActionsHook = dependencies?.useActionsHook ?? useRepositorySourceActions;
  const useApiHook = dependencies?.useApiHook ?? useRepositorySourceApi;

  const state = useStateHook(config.provider);
  const diagnostics = useDiagnosticsHook(config);
  const actions = useActionsHook({
    state,
    diagnostics,
  });
  const api = useApiHook({
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
