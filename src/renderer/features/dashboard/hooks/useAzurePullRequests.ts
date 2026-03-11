import React from 'react';
import type { SavedConnectionConfig } from '../types';
import { useRepositorySourceBootstrap } from './useRepositorySourceBootstrap';
import { useRepositorySourceConfig } from './useRepositorySourceConfig';
import { useRepositorySourceDerived } from './useRepositorySourceDerived';
import { useRepositorySourceOperations } from './useRepositorySourceOperations';
import { useRepositorySourceMetadata } from '../useRepositorySourceMetadata';
import { useRepositorySourceSnapshotPersistence } from '../useRepositorySourceSnapshotPersistence';

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
  const { activeProviderName, baseScopeLabel } = useRepositorySourceMetadata(config);
  const persistSnapshot = useRepositorySourceSnapshotPersistence(configRef);

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
