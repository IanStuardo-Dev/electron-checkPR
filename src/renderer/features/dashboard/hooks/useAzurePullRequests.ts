import React from 'react';
import type { ReviewItem } from '../../../../types/repository';
import { getRepositoryProvider } from '../../repository-source/providers';
import { buildScopeLabel, getProviderDisplayName } from '../repositorySourceDiagnostics';
import type { SavedConnectionConfig } from '../types';
import { useRepositorySourceBootstrap } from './useRepositorySourceBootstrap';
import { useRepositorySourceConfig } from './useRepositorySourceConfig';
import { useRepositorySourceDerived } from './useRepositorySourceDerived';
import { useRepositorySourceOperations } from './useRepositorySourceOperations';
import { persistRepositorySourceSnapshot } from '../repositorySourcePersistence';

interface RepositorySourceConfigHandlers {
  onConfigChangeStart: (name: keyof SavedConnectionConfig, value: string) => void;
  onProjectSelected: (project: string) => void;
}

export function useRepositorySource() {
  const configHandlersRef = React.useRef<RepositorySourceConfigHandlers | null>(null);
  const configHook = useRepositorySourceConfig({
    onConfigChangeStart: (name, value) => configHandlersRef.current?.onConfigChangeStart(name, value),
    onProjectSelected: (project) => configHandlersRef.current?.onProjectSelected(project),
  });
  const { config, configRef, updateConfig, selectProjectConfig, hydrateSecret } = configHook;
  const activeProviderName = React.useMemo(
    () => getProviderDisplayName(getRepositoryProvider(config.provider)),
    [config.provider],
  );
  const baseScopeLabel = React.useMemo(() => buildScopeLabel(config, null, null), [config]);

  const persistSnapshot = React.useCallback((result: ReviewItem[], snapshotTimestamp: Date, _snapshotScopeLabel: string, targetReviewer?: string) => {
    persistRepositorySourceSnapshot(configRef.current, result, snapshotTimestamp, targetReviewer);
  }, [configRef]);

  const {
    pullRequests,
    projects,
    repositories,
    error,
    projectDiscoveryWarning,
    isLoading,
    projectsLoading,
    repositoriesLoading,
    lastUpdatedAt,
    hasSuccessfulConnection,
    diagnostics,
    isConnectionPanelOpen,
    resetForConfigChange,
    refreshPullRequests,
    discoverProjects,
    selectProject,
    openPullRequest,
    openConnectionPanel,
  } = useRepositorySourceOperations({
    config,
    configRef,
    activeProviderName,
    scopeLabel: baseScopeLabel,
    onPersistSnapshot: persistSnapshot,
  });

  configHandlersRef.current = {
    onConfigChangeStart: resetForConfigChange,
    onProjectSelected: selectProject,
  };
  const derived = useRepositorySourceDerived({
    config,
    projects,
    repositories,
    pullRequests,
    lastUpdatedAt,
    hasSuccessfulConnection,
  });

  useRepositorySourceBootstrap({
    configRef,
    hydrateSecret,
    updateConfig,
    refreshPullRequests,
  });

  return {
    activeProvider: derived.activeProvider,
    activeProviderName: derived.activeProviderName,
    config,
    error,
    isLoading,
    projects,
    projectsLoading,
    projectDiscoveryWarning,
    repositories,
    repositoriesLoading,
    hasCredentialsInSession: derived.hasCredentialsInSession,
    hasSuccessfulConnection,
    isConnectionReady: derived.isConnectionReady,
    diagnostics,
    selectedProjectName: derived.selectedProjectName,
    selectedRepositoryName: derived.selectedRepositoryName,
    summary: derived.summary,
    isConnectionPanelOpen,
    updateConfig,
    discoverProjects,
    selectProject: selectProjectConfig,
    refreshPullRequests,
    openPullRequest,
    openConnectionPanel,
  };
}

export const useAzurePullRequests = useRepositorySource;
